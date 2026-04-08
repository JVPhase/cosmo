import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaProvider,
  SafeAreaView as RNSAView,
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
  View,
} from 'react-native';
import {
  clearAnalytics,
  exportAnalytics,
  flushAnalytics,
  getAnalyticsSizeKb,
  initAnalytics,
  logError,
  logEvent,
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
import { CharacterSelectFlow } from './src/ui/CharacterSelectFlow';
import { CharacterCommunicationChannel } from './src/ui/CharacterCommunicationChannel';
import { IntroOverlay } from './src/ui/IntroOverlay';
import { ModalSheet } from './src/ui/ModalSheet';
import { Popup } from './src/ui/Popup';
import { formatNum } from './src/game/formatNum';
import { METALS, type MetalId } from './src/game/METALS';
import { getModuleById } from './src/game/MODULES';
import { PasswordScreen } from './src/ui/PasswordScreen';
import { useGame } from './src/game/useGame';
import {
  clearGame,
  loadGame,
  loadIntroSeen,
  saveGame,
  saveIntroSeen,
} from './src/game/storage';
import { getAliens } from './src/game/ALIENS';
import { STORY_LOG } from './src/game/STORY_LOG';
import { isSectorUnlocked } from './src/game/SECTORS';
import {
  loadRemoteConfigFromCache,
  fetchAndCacheRemoteConfig,
} from './src/game/remoteConfig';
import {
  fetchCloudSave,
  getAccessToken,
  getCloudRev,
  pushCloudSave,
} from './src/game/cloudSave';
import { bootstrapTelegram } from './src/telegram/runtime';
import { telegramAuthIfNeeded } from './src/telegram/auth';
import { getPlanets } from './src/game/PLANETS';
import { getShips } from './src/game/SHIPS';
import { getCannons, computeCannonCost } from './src/game/CANNONS';
import {
  computeUpgradeCost,
  getUpgrades,
  UpgradeId,
} from './src/game/UPGRADES';
import { getResearchNodes } from './src/game/RESEARCH';
import type { BoostStat, ShopItemId } from './src/game/SHOP';
import type { GameStateInit } from './src/game/types';

const ironMetal = METALS.find((m) => m.id === 'iron')!;

type TabId = 'game' | 'upgrades' | 'planets' | 'shipyard' | 'battle' | 'shop';

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'game', icon: '⛏️', label: 'ДОБЫЧА' },
  { id: 'upgrades', icon: '⚡', label: 'АПГР.' },
  { id: 'planets', icon: '🌍', label: 'ПЛАН.' },
  { id: 'shipyard', icon: '🛠️', label: 'ВЕРФЬ' },
  { id: 'battle', icon: '⚔️', label: 'БОЙ' },
  { id: 'shop', icon: '🛒', label: 'МАГАЗ.' },
];

