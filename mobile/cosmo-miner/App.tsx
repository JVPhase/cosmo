import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState, Component } from 'react';
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  SafeAreaView as RNSAView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  clearAnalytics,
  exportAnalytics,
  flushAnalytics,
  getAnalyticsSizeKb,
  initAnalytics,
  logError,
  logEvent
} from './src/game/analytics';
import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { StoryLogScreen } from './src/screens/StoryLogScreen';
import { BattleScreen } from './src/screens/BattleScreen';
import { GameScreen } from './src/screens/GameScreen';
import { PlanetsScreen } from './src/screens/PlanetsScreen';
import { ResearchScreen } from './src/screens/ResearchScreen';
import { ShipyardScreen } from './src/screens/shipyard';
import { ShopScreen } from './src/screens/ShopScreen';
import { UpgradesScreen } from './src/screens/UpgradesScreen';
import { CharacterCommunicationChannel } from './src/ui/CharacterCommunicationChannel';
import { IntroOverlay } from './src/ui/IntroOverlay';
import { ModalSheet } from './src/ui/ModalSheet';
import { Popup } from './src/ui/Popup';
import { PrestigePopup } from './src/ui/PrestigePopup';
import { formatNum } from './src/game/formatNum';
import { getMetals, type MetalId } from './src/game/METALS';
import { getModuleById } from './src/game/MODULES';
import { PasswordScreen } from './src/ui/PasswordScreen';
import { useGame } from './src/game/useGame';
import {
  clearGame,
  loadGame,
  loadIntroSeen,
  loadUnlocked,
  saveGame,
  saveGameEnvelope,
  saveIntroSeen,
  saveUnlocked
} from './src/game/storage';
import { getAliens } from './src/game/ALIENS';
import { getStoryLogUnlockedEntries } from './src/game/STORY_LOG';
import { isSectorUnlocked } from './src/game/SECTORS';
import { fetchDialogues, type DialoguesPayload } from './src/game/dialogues';
import {
  loadRemoteConfigFromCache,
  fetchAndCacheRemoteConfig
} from './src/game/remoteConfig';
import { loadI18n, loadSavedLocale, saveLocale, t } from './src/game/i18n';
import { invalidatePlanetsCache } from './src/game/PLANETS';
import { invalidateAliensCache } from './src/game/ALIENS';
import { LocalePickerOverlay, type SupportedLocale } from './src/ui/LocalePickerOverlay';
import {
  fetchCloudSave,
  getAccessToken,
  getCloudRev,
  pushCloudSave,
  fetchPendingGrants,
  ackGrants
} from './src/game/cloudSave';
import {
  serializeGameplaySaveV2,
  deserializeGameplaySaveEnvelope,
  pickNewerEnvelope
} from './src/game/saveContract';
import { applyGrants } from './src/game/grants';
import {
  bootstrapTelegram,
  ensureTelegramWebApp,
  getTelegramSafeAreaInsets,
  subscribeTelegramSafeAreaInsets,
  type TelegramSafeAreaInsets,
} from './src/telegram/runtime';
import { telegramAuthIfNeeded } from './src/telegram/auth';
import { getPlanets } from './src/game/PLANETS';
import { getShips } from './src/game/SHIPS';
import { getCannons, computeCannonCost } from './src/game/CANNONS';
import {
  computeUpgradeCost,
  getUpgrades,
  UpgradeId
} from './src/game/UPGRADES';
import { getResearchNodes } from './src/game/RESEARCH';
import type { GameState, GameStateInit } from './src/game/types';

// Feature flag: set EXPO_PUBLIC_GRANT_SYNC_ENABLED=false in .env to disable
// grant-sync bootstrap without a new release. Mirrors GRANT_SYNC_ENABLED on the server.
const GRANT_SYNC_ENABLED =
  (process.env.EXPO_PUBLIC_GRANT_SYNC_ENABLED ?? 'true') !== 'false';

type TabId = 'game' | 'upgrades' | 'planets' | 'shipyard' | 'battle' | 'shop';

const TABS: Array<{ id: TabId; icon: string; labelKey: string }> = [
  { id: 'game', icon: '⛏️', labelKey: 'ui.tabs.game' },
  { id: 'upgrades', icon: '⚡', labelKey: 'ui.tabs.upgrades' },
  { id: 'planets', icon: '🌍', labelKey: 'ui.tabs.planets' },
  { id: 'shipyard', icon: '🛠️', labelKey: 'ui.tabs.shipyard' },
  { id: 'battle', icon: '⚔️', labelKey: 'ui.tabs.battle' },
  { id: 'shop', icon: '🛒', labelKey: 'ui.tabs.shop' },
];

class GameAppErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#050918', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#ff4444', fontSize: 13, fontWeight: '800', marginBottom: 8 }}>CRASH</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textAlign: 'center' }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function TelegramAwareInsets({ children, tgInsets }: { children: React.ReactNode; tgInsets: TelegramSafeAreaInsets }) {
  const insets = useSafeAreaInsets();
  const adjusted = React.useMemo(() => {
    if (!tgInsets.inTelegram) return insets;

    let top: number;
    if (tgInsets.contentTop > 0) {
      // contentSafeAreaInset = Telegram header only → add to system safe area
      top = insets.top + tgInsets.contentTop;
    } else if (tgInsets.sysTop > 0) {
      // safeAreaInset = total area (system + header) → use as replacement
      top = Math.max(insets.top, tgInsets.sysTop);
    } else {
      // Values not yet available → 44 px header fallback
      top = insets.top + 44;
    }

    return { ...insets, top };
  }, [insets, tgInsets]);
  return (
    <SafeAreaInsetsContext.Provider value={adjusted}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

function GameApp({
  initial,
  initialAppliedGrantSeq,
  dialogues,
  tab,
  onSetTab,
  onReset
}: {
  initial: GameStateInit;
  initialAppliedGrantSeq: number;
  dialogues: DialoguesPayload;
  tab: TabId;
  onSetTab: (t: TabId) => void;
  onReset: (showIntro?: boolean) => void;
}) {
  // appliedGrantSeq is the cursor for grant sync.
  // It starts at the value loaded from the save envelope and updates only
  // when new grants are applied during a session (P1). For P0, it is fixed
  // at the bootstrap value.
  const appliedGrantSeqRef = useRef(initialAppliedGrantSeq);
  const game = useGame(initial, dialogues);
  const minAttackEnergy = Math.min(
    ...getAliens().map((a) => a.attackEnergyCost)
  );
  const screenGreetedRef = useRef<Set<string>>(new Set());
  const [researchOpen, setResearchOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [storyLogOpen, setStoryLogOpen] = useState(false);
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [seenStoryCount, setSeenStoryCount] = useState(0);
  const [clickPowerInfoOpen, setClickPowerInfoOpen] = useState(false);
  const [passiveRateInfoOpen, setPassiveRateInfoOpen] = useState(false);
  const [metalInfoOpenId, setMetalInfoOpenId] = useState<MetalId | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetShowIntro, setResetShowIntro] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [analyticsSizeKb, setAnalyticsSizeKb] = useState(0);
  const prevCharacterMessageRef = useRef<string | null>(null);

  useEffect(() => {
    getAnalyticsSizeKb()
      .then(setAnalyticsSizeKb)
      .catch(() => {});
    const interval = setInterval(() => {
      getAnalyticsSizeKb()
        .then(setAnalyticsSizeKb)
        .catch(() => {});
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const handleExportAnalytics = useCallback(async () => {
    try {
      await exportAnalytics();
      getAnalyticsSizeKb()
        .then(setAnalyticsSizeKb)
        .catch(() => {});
    } catch (e: any) {
      Alert.alert(t('alerts.export_error.title'), e?.message ?? t('alerts.export_error.text'));
    }
  }, []);

  const handleClearAnalytics = useCallback(() => {
    Alert.alert(t('alerts.analytics_clear.title'), t('alerts.analytics_clear.text'), [
      { text: t('alerts.analytics_clear.cancel'), style: 'cancel' },
      {
        text: t('alerts.analytics_clear.confirm'),
        style: 'destructive',
        onPress: async () => {
          await clearAnalytics();
          setAnalyticsSizeKb(0);
        }
      }
    ]);
  }, []);
  const [editorFields, setEditorFields] = useState({
    energy: '0',
    iron: '0',
    titan: '0',
    iridium: '0',
    playerXP: '0'
  });
  const [editorToggles, setEditorToggles] = useState({
    unlockUpgrades: false,
    unlockShipyard: false,
    unlockPlanets: false
  });

  // Show CLERK-7 onboarding hint the first time each screen is opened
  useEffect(() => {
    const screenTriggers: Partial<Record<TabId, string>> = {
      upgrades: 'screen_upgrades',
      battle: 'screen_battle',
      shipyard: 'screen_shipyard',
      planets: 'screen_planets'
    };
    const trigger = screenTriggers[tab];
    if (trigger && !screenGreetedRef.current.has(tab)) {
      screenGreetedRef.current.add(tab);
      game.showClerk(trigger as any);
    }
  }, [tab]);

  const goToTab = (t: TabId) => {
    logEvent('tab_switch', { tab: t, via: 'action' });
    setResearchOpen(false);
    setAchievementsOpen(false);
    onSetTab(t);
  };

  const openEditor = () => {
    setEditorFields({
      energy: String(game.energy),
      iron: String(game.metals.iron),
      titan: String(game.metals.titan),
      iridium: String(game.metals.iridium),
      playerXP: String(game.playerXP)
    });
    setEditorToggles({
      unlockUpgrades: upgradesUnlocked,
      unlockShipyard: shipyardUnlocked,
      unlockPlanets: planetsUnlocked
    });
    setEditorOpen(true);
  };

  const applyEditor = () => {
    const parse = (v: string) => {
      const n = Number(v);
      return isNaN(n) || n < 0 ? undefined : Math.floor(n);
    };
    let energy = parse(editorFields.energy) ?? game.energy;
    let iron = parse(editorFields.iron) ?? game.metals.iron;
    game.debugSetValues({
      energy,
      iron,
      titan: parse(editorFields.titan),
      iridium: parse(editorFields.iridium),
      playerXP: parse(editorFields.playerXP),
      tabsUnlocked: {
        upgrades: editorToggles.unlockUpgrades,
        shipyard: editorToggles.unlockShipyard,
        planets: editorToggles.unlockPlanets
      }
    });
    setEditorOpen(false);
  };

  const latestRef = useRef(game);
  useEffect(() => {
    latestRef.current = game;
  });

  const syncPendingGrantsNow = useCallback(async (): Promise<boolean> => {
    if (!GRANT_SYNC_ENABLED) return false;

    const token = await getAccessToken();
    if (!token) return false;

    const baseSeq = appliedGrantSeqRef.current;
    const baseState = serializeGameplaySaveV2(
      latestRef.current as unknown as GameState,
      baseSeq,
    ).state;

    let grants = await fetchPendingGrants(baseSeq);
    for (let attempt = 0; grants.length === 0 && attempt < 9; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      grants = await fetchPendingGrants(baseSeq);
    }

    if (grants.length === 0) return false;

    const { state: stateWithGrants, appliedGrantSeq: newSeq } = applyGrants(
      baseState,
      grants,
      baseSeq,
    );

    if (newSeq <= baseSeq) return false;

    const envelope = {
      version: 2 as const,
      savedAt: Date.now(),
      appliedGrantSeq: newSeq,
      state: stateWithGrants,
    };

    // Apply the grant to React state immediately so the UI updates now.
    const replaceStateFromSync = latestRef.current.replaceStateFromSync;
    appliedGrantSeqRef.current = newSeq;
    latestRef.current = {
      ...latestRef.current,
      ...stateWithGrants,
    } as typeof latestRef.current;
    replaceStateFromSync(stateWithGrants);

    let savedSuccessfully = false;
    try {
      await saveGameEnvelope(envelope);
      savedSuccessfully = true;
    } catch {
      // Local save failed — grant applied to UI but not persisted yet.
      // It remains un-acked on the server, so the next bootstrap will re-apply it.
    }

    if (!savedSuccessfully) return true;

    try {
      const currentRev = await getCloudRev();
      try {
        await pushCloudSave(envelope, currentRev ?? undefined);
      } catch (error: any) {
        if (error?.status === 409) {
          await pushCloudSave(envelope);
        } else {
          throw error;
        }
      }

      await ackGrants(newSeq);
    } catch {
      // Local save already succeeded. Leave the grant unacked; the next sync
      // can safely retry server-side persistence without reapplying locally.
    }

    return true;
  }, []);

  // Auto-open channel when a new character message arrives
  useEffect(() => {
    if (
      game.characterMessage &&
      game.characterMessage !== prevCharacterMessageRef.current
    ) {
      setChannelOpen(true);
    }
    prevCharacterMessageRef.current = game.characterMessage ?? null;
  }, [game.characterMessage]);

  // Save every 3 seconds — full V2 envelope, same format for local and cloud
  useEffect(() => {
    const interval = setInterval(async () => {
      const g = latestRef.current;
      const seq = appliedGrantSeqRef.current;
      const envelope = serializeGameplaySaveV2(g, seq);

      // Local save
      saveGame(g, seq).catch(() => {});
      flushAnalytics().catch(() => {});

      // Cloud autosave — fire-and-forget, ignore 409 conflicts silently
      getAccessToken().then((token) => {
        if (!token) return;
        getCloudRev().then((rev) =>
          pushCloudSave(envelope, rev ?? undefined).catch(() => {})
        );
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const shipyardUnlocked = game.tabsUnlocked.shipyard;
  const upgradesUnlocked = game.tabsUnlocked.upgrades;
  const planetsUnlocked = game.tabsUnlocked.planets;
  const shopUnlocked = game.achievements.claimedIds.length > 0;

  const battleUnlocked =
    !!game.battle || game.unlockedPlanetIds.length > 1 || !!game.defeatInfo;

  // Auto-switch away from hidden tabs
  useEffect(() => {
    if (tab === 'shipyard' && !shipyardUnlocked) onSetTab('game');
  }, [shipyardUnlocked, tab]);

  useEffect(() => {
    if (tab === 'upgrades' && !upgradesUnlocked) onSetTab('game');
  }, [upgradesUnlocked, tab]);

  useEffect(() => {
    if (tab === 'planets' && !planetsUnlocked) onSetTab('game');
  }, [planetsUnlocked, tab]);

  useEffect(() => {
    if (tab === 'battle' && !battleUnlocked) onSetTab('game');
  }, [battleUnlocked, tab]);

  // Auto-switch to game tab after battle victory
  useEffect(() => {
    if (game.battleVictory) {
      onSetTab('game');
      game.clearBattleVictory();
    }
  }, [game.battleVictory]);

  let tabContent: React.ReactNode = null;
  switch (tab) {
    case 'game':
      tabContent = (
        <GameScreen
          energy={game.energy}
          totalEarned={game.totalEarned}
          clickPower={game.clickPower}
          passiveRate={game.passiveRate}
          metals={game.metals}
          discoveredMetals={game.discoveredMetals}
          onMine={game.mineClick}
          planet={game.planet}
          clerkMessage={game.clerkMessage}
          onCloseClerk={() => {
            logEvent('toast_close', { toast: 'clerk' });
            game.closeClerk();
          }}
          achievementToast={
            game.achievementToast
              ? {
                  id: game.achievementToast.id,
                  nameKey: game.achievementToast.nameKey,
                  icon: game.achievementToast.icon,
                  loreKey: game.achievementToast.loreKey
                }
              : null
          }
          onCloseAchievementToast={() => {
            logEvent('toast_close', { toast: 'achievement' });
            game.closeAchievementToast();
          }}
          playerLevel={game.playerLevel}
          playerXP={game.playerXP}
          levelUpToast={game.levelUpToast}
          onCloseLevelUpToast={() => {
            logEvent('toast_close', { toast: 'level_up' });
            game.closeLevelUpToast();
          }}
          hasAffordableResearch={getResearchNodes().some(
            (n) =>
              !game.research[n.id] &&
              game.playerLevel >= n.requiredLevel &&
              n.requires.every((r) => game.research[r]) &&
              game.energy >= n.energyCost &&
              (n.branch === 'mining' ||
                (n.branch === 'battle' && battleUnlocked) ||
                (n.branch === 'expedition' && shipyardUnlocked))
          )}
          onOpenResearch={() => {
            if (!screenGreetedRef.current.has('research')) {
              screenGreetedRef.current.add('research');
              game.showClerk('screen_research');
            }
            logEvent('modal_open', { modal: 'research' });
            setResearchOpen(true);
          }}
          onOpenAchievements={() => {
            logEvent('modal_open', { modal: 'achievements' });
            setAchievementsOpen(true);
          }}
          achievementsUnlocked={game.achievementsUnlocked}
          hasUnclaimedAchievements={game.hasUnclaimedAchievements}
          onOpenClickPowerInfo={() => {
            logEvent('modal_open', { modal: 'click_power_info' });
            setClickPowerInfoOpen(true);
          }}
          onOpenPassiveRateInfo={() => {
            logEvent('modal_open', { modal: 'passive_rate_info' });
            setPassiveRateInfoOpen(true);
          }}
          onOpenMetalInfo={(metalId) => {
            logEvent('modal_open', { modal: 'metal_info', metalId });
            setMetalInfoOpenId(metalId);
          }}
          onOpenStoryLog={() => {
            const ctx = {
              unlockedPlanetIds: game.unlockedPlanetIds,
              chosenCharacterId: game.chosenCharacterId
            };
            setSeenStoryCount(
              getStoryLogUnlockedEntries(ctx).length
            );
            logEvent('modal_open', { modal: 'story_log' });
            setStoryLogOpen(true);
          }}
          onOpenPrestige={() => {
            logEvent('prestige_popup_open', {
              playerLevel: game.playerLevel,
              prestigeCount: game.prestige.count,
              blocked: !game.canPrestige,
              blockedReason: game.prestigeBlockedReason ?? undefined,
            });
            if (!game.canPrestige && game.prestigeBlockedReason === 'level_too_low') {
              logEvent('prestige_popup_blocked', {
                playerLevel: game.playerLevel,
                blockedReason: 'level_too_low',
              });
            }
            setPrestigeOpen(true);
          }}
          isPrestigeAvailable={game.canPrestige}
          prestigeCount={game.prestige.count}
          hasNewStoryEntry={
            getStoryLogUnlockedEntries({
              unlockedPlanetIds: game.unlockedPlanetIds,
              chosenCharacterId: game.chosenCharacterId
            }).length > seenStoryCount
          }
          hasUnreadChannelMessage={!!game.characterMessage}
          chosenCharacter={game.chosenCharacter}
          onOpenCharacterChannel={() => {
            logEvent('modal_open', { modal: 'character_channel' });
            setChannelOpen(true);
          }}
          characterChannelUnlocked={
            game.unlockedPlanetIds.includes(getAliens()[7].planetId as any) ||
            !!game.characterMessage ||
            game.characterFlowStep === 'select'
          }
        />
      );
      break;
    case 'upgrades':
      tabContent = (
        <UpgradesScreen
          energy={game.energy}
          upgrades={game.upgrades}
          onBuyUpgrade={game.buyUpgrade}
        />
      );
      break;
    case 'planets':
      tabContent = (
        <PlanetsScreen
          unlockedPlanetIds={game.unlockedPlanetIds}
          selectedPlanetId={game.selectedPlanetId}
          battle={game.battle}
          shipDamage={game.totalDamage}
          energy={game.energy}
          playerLevel={game.playerLevel}
          characterChosen={!!game.chosenCharacterId}
          onAttackPlanet={(id) => {
            game.startBattle(id);
            onSetTab('battle');
          }}
          onChoosePlanet={(id) => {
            game.selectPlanet(id);
            onSetTab('game');
          }}
        />
      );
      break;
    case 'shipyard':
      tabContent = (
        <ShipyardScreen
          metals={game.metals}
          discoveredMetals={game.discoveredMetals}
          fleet={game.fleet}
          totalDamage={game.totalDamage}
          battle={game.battle}
          expeditions={game.expeditions}
          expeditionRemainingMap={game.expeditionRemainingMap}
          unlockedPlanetIds={game.unlockedPlanetIds}
          playerLevel={game.playerLevel}
          onBuildShip={game.buildShip}
          onRepairShip={game.repairShip}
          onSelectShip={game.selectShip}
          onCraftCannon={(shipId, cannonId) =>
            game.craftCannon(shipId, cannonId)
          }
          onStartExpedition={game.startExpedition}
          onClaimExpedition={game.claimExpedition}
          moduleLevels={game.moduleLevels}
          onCraftModule={game.craftModule}
          onUpgradeModule={game.upgradeModule}
          onEquipModule={game.equipModule}
          onOpenMetalInfo={(metalId) => {
            logEvent('modal_open', { modal: 'metal_info', metalId });
            setMetalInfoOpenId(metalId);
          }}
        />
      );
      break;
    case 'shop':
      tabContent = (
        <ShopScreen
          credits={game.credits}
          activeBoosts={game.activeBoosts}
          metals={game.metals}
          onBuyShopItem={game.buyShopItem}
          onAddCredits={game.addCredits}
          onStarsPurchaseApplied={() => {
            return syncPendingGrantsNow();
            // No immediate local apply — rewards are delivered exclusively via
            // grant sync on next app launch (or next bootstrap).
            // StarsShopTab already shows a "will be applied on next launch" message.
          }}
        />
      );
      break;
    case 'battle':
      tabContent = (
        <BattleScreen
          battle={game.battle}
          totalDamage={game.totalDamage}
          defeatInfo={game.defeatInfo}
          equippedModule={(() => {
            const shipId = game.battle?.shipId ?? game.fleet.selectedShipId;
            const owned = game.fleet.ownedShips.find(
              (s) => s.shipId === shipId
            );
            const modId = owned?.equippedModuleId ?? null;
            return modId ? getModuleById(modId) : null;
          })()}
          equippedModuleLevel={(() => {
            const shipId = game.battle?.shipId ?? game.fleet.selectedShipId;
            const owned = game.fleet.ownedShips.find(
              (s) => s.shipId === shipId
            );
            const modId = owned?.equippedModuleId ?? null;
            return modId ? (game.moduleLevels[modId] ?? 0) : 0;
          })()}
          onAttack={game.attackBattle}
          onUltActivated={game.notifyUltActivated}
          onReflect={game.reflectBattle}
          onHeal={game.healBattle}
          onForfeit={game.forfeitBattle}
          onGoToShipyard={() => {
            logEvent('defeat_go_shipyard', {});
            onSetTab('shipyard');
          }}
          onClearDefeat={game.clearDefeatInfo}
          onAddBattleTime={game.addBattleTime}
        />
      );
      break;
  }

  return (
    <RNSAView edges={['top']} style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>{tabContent}</View>

      <ModalSheet
        visible={researchOpen}
        title={t('ui.research.modal_title')}
        onClose={() => {
          logEvent('modal_close', { modal: 'research' });
          setResearchOpen(false);
        }}
      >
        <ResearchScreen
          playerLevel={game.playerLevel}
          playerXP={game.playerXP}
          energy={game.energy}
          research={game.research}
          onBuyResearch={game.buyResearch}
          battleUnlocked={battleUnlocked}
          expeditionUnlocked={shipyardUnlocked}
        />
      </ModalSheet>

      <ModalSheet
        visible={storyLogOpen}
        title={t('ui.story_log.modal_title')}
        onClose={() => {
          logEvent('modal_close', { modal: 'story_log' });
          setStoryLogOpen(false);
        }}
      >
        <StoryLogScreen
          characters={dialogues.characters}
          unlockedPlanetIds={game.unlockedPlanetIds}
          chosenCharacterId={game.chosenCharacterId}
        />
      </ModalSheet>

      <PrestigePopup
        visible={prestigeOpen}
        onClose={() => {
          logEvent('modal_close', { modal: 'prestige' });
          setPrestigeOpen(false);
        }}
        playerLevel={game.playerLevel}
        prestige={game.prestige}
        blockedReason={game.prestigeBlockedReason}
        onConfirm={() => {
          logEvent('prestige_confirm', {
            playerLevel: game.playerLevel,
            prestigeCountBefore: game.prestige.count,
          });
          game.performPrestige();
        }}
      />

      <ModalSheet
        visible={achievementsOpen}
        title={t('ui.achievements.modal_title')}
        onClose={() => {
          logEvent('modal_close', { modal: 'achievements' });
          setAchievementsOpen(false);
        }}
      >
        <AchievementsScreen
          achievements={game.achievements}
          onClaim={game.claimAchievement}
        />
      </ModalSheet>

      <Popup
        visible={game.firstIronToast}
        title={t('alerts.first_iron.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'first_iron' });
          game.closeFirstIronToast();
        }}
        image={getMetals().find((m) => m.id === 'iron')?.image}
        text={t('alerts.first_iron.text')}
        clerk
      />

      <Popup
        visible={game.achievementsUnlockToast}
        title={t('alerts.achievements_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'achievements_unlock' });
          game.closeAchievementsUnlockToast();
        }}
        text={t('alerts.achievements_unlock.text')}
        clerk
        headerEmoji="🏆"
        actionLabel={t('alerts.achievements_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'achievements_unlock',
            action: 'open_achievements'
          });
          setAchievementsOpen(true);
        }}
      />

      <Popup
        visible={game.upgradesUnlockToast}
        title={t('alerts.upgrades_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'upgrades_unlock' });
          game.closeUpgradesUnlockToast();
        }}
        text={t('alerts.upgrades_unlock.text')}
        clerk
        headerEmoji="⚡"
        actionLabel={t('alerts.upgrades_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'upgrades_unlock',
            action: 'open_upgrades'
          });
          goToTab('upgrades');
        }}
      />

      <Popup
        visible={!!game.currentUnlockToast}
        title={game.currentUnlockToast?.title ?? ''}
        onClose={() => {
          logEvent('toast_close', {
            toast: 'unlock',
            id: game.currentUnlockToast?.id
          });
          game.dismissUnlockToast();
        }}
        image={game.currentUnlockToast?.image}
        images={game.currentUnlockToast?.images}
        text={game.currentUnlockToast?.text ?? ''}
        headerEmoji={game.currentUnlockToast?.headerEmoji}
        clerk
      />

      <Popup
        visible={game.firstShipToast}
        title={t('alerts.first_ship.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'first_ship' });
          game.closeFirstShipToast();
        }}
        image={getShips()[0].image}
        text={t('alerts.first_ship.text', { minEnergy: String(minAttackEnergy) })}
        clerk
        headerEmoji="🚀"
        actionLabel={
          planetsUnlocked
            ? t('alerts.first_ship.action_go_planets')
            : t('alerts.first_ship.action_earn', { energy: String(minAttackEnergy) })
        }
        onAction={() => {
          logEvent('toast_action', {
            toast: 'first_ship',
            action: planetsUnlocked ? 'go_planets' : 'go_game'
          });
          game.closeFirstShipToast();
          goToTab(planetsUnlocked ? 'planets' : 'game');
        }}
      />

      <Popup
        visible={game.planetsUnlockToast}
        title={t('alerts.planets_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'planets_unlock' });
          game.closePlanetsUnlockToast();
        }}
        headerEmoji="🌍"
        text={t('alerts.planets_unlock.text')}
        clerk
        actionLabel={t('alerts.planets_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'planets_unlock',
            action: 'open_planets'
          });
          goToTab('planets');
        }}
      />

      <Popup
        visible={game.shipyardUnlockToast}
        title={t('alerts.shipyard_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'shipyard_unlock' });
          game.closeShipyardUnlockToast();
        }}
        headerEmoji="🛠️"
        text={t('alerts.shipyard_unlock.text')}
        clerk
        actionLabel={t('alerts.shipyard_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'shipyard_unlock',
            action: 'open_shipyard'
          });
          goToTab('shipyard');
        }}
      />

      <Popup
        visible={!!game.planetUnlockToast}
        title={t('alerts.planet_unlock.title')}
        onClose={() => {
          logEvent('toast_close', {
            toast: 'planet_unlock',
            planetId: game.planetUnlockToast?.id
          });
          game.closePlanetUnlockToast();
        }}
        image={game.planetUnlockToast?.image}
        text={
          game.planetUnlockToast
            ? t('alerts.planet_unlock.text', { name: game.planetUnlockToast.name, lore: game.planetUnlockToast.lore })
            : ''
        }
        clerk
        actionLabel={t('alerts.planet_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'planet_unlock',
            action: 'start_mining',
            planetId: game.planetUnlockToast?.id
          });
          goToTab('game');
        }}
      />

      <CharacterCommunicationChannel
        visible={channelOpen || game.characterFlowStep === 'select'}
        onClose={() => {
          setChannelOpen(false);
          if (game.characterFlowStep === 'select') game.closeCharacterFlow();
        }}
        chosenCharacter={game.chosenCharacter}
        character={game.chosenCharacter}
        characters={dialogues.characters}
        onChoose={(id) => {
          game.chooseCharacter(id);
          setChannelOpen(true);
        }}
        planet10Unlocked={game.unlockedPlanetIds.includes(10 as any)}
        characterMessage={game.characterMessage}
        characterMessageHistory={game.characterMessageHistory}
        hasMoreDialogueLines={game.characterDialogueQueue.length > 0}
        onCloseCharacterMessage={() => {
          logEvent('toast_close', { toast: 'character_message' });
          game.closeCharacterMessage();
        }}
      />

      <Popup
        visible={clickPowerInfoOpen}
        title="◈ МОЩНОСТЬ КЛИКА · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'click_power_info' });
          setClickPowerInfoOpen(false);
        }}
        headerEmoji="⛏️"
        text={`Мощность клика — количество энергии, добываемой за одно нажатие на планету.\n\nСейчас: +${game.clickPower < 1000 ? game.clickPower.toFixed(2) : formatNum(game.clickPower)} за клик.\n\nУвеличивается через улучшения во вкладке «АПГР.». Чем выше мощность — тем больше энергии и металлов вы получаете с каждого удара.`}
        clerk
      />

      <Popup
        visible={passiveRateInfoOpen}
        title="◈ ПАССИВНЫЙ ДОХОД · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'passive_rate_info' });
          setPassiveRateInfoOpen(false);
        }}
        headerEmoji="⚡"
        text={`Пассивный доход — энергия, накапливаемая автоматически каждую секунду без кликов.\n\nСейчас: ${formatNum(game.passiveRate)}/сек.\n\nУвеличивается через улучшения с дроном во вкладке «АПГР.». Пока вы спите — дроны работают. По регламенту МММРДР, дроны не устают. Их чувства по этому поводу не изучались.`}
        clerk
      />

      {(() => {
        const METAL_INFO: Record<MetalId, { title: string; text: string }> = {
          iron: {
            title: '◈ ЖЕЛЕЗО™ · КЛЕРК-7 ◈',
            text: 'Железо — базовый промышленный металл. Добывайте его как можно больше.\n\nПо регламенту МММРДР, минимальная норма сбора не установлена. Это не значит, что её нет — просто форма МН-2 «Установление нормы» находится на согласовании с 2341 года.\n\nВывод: добывайте. Много. Пока не спросили.'
          },
          titan: {
            title: '◈ ТИТАН · КЛЕРК-7 ◈',
            text: 'Титан — металл с исключительно высокой прочностью. Применяется в обшивке боевых кораблей и производстве пушечных компонентов.\n\nСогласно директиве МММРДР № 7.4.2, каждый образец подлежит взвешиванию, маркировке и трёхкратной инвентаризации. Форма ТТ-19 «Учёт титана» выдаётся в окошке 3. Окошко 3 закрыто на переучёт.\n\nВывод: полезный металл. Добывайте, пока никто не взвешивает.'
          },
          iridium: {
            title: '◈ ИРИДИЙ · КЛЕРК-7 ◈',
            text: 'Иридий — редкоземельный металл с повышенной устойчивостью к внешним воздействиям. Применяется в высокотехнологичных компонентах орудий и корпусных усилителей.\n\nВстречается реже, чем железо или титан. По мнению МММРДР, это «не баг, а особенность распределения ресурсов». Форма ИР-7 «Жалоба на редкость иридия» официально не рассматривается.\n\nВывод: ценнее, чем кажется. Копите.'
          },
          voidCrystal: {
            title: '◈ КРИСТАЛЛ ПУСТОТЫ · КЛЕРК-7 ◈',
            text: 'Кристалл Пустоты — экзотический материал, обнаруженный исключительно в Секторе 3. Природа его образования не изучена. МММРДР не спешит изучать.\n\nОфициальная классификация: «объект неустановленной категории». Форма КП-0 «Идентификация неизвестного вещества» находится в разработке с момента открытия Сектора 3.\n\nВывод: что-то важное. Точно.'
          },
          echoShard: {
            title: '◈ ОСКОЛОК ЭХА · КЛЕРК-7 ◈',
            text: 'Осколок Эха — фрагментарный материал, излучающий слабый резонансный сигнал. Встречается в глубинах Сектора 3.\n\nПо непроверенным данным, звук, исходящий от осколка — это отголоски сигналов, поглощённых Пустотой. МММРДР официально опровергает эту теорию, не приводя альтернативной.\n\nВывод: берите. Пригодится.'
          }
        };
        const metal = metalInfoOpenId
          ? getMetals().find((m) => m.id === metalInfoOpenId)
          : null;
        const info = metalInfoOpenId ? METAL_INFO[metalInfoOpenId] : null;
        return (
          <Popup
            visible={metalInfoOpenId !== null}
            title={info?.title ?? ''}
            onClose={() => {
              logEvent('toast_close', {
                toast: 'metal_info',
                metalId: metalInfoOpenId
              });
              setMetalInfoOpenId(null);
            }}
            image={metal?.image}
            text={info?.text ?? ''}
            clerk
          />
        );
      })()}

      {(() => {
        const visibleTabs = TABS.filter((tabDef) => {
          if (tabDef.id === 'upgrades') return upgradesUnlocked;
          if (tabDef.id === 'shipyard') return shipyardUnlocked;
          if (tabDef.id === 'planets') return planetsUnlocked;
          if (tabDef.id === 'battle') return battleUnlocked;
          if (tabDef.id === 'shop') return shopUnlocked;
          return true;
        });
        if (visibleTabs.length < 2) return null;
        return (
          <RNSAView edges={['bottom']} style={styles.tabBarOuter}>
            <View style={styles.tabBar}>
              {visibleTabs.map((tabDef) => {
                const active = tab === tabDef.id;
                const hasBattle = tabDef.id === 'battle' && !!game.battle;
                const hasDefeat = tabDef.id === 'battle' && !!game.defeatInfo;
                const hasExpeditionDone =
                  tabDef.id === 'shipyard' &&
                  game.expeditions.some(
                    (e) => (game.expeditionRemainingMap[e.shipId] ?? 1) === 0
                  );
                const hasAffordableUpgrade =
                  tabDef.id === 'upgrades' &&
                  tab !== 'upgrades' &&
                  getUpgrades().some(
                    (u) =>
                      game.energy >=
                      computeUpgradeCost(
                        u,
                        game.upgrades[u.id as UpgradeId] ?? 0
                      )
                  );
                const hasAttackablePlanet =
                  tabDef.id === 'planets' &&
                  tab !== 'planets' &&
                  getAliens().some((alien) => {
                    const planet = getPlanets().find(
                      (p) => p.id === alien.planetId
                    );
                    if (!planet) return false;
                    return (
                      !game.unlockedPlanetIds.includes(alien.planetId) &&
                      isSectorUnlocked(
                        planet.sectorId,
                        game.unlockedPlanetIds,
                        game.playerLevel
                      ) &&
                      game.battle?.planetId !== alien.planetId &&
                      game.energy >= alien.attackEnergyCost
                    );
                  });
                const hasAffordableShipyard =
                  tabDef.id === 'shipyard' &&
                  tab !== 'shipyard' &&
                  (getShips().some(
                    (ship) =>
                      !game.fleet.ownedShips.some(
                        (o) => o.shipId === ship.id
                      ) &&
                      Object.entries(ship.baseCost).every(
                        ([m, qty]) =>
                          (game.metals[m as keyof typeof game.metals] ?? 0) >=
                          (qty ?? 0)
                      )
                  ) ||
                    (game.fleet.ownedShips.length > 0 &&
                      getCannons().some((cannon) =>
                        game.fleet.ownedShips
                          .filter(
                            (ship) =>
                              !game.expeditions.some(
                                (e) => e.shipId === ship.shipId
                              )
                          )
                          .some((ship) => {
                            const cost = computeCannonCost(
                              cannon,
                              ship.cannons[cannon.id] ?? 0
                            );
                            return Object.entries(cost).every(
                              ([m, qty]) =>
                                (game.metals[m as keyof typeof game.metals] ??
                                  0) >= (qty ?? 0)
                            );
                          })
                      )));

                return (
                  <Pressable
                    key={tabDef.id}
                    onPress={() => {
                      logEvent('tab_switch', { tab: tabDef.id, via: 'tab_bar' });
                      onSetTab(tabDef.id);
                    }}
                    style={styles.tabBtn}
                  >
                    <Text style={styles.tabIcon}>{tabDef.icon}</Text>
                    <Text
                      style={[
                        styles.tabLabel,
                        active ? styles.tabLabelActive : null
                      ]}
                    >
                      {t(tabDef.labelKey)}
                    </Text>
                    {active ? <View style={styles.tabActiveLine} /> : null}
                    {hasBattle || hasDefeat ? (
                      <View
                        style={[
                          styles.tabBadge,
                          hasDefeat ? { backgroundColor: '#ff9900' } : {}
                        ]}
                      />
                    ) : null}
                    {hasExpeditionDone || hasAffordableShipyard ? (
                      <View
                        style={[
                          styles.tabBadge,
                          { backgroundColor: '#ff3b3b' }
                        ]}
                      />
                    ) : null}
                    {hasAffordableUpgrade ? (
                      <View
                        style={[
                          styles.tabBadge,
                          { backgroundColor: '#ff3b3b' }
                        ]}
                      />
                    ) : null}
                    {hasAttackablePlanet ? (
                      <View
                        style={[
                          styles.tabBadge,
                          { backgroundColor: '#ff3b30' }
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </RNSAView>
        );
      })()}

      <View style={styles.sideButtons}>
        <Pressable
          onPress={() => {
            logEvent('modal_open', { modal: 'reset_confirm' });
            setResetConfirmOpen(true);
          }}
          style={styles.resetBtn}
        >
          <Text style={styles.resetIcon}>✕</Text>
          <Text style={styles.resetLabel}>{t('ui.reset.label')}</Text>
        </Pressable>
        <Pressable onPress={openEditor} style={styles.editorBtn}>
          <Text style={styles.editorIcon}>✎</Text>
          <Text style={styles.editorLabel}>{t('ui.editor.label')}</Text>
        </Pressable>
      </View>

      <Modal
        visible={editorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditorOpen(false)}
      >
        <Pressable
          style={styles.resetOverlay}
          onPress={() => setEditorOpen(false)}
        >
          <Pressable style={styles.editorCard} onPress={() => {}}>
            <Text style={styles.editorCardTitle}>{t('ui.editor.title')}</Text>
            <ScrollView
              style={styles.editorScroll}
              keyboardShouldPersistTaps="handled"
            >
              {(
                [
                  { key: 'energy', labelKey: 'ui.editor.energy' },
                  { key: 'playerXP', labelKey: 'ui.editor.xp' },
                  { key: 'iron', labelKey: 'ui.editor.iron' },
                  { key: 'titan', labelKey: 'ui.editor.titan' },
                  { key: 'iridium', labelKey: 'ui.editor.iridium' },
                ] as { key: keyof typeof editorFields; labelKey: string }[]
              ).map(({ key, labelKey }) => (
                <View key={key} style={styles.editorRow}>
                  <Text style={styles.editorFieldLabel}>{t(labelKey)}</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorFields[key]}
                    onChangeText={(v) =>
                      setEditorFields((f) => ({ ...f, [key]: v }))
                    }
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
              ))}
              <View style={styles.editorDivider} />
              {(
                [
                  { key: 'unlockUpgrades', labelKey: 'ui.editor.upgrades_open' },
                  { key: 'unlockShipyard', labelKey: 'ui.editor.shipyard_open' },
                  { key: 'unlockPlanets', labelKey: 'ui.editor.planets_open' },
                ] as { key: keyof typeof editorToggles; labelKey: string }[]
              ).map(({ key, labelKey }) => (
                <View key={key} style={styles.editorRow}>
                  <Text style={styles.editorFieldLabel}>{t(labelKey)}</Text>
                  <Pressable
                    onPress={() =>
                      setEditorToggles((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    style={[
                      styles.editorToggle,
                      editorToggles[key]
                        ? styles.editorToggleOn
                        : styles.editorToggleOff
                    ]}
                  >
                    <Text
                      style={[
                        styles.editorToggleText,
                        editorToggles[key] ? styles.editorToggleTextOn : null
                      ]}
                    >
                      {editorToggles[key] ? t('ui.editor.toggle_on') : t('ui.editor.toggle_off')}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <View style={styles.resetCardButtons}>
              <Pressable
                style={styles.resetCardCancel}
                onPress={() => setEditorOpen(false)}
              >
                <Text style={styles.resetCardCancelText}>{t('ui.editor.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.resetCardConfirm} onPress={applyEditor}>
                <Text style={styles.resetCardConfirmText}>{t('ui.editor.apply')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={resetConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setResetConfirmOpen(false)}
      >
        <Pressable
          style={styles.resetOverlay}
          onPress={() => setResetConfirmOpen(false)}
        >
          <Pressable style={styles.resetCard} onPress={() => {}}>
            <Text style={styles.resetCardTitle}>{t('ui.reset.title')}</Text>
            <Text style={styles.resetCardText}>
              {t('ui.reset.body')}
            </Text>
            <Pressable
              style={styles.resetCheckboxRow}
              onPress={() => setResetShowIntro((v) => !v)}
            >
              <View
                style={[
                  styles.resetCheckbox,
                  resetShowIntro && styles.resetCheckboxChecked
                ]}
              >
                {resetShowIntro ? (
                  <Text style={styles.resetCheckboxMark}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.resetCheckboxLabel}>{t('ui.reset.show_intro')}</Text>
            </Pressable>
            <View style={styles.resetCardButtons}>
              <Pressable
                style={styles.resetCardCancel}
                onPress={() => setResetConfirmOpen(false)}
              >
                <Text style={styles.resetCardCancelText}>{t('ui.reset.cancel')}</Text>
              </Pressable>
              <Pressable
                style={styles.resetCardConfirm}
                onPress={() => {
                  logEvent('game_reset', { showIntro: resetShowIntro });
                  setResetConfirmOpen(false);
                  onReset(resetShowIntro);
                  setResetShowIntro(false);
                }}
              >
                <Text style={styles.resetCardConfirmText}>{t('ui.reset.confirm')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </RNSAView>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>('game');
  const [initial, setInitial] = useState<GameStateInit | undefined>(undefined);
  const [initialAppliedGrantSeq, setInitialAppliedGrantSeq] = useState(0);
  const [introSeen, setIntroSeen] = useState<boolean | undefined>(undefined);
  const [gameKey, setGameKey] = useState(0);
  const [offlineEarnings, setOfflineEarnings] = useState(0);
  const [dialogues, setDialogues] = useState<DialoguesPayload | null>(null);
  const [dialoguesError, setDialoguesError] = useState<string | null>(null);
  const [configReady, setConfigReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [localeChecked, setLocaleChecked] = useState(false);
  const [showLocalePicker, setShowLocalePicker] = useState(false);
  const [tgInsets, setTgInsets] = useState<TelegramSafeAreaInsets>({ sysTop: 0, contentTop: 0, inTelegram: false });

  const sessionIdRef = useRef(
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );

  const retryDialogues = useCallback(() => {
    setDialoguesError(null);
    fetchDialogues()
      .then((data) => {
        setDialogues(data);
        setDialoguesError(null);
      })
      .catch((err) => {
        setDialoguesError(err?.message ?? 'Failed to load dialogues');
      });
  }, []);

  const handleUnlock = useCallback(() => {
    void saveUnlocked();
    setUnlocked(true);
  }, []);

  useEffect(() => {
    loadUnlocked().then(was => setUnlocked(was ? true : false));
  }, []);

  useEffect(() => {
    initAnalytics(sessionIdRef.current);

    const prevHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logError(error, { isFatal });
      prevHandler?.(error, isFatal);
    });

    if (Platform.OS === 'web') {
      let unsubTgSafeTop: (() => void) | undefined;
      void ensureTelegramWebApp().then((tg) => {
        if (tg) {
          bootstrapTelegram();
          setTgInsets(getTelegramSafeAreaInsets());
          unsubTgSafeTop = subscribeTelegramSafeAreaInsets(setTgInsets);
        }
      });

      const onUnhandled = (event: PromiseRejectionEvent) => {
        logError(event.reason, { type: 'unhandledrejection' });
      };
      window.addEventListener('unhandledrejection', onUnhandled);
      return () => {
        window.removeEventListener('unhandledrejection', onUnhandled);
        unsubTgSafeTop?.();
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchDialogues()
      .then((data) => {
        if (!mounted) return;
        setDialogues(data);
        setDialoguesError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setDialoguesError(err?.message ?? 'Failed to load dialogues');
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadSavedLocale();
      if (!mounted) return;

      if (saved) {
        await loadI18n(saved);
        if (!mounted) return;
        invalidatePlanetsCache();
        invalidateAliensCache();
        setShowLocalePicker(false);
        setLocaleChecked(true);
        return;
      }

      setShowLocalePicker(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const cached = await loadRemoteConfigFromCache();
      try {
        await fetchAndCacheRemoteConfig();
        if (mounted) {
          setConfigReady(true);
          setConfigError(null);
        }
      } catch (err: any) {
        if (!mounted) return;
        if (cached) {
          // Network failed but cache is available — use it as fallback
          setConfigReady(true);
        } else {
          setConfigError(err?.message ?? 'Не удалось загрузить конфиг');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // In Telegram runtime: auth first so getAccessToken() returns a valid
      // token for the grant-sync step below. No-op on native and plain web.
      await telegramAuthIfNeeded();

      const [localLoaded, seen, token] = await Promise.all([
        loadGame(),
        loadIntroSeen(),
        getAccessToken()
      ]);
      if (!mounted) return;

      // Step 1-3: load local + cloud saves, pick newer envelope
      let localEnvelope = localLoaded
        ? {
            version: 2 as const,
            savedAt: localLoaded.savedAt,
            appliedGrantSeq: localLoaded.appliedGrantSeq,
            state: localLoaded.state
          }
        : null;
      let cloudRev: number | undefined;

      if (token) {
        const cloud = await fetchCloudSave();
        if (cloud) {
          // cloud.data may be V1 or V2 — deserialize to normalize
          const cloudResult = deserializeGameplaySaveEnvelope(cloud.data);
          if (cloudResult.ok) {
            localEnvelope = pickNewerEnvelope(
              localEnvelope,
              cloudResult.envelope
            );
            cloudRev = cloud.rev;
          }
        }
      }

      // Step 4: read appliedGrantSeq from the chosen envelope
      let resolvedEnvelope = localEnvelope;
      let appliedGrantSeq = resolvedEnvelope?.appliedGrantSeq ?? 0;

      // Steps 5-9: grant sync (only when authenticated and flag is enabled).
      // Runs even when there is no existing save (fresh user) — start from
      // empty state with appliedGrantSeq=0 so any welcome grants are applied.
      if (token && GRANT_SYNC_ENABLED) {
        const grantBaseSeq = resolvedEnvelope?.appliedGrantSeq ?? 0;
        try {
          const grants = await fetchPendingGrants(grantBaseSeq);
          if (grants.length > 0) {
            const baseState = resolvedEnvelope?.state ?? ({} as GameStateInit);
            const { state: stateWithGrants, appliedGrantSeq: newSeq } =
              applyGrants(baseState, grants, grantBaseSeq);

            // Build new envelope with grant-applied state
            resolvedEnvelope = {
              version: 2,
              savedAt: Date.now(),
              appliedGrantSeq: newSeq,
              state: stateWithGrants
            };
            appliedGrantSeq = newSeq;

            // Step 7: save locally via canonical path (no raw AsyncStorage.setItem)
            let savedSuccessfully = false;
            try {
              await saveGameEnvelope(resolvedEnvelope);
              savedSuccessfully = true;
            } catch {
              // Local save failed — do not ack
            }

            // Step 8: push to cloud
            if (savedSuccessfully) {
              try {
                const pushed = await pushCloudSave(resolvedEnvelope, cloudRev);
                cloudRev = pushed.rev;
              } catch {
                // Cloud push failed — safe, still saved locally; do not ack yet
                savedSuccessfully = false;
              }
            }

            // Step 9: ack only after both local save and cloud push succeeded
            if (savedSuccessfully) {
              await ackGrants(newSeq);
            }
          }
        } catch {
          // Grant sync failure is non-fatal — start game with current state
        }
      }

      const state = resolvedEnvelope?.state;
      const savedAt = resolvedEnvelope?.savedAt ?? 0;

      if (state) {
        // Apply offline earnings
        if (savedAt > 0) {
          const elapsedSeconds = (Date.now() - savedAt) / 1000;
          let basePassive = 0;
          for (const upg of getUpgrades()) {
            const level =
              (state.upgrades as Record<string, number>)?.[String(upg.id)] ?? 0;
            if (upg.passiveBonus) basePassive += upg.passiveBonus * level;
          }
          const planets = getPlanets();
          const planet =
            planets.find(
              (p) => p.id === (state.selectedPlanetId ?? planets[0].id)
            ) ?? planets[0];
          const passiveRate = basePassive * planet.bonus;
          const earnings = Math.floor(
            passiveRate * Math.min(elapsedSeconds, 8 * 3600)
          );
          if (earnings > 0) {
            state.energy = (state.energy ?? 0) + earnings;
            state.totalEarned = (state.totalEarned ?? 0) + earnings;
            setOfflineEarnings(earnings);
          }
        }
        setInitial(state);
        setInitialAppliedGrantSeq(appliedGrantSeq);
      } else {
        setInitial({});
        setInitialAppliedGrantSeq(0);
      }
      setIntroSeen(seen);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLocalePick = useCallback(async (locale: SupportedLocale) => {
    await saveLocale(locale);
    await loadI18n(locale);
    invalidatePlanetsCache();
    invalidateAliensCache();
    setShowLocalePicker(false);
    setLocaleChecked(true);
  }, []);

  const handleReset = useCallback(async (showIntro?: boolean) => {
    await clearGame().catch(() => {});
    if (showIntro) {
      await saveIntroSeen(false).catch(() => {});
      setIntroSeen(false);
    }
    setInitial({});
    setTab('game');
    setGameKey((k) => k + 1);
  }, []);

  if (!localeChecked) {
    if (showLocalePicker) {
      return (
        <View style={styles.container}>
          <StatusBar style="light" />
          <LocalePickerOverlay onPick={handleLocalePick} />
        </View>
      );
    }
    return <View style={styles.container}><StatusBar style="light" /></View>;
  }

  if (unlocked !== true) {
    if (unlocked === null) return null;
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <PasswordScreen onUnlock={handleUnlock} />
      </View>
    );
  }

  if (!configReady && configError) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('ui.loading.config_failed')}</Text>
          <Text style={[styles.loadingText, { marginTop: 8, opacity: 0.6 }]}>
            {configError}
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setConfigError(null);
              fetchAndCacheRemoteConfig()
                .then(() => setConfigReady(true))
                .catch((err: any) => setConfigError(err?.message ?? 'Ошибка'));
            }}
          >
            <Text style={styles.retryBtnText}>{t('ui.loading.retry')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!dialogues && dialoguesError) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('ui.loading.dialogues_failed')}</Text>
          <Text style={[styles.loadingText, { marginTop: 8, opacity: 0.6 }]}>
            {dialoguesError}
          </Text>
          <Pressable style={styles.retryBtn} onPress={retryDialogues}>
            <Text style={styles.retryBtnText}>{t('ui.loading.retry')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (
    !configReady ||
    initial === undefined ||
    introSeen === undefined ||
    !dialogues
  ) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('ui.loading.title')}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TelegramAwareInsets tgInsets={tgInsets}>
      <View style={styles.container}>
        <GameAppErrorBoundary>
          <GameApp
            key={gameKey}
            initial={initial}
            initialAppliedGrantSeq={initialAppliedGrantSeq}
            dialogues={dialogues}
            tab={tab}
            onSetTab={setTab}
            onReset={handleReset}
          />
        </GameAppErrorBoundary>
        <IntroOverlay
          visible={!introSeen}
          onDone={async () => {
            setIntroSeen(true);
            await saveIntroSeen(true);
          }}
        />
        <Popup
          visible={offlineEarnings > 0}
          title={t('ui.offline.title')}
          headerEmoji="⚡"
          text={t('ui.offline.text', { earnings: formatNum(offlineEarnings) })}
          onClose={() => setOfflineEarnings(0)}
        />
      </View>
      </TelegramAwareInsets>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(0,212,255,0.7)', fontWeight: '800' },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)'
  },
  retryBtnText: { color: '#00d4ff', fontWeight: '800', fontSize: 12 },
  tabBarOuter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.15)',
    backgroundColor: 'rgba(0,10,30,0.95)'
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  tabBtn: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative'
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    marginTop: 1,
    fontSize: 7,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '800'
  },
  tabLabelActive: { color: '#00d4ff' },
  tabActiveLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 5,
    height: 2,
    backgroundColor: '#00d4ff'
  },
  resetBtn: { alignItems: 'center', gap: 2 },
  resetIcon: { fontSize: 12, color: 'rgba(255,80,80,0.55)' },
  resetLabel: {
    fontSize: 6,
    color: 'rgba(255,80,80,0.45)',
    fontWeight: '800',
    letterSpacing: 0.3
  },
  resetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,5,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  resetCard: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 16,
    padding: 20,
    gap: 12
  },
  resetCardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,80,80,0.85)',
    letterSpacing: 2,
    textAlign: 'center'
  },
  resetCardText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.85)',
    lineHeight: 20,
    textAlign: 'center'
  },
  resetCardButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  resetCardCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    alignItems: 'center'
  },
  resetCardCancelText: {
    color: 'rgba(0,212,255,0.8)',
    fontWeight: '700',
    fontSize: 13
  },
  resetCardConfirm: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(180,30,30,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.4)',
    alignItems: 'center'
  },
  resetCardConfirmText: {
    color: 'rgba(255,120,120,0.95)',
    fontWeight: '700',
    fontSize: 13
  },
  resetCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2
  },
  resetCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetCheckboxChecked: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.8)'
  },
  resetCheckboxMark: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14
  },
  resetCheckboxLabel: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.75)'
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: '20%',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff4444'
  },
  sideButtons: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -38 }],
    alignItems: 'center',
    gap: 8
  },
  editorBtn: { alignItems: 'center', gap: 2 },
  editorIcon: { fontSize: 14, color: 'rgba(0,212,255,0.55)' },
  editorLabel: {
    fontSize: 6,
    color: 'rgba(0,212,255,0.45)',
    fontWeight: '800',
    letterSpacing: 0.3
  },
  editorCard: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    borderRadius: 16,
    padding: 20,
    gap: 14
  },
  editorCardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.85)',
    letterSpacing: 2,
    textAlign: 'center'
  },
  editorScroll: { maxHeight: 280 },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.08)'
  },
  editorFieldLabel: {
    fontSize: 12,
    color: 'rgba(200,230,255,0.85)',
    fontWeight: '600'
  },
  editorInput: {
    width: 130,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,212,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.25)',
    borderRadius: 8,
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right'
  },
  editorDivider: {
    height: 1,
    backgroundColor: 'rgba(0,212,255,0.12)',
    marginVertical: 6
  },
  editorToggle: {
    width: 70,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  editorToggleOn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.5)'
  },
  editorToggleOff: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.12)'
  },
  editorToggleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.3)'
  },
  editorToggleTextOn: { color: '#00d4ff' }
});