function GameApp({
  initial,
  tab,
  onSetTab,
  onReset,
}: {
  initial: GameStateInit;
  tab: TabId;
  onSetTab: (t: TabId) => void;
  onReset: (showIntro?: boolean) => void;
}) {
  const game = useGame(initial);
  const minAttackEnergy = Math.min(
    ...getAliens().map((a) => a.attackEnergyCost),
  );
  const screenGreetedRef = useRef<Set<string>>(new Set());
  const [researchOpen, setResearchOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [storyLogOpen, setStoryLogOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [seenStoryCount, setSeenStoryCount] = useState(0);
  const [clickPowerInfoOpen, setClickPowerInfoOpen] = useState(false);
  const [passiveRateInfoOpen, setPassiveRateInfoOpen] = useState(false);
  const [metalInfoOpenId, setMetalInfoOpenId] = useState<MetalId | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetShowIntro, setResetShowIntro] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [analyticsSizeKb, setAnalyticsSizeKb] = useState(0);

  useEffect(() => {
    loadRemoteConfigFromCache();
    fetchAndCacheRemoteConfig();
  }, []);

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
      Alert.alert('Ошибка', e?.message ?? 'Не удалось экспортировать лог');
    }
  }, []);

  const handleClearAnalytics = useCallback(() => {
    Alert.alert('Очистить лог?', 'Все записи аналитики будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await clearAnalytics();
          setAnalyticsSizeKb(0);
        },
      },
    ]);
  }, []);
  const [editorFields, setEditorFields] = useState({
    energy: '0',
    iron: '0',
    titan: '0',
    iridium: '0',
    playerXP: '0',
  });
  const [editorToggles, setEditorToggles] = useState({
    unlockUpgrades: false,
    unlockShipyard: false,
    unlockPlanets: false,
  });

  // Show CLERK-7 onboarding hint the first time each screen is opened
  useEffect(() => {
    const screenTriggers: Partial<Record<TabId, string>> = {
      upgrades: 'screen_upgrades',
      battle: 'screen_battle',
      shipyard: 'screen_shipyard',
      planets: 'screen_planets',
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
      playerXP: String(game.playerXP),
    });
    setEditorToggles({
      unlockUpgrades: upgradesUnlocked,
      unlockShipyard: shipyardUnlocked,
      unlockPlanets: planetsUnlocked,
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
        planets: editorToggles.unlockPlanets,
      },
    });
    setEditorOpen(false);
  };

  const latestRef = useRef(game);
  useEffect(() => {
    latestRef.current = game;
  });

  // Save every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const g = latestRef.current;
      const snapshot = {
        energy: g.energy,
        totalEarned: g.totalEarned,
        clicks: g.clicks,
        upgrades: g.upgrades,
        unlockedPlanetIds: g.unlockedPlanetIds,
        selectedPlanetId: g.selectedPlanetId,
        achievements: g.achievements,
        metals: g.metals,
        fleet: g.fleet,
        battle: g.battle,
        playerXP: g.playerXP,
        research: g.research,
        expeditions: g.expeditions,
      } as any;
      saveGame(snapshot).catch(() => {});
      flushAnalytics().catch(() => {});

      // Cloud autosave — fire-and-forget, ignore 409 conflicts silently
      getAccessToken().then((token) => {
        if (!token) return;
        getCloudRev().then((rev) =>
          pushCloudSave(
            { version: 1, state: snapshot, savedAt: Date.now() },
            rev ?? undefined,
          ).catch(() => {}),
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
                  name: game.achievementToast.name,
                  icon: game.achievementToast.icon,
                  lore: game.achievementToast.lore,
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
                (n.branch === 'expedition' && shipyardUnlocked)),
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
              chosenCharacterId: game.chosenCharacterId,
              metalDealDone: game.metalDealDone,
            };
            setSeenStoryCount(
              STORY_LOG.filter((e) => e.isUnlocked(ctx)).length,
            );
            logEvent('modal_open', { modal: 'story_log' });
            setStoryLogOpen(true);
          }}
          hasNewStoryEntry={
            STORY_LOG.filter((e) =>
              e.isUnlocked({
                unlockedPlanetIds: game.unlockedPlanetIds,
                chosenCharacterId: game.chosenCharacterId,
                metalDealDone: game.metalDealDone,
              }),
            ).length > seenStoryCount
          }
          characterMessage={game.characterMessage}
          onCloseCharacterMessage={() => {
            logEvent('toast_close', { toast: 'character_message' });
            game.closeCharacterMessage();
          }}
          chosenCharacter={game.chosenCharacter}
          onOpenCharacterChannel={() => {
            logEvent('modal_open', { modal: 'character_channel' });
            setChannelOpen(true);
          }}
          characterChannelUnlocked={
            game.unlockedPlanetIds.includes(getAliens()[7].planetId as any) &&
            !game.metalDealDone
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
          onStarsPurchaseApplied={(item) => {
            const meta = item.metadata;
            const resMeta = item.purchaseResult?.metadata ?? {};

            if (item.type === 'currency_pack') {
              game.addCredits((meta.creditAmount as number) ?? 0);
            } else if (item.type === 'metal_pack') {
              const metalId = meta.metalId as MetalId;
              const qty = (meta.quantity as number) ?? 0;
              if (metalId && qty > 0) game.grantMetals({ [metalId]: qty });
            } else if (item.type === 'booster') {
              const stat = meta.effectType as BoostStat | undefined;
              const durationMs = (meta.durationMs as number) ?? 3_600_000;
              if (stat) {
                game.activateBoost({
                  shopItemId: item.id as ShopItemId,
                  effect: {
                    stat,
                    multiplier:
                      (meta.multiplier as number) ??
                      (meta.bonus as number) ??
                      1,
                    durationMs,
                  },
                  expiresAt: Date.now() + durationMs,
                });
              }
            } else if (item.type === 'loot_box') {
              // Server rolled the metals; apply the authoritative result locally
              const rolledMetals = resMeta.rolledMetals as
                | Record<MetalId, number>
                | undefined;
              if (rolledMetals && Object.keys(rolledMetals).length > 0) {
                game.grantMetals(rolledMetals);
              }
            } else if (item.type === 'premium_unlock') {
              const effect = meta.effect as string | undefined;
              if (effect === 'unlockNextSector') {
                const planets = (resMeta.appliedPlanets as number[]) ?? [];
                if (planets.length > 0) game.unlockPlanets(planets);
              } else if (effect === 'resetResearch') {
                const energyRefund = (resMeta.energyRefund as number) ?? 0;
                game.resetResearch(energyRefund);
              }
            }
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
              (s) => s.shipId === shipId,
            );
            const modId = owned?.equippedModuleId ?? null;
            return modId ? getModuleById(modId) : null;
          })()}
          equippedModuleLevel={(() => {
            const shipId = game.battle?.shipId ?? game.fleet.selectedShipId;
            const owned = game.fleet.ownedShips.find(
              (s) => s.shipId === shipId,
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
        title="◈ ИССЛЕДОВАНИЯ · МММРДР ◈"
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
        title="◈ БОРТОВОЙ ЖУРНАЛ ◈"
        onClose={() => {
          logEvent('modal_close', { modal: 'story_log' });
          setStoryLogOpen(false);
        }}
      >
        <StoryLogScreen
          unlockedPlanetIds={game.unlockedPlanetIds}
          chosenCharacterId={game.chosenCharacterId}
          metalDealDone={game.metalDealDone}
        />
      </ModalSheet>

      <ModalSheet
        visible={achievementsOpen}
        title="◈ ЛИЧНОЕ ДЕЛО ◈"
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
        title="◈ ПЕРВАЯ НАХОДКА · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'first_iron' });
          game.closeFirstIronToast();
        }}
        image={ironMetal.image}
        text={
          'Зафиксирован первый образец Железа™! За эту выдающуюся находку вам полагается премия — после заполнения форм ЖЛ-1 по ЖЛ-83, нотариально заверенного снимка астероида и справки с предыдущего места работы. P.S. Этот металл может пригодиться. Возможно.'
        }
        clerk
      />

      <Popup
        visible={game.achievementsUnlockToast}
        title="◈ СИСТЕМА ДОСТИЖЕНИЙ · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'achievements_unlock' });
          game.closeAchievementsUnlockToast();
        }}
        text={
          'Хочу вас подбодрить. Серьёзно. Поэтому внедряю систему достижений — специально для вас.\n\nКаждое достижение будет официально зафиксировано в личном деле. Форма ДСТ-1 уже направлена в архив в трёх экземплярах.\n\nТак держать, сотрудник №4,829,441. Вы справляетесь. Почти.'
        }
        clerk
        headerEmoji="🏆"
        actionLabel="ОТКРЫТЬ ДОСТИЖЕНИЯ"
        onAction={() => {
          logEvent('toast_action', {
            toast: 'achievements_unlock',
            action: 'open_achievements',
          });
          setAchievementsOpen(true);
        }}
      />

      <Popup
        visible={game.upgradesUnlockToast}
        title="◈ АПГРЕЙДЫ ДОСТУПНЫ · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'upgrades_unlock' });
          game.closeUpgradesUnlockToast();
        }}
        text={
          'Поздравляю — у вас достаточно энергии для первого улучшения оборудования!\n\nАпгрейды повышают мощность добычи и пассивный доход. Настоятельно рекомендую вкладывать всё, что есть.\n\nФорма АПГ-1 «Заявка на улучшение» заполнена автоматически. Можете не благодарить.'
        }
        clerk
        headerEmoji="⚡"
        actionLabel="ОТКРЫТЬ АПГРЕЙДЫ"
        onAction={() => {
          logEvent('toast_action', {
            toast: 'upgrades_unlock',
            action: 'open_upgrades',
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
            id: game.currentUnlockToast?.id,
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
        title="◈ ПЕРВЫЙ КОРАБЛЬ · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'first_ship' });
          game.closeFirstShipToast();
        }}
        image={getShips()[0].image}
        text={`Поздравляю с постройкой первого корабля!\n\nОднако для навигации необходимы данные из реестра МММРДР. Министерство готово их предоставить — как только вы выйдете на связь. Для этого потребуется ${minAttackEnergy} единиц энергии. Форма НВГ-1 «Запрос навигационных данных» будет заполнена автоматически.`}
        clerk
        headerEmoji="🚀"
        actionLabel={
          planetsUnlocked
            ? 'ПЕРЕЙТИ К ПЛАНЕТАМ'
            : `ДОБЫТЬ ${minAttackEnergy} ЭНЕРГИИ`
        }
        onAction={() => {
          logEvent('toast_action', {
            toast: 'first_ship',
            action: planetsUnlocked ? 'go_planets' : 'go_game',
          });
          game.closeFirstShipToast();
          goToTab(planetsUnlocked ? 'planets' : 'game');
        }}
      />

      <Popup
        visible={game.planetsUnlockToast}
        title="◈ ПЛАНЕТЫ ДОСТУПНЫ · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'planets_unlock' });
          game.closePlanetsUnlockToast();
        }}
        headerEmoji="🌍"
        text={
          'У вас достаточно энергии для атаки! Вкладка «ПЛАН.» разблокирована.\n\nЗдесь вы можете выбирать планеты и вступать в бой с инопланетными захватчиками. Победа откроет новые планеты с бонусами к добыче.\n\nМинистерство межпланетных отношений категорически не рекомендует вступать в контакт с пришельцами. Так что, возможно, сначала постройте корабль.'
        }
        clerk
        actionLabel="ОТКРЫТЬ ПЛАНЕТЫ"
        onAction={() => {
          logEvent('toast_action', {
            toast: 'planets_unlock',
            action: 'open_planets',
          });
          goToTab('planets');
        }}
      />

      <Popup
        visible={game.shipyardUnlockToast}
        title="◈ ВЕРФЬ РАЗБЛОКИРОВАНА · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', { toast: 'shipyard_unlock' });
          game.closeShipyardUnlockToast();
        }}
        headerEmoji="🛠️"
        text={
          'У вас достаточно железа для постройки первого корабля!\n\nПерейдите во вкладку «ВЕРФЬ» — там можно строить корабли, устанавливать пушки и отправлять флот в экспедиции за металлами.\n\nМинистерство судостроения уведомлено. Форма СТР-1 «Разрешение на строительство» находится на рассмотрении с 2374 года. Стройте пока никто не заметил.'
        }
        clerk
        actionLabel="ОТКРЫТЬ ВЕРФЬ"
        onAction={() => {
          logEvent('toast_action', {
            toast: 'shipyard_unlock',
            action: 'open_shipyard',
          });
          goToTab('shipyard');
        }}
      />

      <Popup
        visible={!!game.planetUnlockToast}
        title="◈ НОВАЯ ПЛАНЕТА · КЛЕРК-7 ◈"
        onClose={() => {
          logEvent('toast_close', {
            toast: 'planet_unlock',
            planetId: game.planetUnlockToast?.id,
          });
          game.closePlanetUnlockToast();
        }}
        image={game.planetUnlockToast?.image}
        text={
          game.planetUnlockToast
            ? `Планета ${game.planetUnlockToast.name} разблокирована!\n\n${game.planetUnlockToast.lore}`
            : ''
        }
        clerk
        actionLabel="НАЧАТЬ ДОБЫЧУ"
        onAction={() => {
          logEvent('toast_action', {
            toast: 'planet_unlock',
            action: 'start_mining',
            planetId: game.planetUnlockToast?.id,
          });
          goToTab('game');
        }}
      />

      <CharacterSelectFlow
        step={game.characterFlowStep}
        chosenCharacterId={game.chosenCharacterId}
        onChoose={game.chooseCharacter}
        onAdvance={game.advanceCharacterFlow}
        onClose={game.closeCharacterFlow}
        onAcceptMetalDeal={game.acceptMetalDeal}
        canAffordMetalDeal={game.canAffordMetalDeal}
        metalDealEnergyCost={game.metalDealEnergyCost}
        onEarnEnergy={() => {
          game.closeCharacterFlow();
          goToTab('game');
        }}
      />

      {game.chosenCharacter && (
        <CharacterCommunicationChannel
          visible={channelOpen}
          onClose={() => setChannelOpen(false)}
          chosenCharacter={game.chosenCharacter}
          planet10Unlocked={game.unlockedPlanetIds.includes(10 as any)}
          canAffordMetalDeal={game.canAffordMetalDeal}
          metalDealEnergyCost={game.metalDealEnergyCost}
          onAcceptMetalDeal={() => {
            game.acceptMetalDeal();
            setChannelOpen(false);
          }}
          onEarnEnergy={() => {
            setChannelOpen(false);
            goToTab('game');
          }}
        />
      )}

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
            text: 'Железо — базовый промышленный металл. Добывайте его как можно больше.\n\nПо регламенту МММРДР, минимальная норма сбора не установлена. Это не значит, что её нет — просто форма МН-2 «Установление нормы» находится на согласовании с 2341 года.\n\nВывод: добывайте. Много. Пока не спросили.',
          },
          titan: {
            title: '◈ ТИТАН · КЛЕРК-7 ◈',
            text: 'Титан — металл с исключительно высокой прочностью. Применяется в обшивке боевых кораблей и производстве пушечных компонентов.\n\nСогласно директиве МММРДР № 7.4.2, каждый образец подлежит взвешиванию, маркировке и трёхкратной инвентаризации. Форма ТТ-19 «Учёт титана» выдаётся в окошке 3. Окошко 3 закрыто на переучёт.\n\nВывод: полезный металл. Добывайте, пока никто не взвешивает.',
          },
          iridium: {
            title: '◈ ИРИДИЙ · КЛЕРК-7 ◈',
            text: 'Иридий — редкоземельный металл с повышенной устойчивостью к внешним воздействиям. Применяется в высокотехнологичных компонентах орудий и корпусных усилителей.\n\nВстречается реже, чем железо или титан. По мнению МММРДР, это «не баг, а особенность распределения ресурсов». Форма ИР-7 «Жалоба на редкость иридия» официально не рассматривается.\n\nВывод: ценнее, чем кажется. Копите.',
          },
          voidCrystal: {
            title: '◈ КРИСТАЛЛ ПУСТОТЫ · КЛЕРК-7 ◈',
            text: 'Кристалл Пустоты — экзотический материал, обнаруженный исключительно в Секторе 3. Природа его образования не изучена. МММРДР не спешит изучать.\n\nОфициальная классификация: «объект неустановленной категории». Форма КП-0 «Идентификация неизвестного вещества» находится в разработке с момента открытия Сектора 3.\n\nВывод: что-то важное. Точно.',
          },
          echoShard: {
            title: '◈ ОСКОЛОК ЭХА · КЛЕРК-7 ◈',
            text: 'Осколок Эха — фрагментарный материал, излучающий слабый резонансный сигнал. Встречается в глубинах Сектора 3.\n\nПо непроверенным данным, звук, исходящий от осколка — это отголоски сигналов, поглощённых Пустотой. МММРДР официально опровергает эту теорию, не приводя альтернативной.\n\nВывод: берите. Пригодится.',
          },
        };
        const metal = metalInfoOpenId
          ? METALS.find((m) => m.id === metalInfoOpenId)
          : null;
        const info = metalInfoOpenId ? METAL_INFO[metalInfoOpenId] : null;
        return (
          <Popup
            visible={metalInfoOpenId !== null}
            title={info?.title ?? ''}
            onClose={() => {
              logEvent('toast_close', {
                toast: 'metal_info',
                metalId: metalInfoOpenId,
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
        const visibleTabs = TABS.filter((t) => {
          if (t.id === 'upgrades') return upgradesUnlocked;
          if (t.id === 'shipyard') return shipyardUnlocked;
          if (t.id === 'planets') return planetsUnlocked;
          if (t.id === 'battle') return battleUnlocked;
          if (t.id === 'shop') return shopUnlocked;
          return true;
        });
        if (visibleTabs.length < 2) return null;
        return (
          <RNSAView edges={['bottom']} style={styles.tabBarOuter}>
            <View style={styles.tabBar}>
              {visibleTabs.map((t) => {
                const active = tab === t.id;
                const hasBattle = t.id === 'battle' && !!game.battle;
                const hasDefeat = t.id === 'battle' && !!game.defeatInfo;
                const hasExpeditionDone =
                  t.id === 'shipyard' &&
                  game.expeditions.some(
                    (e) => (game.expeditionRemainingMap[e.shipId] ?? 1) === 0,
                  );
                const hasAffordableUpgrade =
                  t.id === 'upgrades' &&
                  tab !== 'upgrades' &&
                  getUpgrades().some(
                    (u) =>
                      game.energy >=
                      computeUpgradeCost(
                        u,
                        game.upgrades[u.id as UpgradeId] ?? 0,
                      ),
                  );
                const hasAttackablePlanet =
                  t.id === 'planets' &&
                  tab !== 'planets' &&
                  getAliens().some((alien) => {
                    const planet = getPlanets().find(
                      (p) => p.id === alien.planetId,
                    );
                    if (!planet) return false;
                    return (
                      !game.unlockedPlanetIds.includes(alien.planetId) &&
                      isSectorUnlocked(
                        planet.sectorId,
                        game.unlockedPlanetIds,
                        game.playerLevel,
                      ) &&
                      game.battle?.planetId !== alien.planetId &&
                      game.energy >= alien.attackEnergyCost
                    );
                  });
                const hasAffordableShipyard =
                  t.id === 'shipyard' &&
                  tab !== 'shipyard' &&
                  (getShips().some(
                    (ship) =>
                      !game.fleet.ownedShips.some(
                        (o) => o.shipId === ship.id,
                      ) &&
                      Object.entries(ship.baseCost).every(
                        ([m, qty]) =>
                          (game.metals[m as keyof typeof game.metals] ?? 0) >=
                          (qty ?? 0),
                      ),
                  ) ||
                    (game.fleet.ownedShips.length > 0 &&
                      getCannons().some((cannon) =>
                        game.fleet.ownedShips
                          .filter(
                            (ship) =>
                              !game.expeditions.some(
                                (e) => e.shipId === ship.shipId,
                              ),
                          )
                          .some((ship) => {
                            const cost = computeCannonCost(
                              cannon,
                              ship.cannons[cannon.id] ?? 0,
                            );
                            return Object.entries(cost).every(
                              ([m, qty]) =>
                                (game.metals[m as keyof typeof game.metals] ??
                                  0) >= (qty ?? 0),
                            );
                          }),
                      )));

                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      logEvent('tab_switch', { tab: t.id, via: 'tab_bar' });
                      onSetTab(t.id);
                    }}
                    style={styles.tabBtn}
                  >
                    <Text style={styles.tabIcon}>{t.icon}</Text>
                    <Text
                      style={[
                        styles.tabLabel,
                        active ? styles.tabLabelActive : null,
                      ]}
                    >
                      {t.label}
                    </Text>
                    {active ? <View style={styles.tabActiveLine} /> : null}
                    {hasBattle || hasDefeat ? (
                      <View
                        style={[
                          styles.tabBadge,
                          hasDefeat ? { backgroundColor: '#ff9900' } : {},
                        ]}
                      />
                    ) : null}
                    {hasExpeditionDone || hasAffordableShipyard ? (
                      <View
                        style={[
                          styles.tabBadge,
                          { backgroundColor: '#ff3b3b' },
                        ]}
                      />
                    ) : null}
                    {hasAffordableUpgrade ? (
                      <View
                        style={[
                          styles.tabBadge,
                          { backgroundColor: '#ff3b3b' },
                        ]}
                      />
                    ) : null}
                    {hasAttackablePlanet ? (
                      <View
                        style={[
                          styles.tabBadge,
                          { backgroundColor: '#ff3b30' },
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
          <Text style={styles.resetLabel}>СБРОС</Text>
        </Pressable>
        <Pressable onPress={openEditor} style={styles.editorBtn}>
          <Text style={styles.editorIcon}>✎</Text>
          <Text style={styles.editorLabel}>ПРОГ.</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            logEvent('modal_open', { modal: 'character_select' });
            game.openCharacterSelectFlow();
          }}
          style={styles.editorBtn}
        >
          <Text style={styles.editorIcon}>👤</Text>
          <Text style={styles.editorLabel}>ПЕРС.</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            logEvent('modal_open', { modal: 'metal_deal' });
            game.openMetalDealFlow();
          }}
          style={styles.editorBtn}
        >
          <Text style={styles.editorIcon}>🤝</Text>
          <Text style={styles.editorLabel}>СДЕЛКА</Text>
        </Pressable>
        <Pressable onPress={handleExportAnalytics} style={styles.editorBtn}>
          <Text style={styles.editorIcon}>📊</Text>
          <Text style={styles.editorLabel}>
            {analyticsSizeKb > 0 ? `${analyticsSizeKb}КБ` : 'ЛОГ'}
          </Text>
        </Pressable>
        <Pressable onPress={handleClearAnalytics} style={styles.editorBtn}>
          <Text style={styles.editorIcon}>🗑️</Text>
          <Text style={styles.editorLabel}>ОЧИСТ.</Text>
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
            <Text style={styles.editorCardTitle}>◈ РЕДАКТОР ПРОГРЕССА ◈</Text>
            <ScrollView
              style={styles.editorScroll}
              keyboardShouldPersistTaps="handled"
            >
              {(
                [
                  { key: 'energy', label: 'Энергия' },
                  { key: 'playerXP', label: 'Опыт (XP)' },
                  { key: 'iron', label: 'Железо' },
                  { key: 'titan', label: 'Титан' },
                  { key: 'iridium', label: 'Иридий' },
                ] as { key: keyof typeof editorFields; label: string }[]
              ).map(({ key, label }) => (
                <View key={key} style={styles.editorRow}>
                  <Text style={styles.editorFieldLabel}>{label}</Text>
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
                  { key: 'unlockUpgrades', label: 'Апгрейды открыты' },
                  { key: 'unlockShipyard', label: 'Верфь открыта' },
                  { key: 'unlockPlanets', label: 'Планеты открыты' },
                ] as { key: keyof typeof editorToggles; label: string }[]
              ).map(({ key, label }) => (
                <View key={key} style={styles.editorRow}>
                  <Text style={styles.editorFieldLabel}>{label}</Text>
                  <Pressable
                    onPress={() =>
                      setEditorToggles((t) => ({ ...t, [key]: !t[key] }))
                    }
                    style={[
                      styles.editorToggle,
                      editorToggles[key]
                        ? styles.editorToggleOn
                        : styles.editorToggleOff,
                    ]}
                  >
                    <Text
                      style={[
                        styles.editorToggleText,
                        editorToggles[key] ? styles.editorToggleTextOn : null,
                      ]}
                    >
                      {editorToggles[key] ? 'ВКЛ' : 'ВЫКЛ'}
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
                <Text style={styles.resetCardCancelText}>Отмена</Text>
              </Pressable>
              <Pressable style={styles.resetCardConfirm} onPress={applyEditor}>
                <Text style={styles.resetCardConfirmText}>Применить</Text>
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
            <Text style={styles.resetCardTitle}>◈ СБРОС ПРОГРЕССА ◈</Text>
            <Text style={styles.resetCardText}>
              Весь прогресс будет удалён без возможности восстановления.
            </Text>
            <Pressable
              style={styles.resetCheckboxRow}
              onPress={() => setResetShowIntro((v) => !v)}
            >
              <View
                style={[
                  styles.resetCheckbox,
                  resetShowIntro && styles.resetCheckboxChecked,
                ]}
              >
                {resetShowIntro ? (
                  <Text style={styles.resetCheckboxMark}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.resetCheckboxLabel}>Показать интро</Text>
            </Pressable>
            <View style={styles.resetCardButtons}>
              <Pressable
                style={styles.resetCardCancel}
                onPress={() => setResetConfirmOpen(false)}
              >
                <Text style={styles.resetCardCancelText}>Отмена</Text>
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
                <Text style={styles.resetCardConfirmText}>Сбросить</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </RNSAView>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabId>('game');
  const [initial, setInitial] = useState<GameStateInit | undefined>(undefined);
  const [introSeen, setIntroSeen] = useState<boolean | undefined>(undefined);
  const [gameKey, setGameKey] = useState(0);
  const [offlineEarnings, setOfflineEarnings] = useState(0);

  const sessionIdRef = useRef(
    Math.random().toString(36).slice(2) + Date.now().toString(36),
  );
  useEffect(() => {
    initAnalytics(sessionIdRef.current);

    const prevHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logError(error, { isFatal });
      prevHandler?.(error, isFatal);
    });

    if (Platform.OS === 'web') {
      bootstrapTelegram();

      const onUnhandled = (event: PromiseRejectionEvent) => {
        logError(event.reason, { type: 'unhandledrejection' });
      };
      window.addEventListener('unhandledrejection', onUnhandled);
      return () =>
        window.removeEventListener('unhandledrejection', onUnhandled);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // In Telegram runtime: auth first so getAccessToken() returns a valid
      // token for the cloud-sync step below. No-op on native and plain web.
      await telegramAuthIfNeeded();

      const [loaded, seen, token] = await Promise.all([
        loadGame(),
        loadIntroSeen(),
        getAccessToken(),
      ]);
      if (!mounted) return;

      // Cloud sync: if logged in, fetch cloud save and pick the newer snapshot
      let cloudState: GameStateInit | undefined;
      let cloudSavedAt = 0;
      if (token) {
        const cloud = await fetchCloudSave();
        if (cloud) {
          const localSavedAt = loaded?.savedAt ?? 0;
          cloudSavedAt = cloud.data.savedAt ?? 0;
          if (cloudSavedAt > localSavedAt) {
            cloudState = cloud.data.state;
          }
        }
      }

      const resolvedState = cloudState ?? loaded?.state;
      const resolvedSavedAt = cloudState
        ? cloudSavedAt
        : (loaded?.savedAt ?? 0);

      if (resolvedState) {
        const state = resolvedState;
        const savedAt = resolvedSavedAt;
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
              (p) => p.id === (state.selectedPlanetId ?? planets[0].id),
            ) ?? planets[0];
          const passiveRate = basePassive * planet.bonus;
          const earnings = Math.floor(
            passiveRate * Math.min(elapsedSeconds, 8 * 3600),
          );
          if (earnings > 0) {
            state.energy = (state.energy ?? 0) + earnings;
            state.totalEarned = (state.totalEarned ?? 0) + earnings;
            setOfflineEarnings(earnings);
          }
        }
        setInitial(state);
      } else {
        setInitial({});
      }
      setIntroSeen(seen);
    })();
    return () => {
      mounted = false;
    };
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

  if (!unlocked) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <PasswordScreen onUnlock={() => setUnlocked(true)} />
      </View>
    );
  }

  if (initial === undefined || introSeen === undefined) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <GameApp
          key={gameKey}
          initial={initial}
          tab={tab}
          onSetTab={setTab}
          onReset={handleReset}
        />
        <IntroOverlay
          visible={!introSeen}
          onDone={async () => {
            setIntroSeen(true);
            await saveIntroSeen(true);
          }}
        />
        <Popup
          visible={offlineEarnings > 0}
          title="ОФЛАЙН-ДОБЫЧА"
          headerEmoji="⚡"
          text={`Пока вас не было, реакторы не простаивали.\n\nНакоплено: +${formatNum(offlineEarnings)} энергии.`}
          onClose={() => setOfflineEarnings(0)}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(0,212,255,0.7)', fontWeight: '800' },
  tabBarOuter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.15)',
    backgroundColor: 'rgba(0,10,30,0.95)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabBtn: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative',
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    marginTop: 1,
    fontSize: 7,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '800',
  },
  tabLabelActive: { color: '#00d4ff' },
  tabActiveLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 5,
    height: 2,
    backgroundColor: '#00d4ff',
  },
  resetBtn: { alignItems: 'center', gap: 2 },
  resetIcon: { fontSize: 12, color: 'rgba(255,80,80,0.55)' },
  resetLabel: {
    fontSize: 6,
    color: 'rgba(255,80,80,0.45)',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,5,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resetCard: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  resetCardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,80,80,0.85)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  resetCardText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.85)',
    lineHeight: 20,
    textAlign: 'center',
  },
  resetCardButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  resetCardCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    alignItems: 'center',
  },
  resetCardCancelText: {
    color: 'rgba(0,212,255,0.8)',
    fontWeight: '700',
    fontSize: 13,
  },
  resetCardConfirm: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(180,30,30,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.4)',
    alignItems: 'center',
  },
  resetCardConfirmText: {
    color: 'rgba(255,120,120,0.95)',
    fontWeight: '700',
    fontSize: 13,
  },
  resetCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  resetCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetCheckboxChecked: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.8)',
  },
  resetCheckboxMark: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  resetCheckboxLabel: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.75)',
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: '20%',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  sideButtons: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -38 }],
    alignItems: 'center',
    gap: 8,
  },
  editorBtn: { alignItems: 'center', gap: 2 },
  editorIcon: { fontSize: 14, color: 'rgba(0,212,255,0.55)' },
  editorLabel: {
    fontSize: 6,
    color: 'rgba(0,212,255,0.45)',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  editorCard: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  editorCardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.85)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  editorScroll: { maxHeight: 280 },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.08)',
  },
  editorFieldLabel: {
    fontSize: 12,
    color: 'rgba(200,230,255,0.85)',
    fontWeight: '600',
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
    textAlign: 'right',
  },
  editorDivider: {
    height: 1,
    backgroundColor: 'rgba(0,212,255,0.12)',
    marginVertical: 6,
  },
  editorToggle: {
    width: 70,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editorToggleOn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.5)',
  },
  editorToggleOff: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  editorToggleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.3)',
  },
  editorToggleTextOn: { color: '#00d4ff' },
});
