import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  SafeAreaView as RNSAView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { logEvent } from '../game/analytics';
import { getAliens } from '../game/ALIENS';
import { formatNum } from '../game/formatNum';
import { t } from '../game/i18n';
import { getResearchNodes } from '../game/RESEARCH';
import { getStoryLogUnlockedEntries } from '../game/STORY_LOG';
import { useAutoSave } from '../game/useAutoSave';
import { useGame } from '../game/useGame';
import { useGrantSync } from '../game/useGrantSync';
import type { DialoguesPayload } from '../game/dialogues';
import type { MetalId } from '../game/METALS';
import type { GameState, GameStateInit } from '../game/types';
import { TelegramSafeAreaInsetsCtx } from '../telegram/runtime';
import { BattleScreen } from '../screens/BattleScreen';
import { GameScreen } from '../screens/GameScreen';
import { PlanetsScreen } from '../screens/PlanetsScreen';
import { ShipyardScreen } from '../screens/shipyard';
import { ShopScreen } from '../screens/ShopScreen';
import { UpgradesScreen } from '../screens/UpgradesScreen';
import { CharacterCommunicationChannel } from './CharacterCommunicationChannel';
// import { DevTools } from './DevTools';
import { GameModals } from './GameModals';
import { GameToasts } from './GameToasts';
import { GlobalStatsBar } from './GlobalStatsBar';
import { MetalInfoPopup } from './MetalInfoPopup';
import { Popup } from './Popup';
import { StarField } from './StarField';
import { TabBar } from './TabBar';
import type { TabId } from './TabBar';
import { getModuleById } from '../game/MODULES';
import type { SupportedLocale } from './LocalePickerOverlay';

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
        <View
          style={{
            flex: 1,
            backgroundColor: '#050918',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              color: '#ff4444',
              fontSize: 13,
              fontWeight: '800',
              marginBottom: 8,
            }}
          >
            {t('ui.error_boundary.crash_title')}
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 11,
              textAlign: 'center',
            }}
          >
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export { GameAppErrorBoundary };

type Props = {
  initial: GameStateInit;
  initialAppliedGrantSeq: number;
  dialogues: DialoguesPayload;
  tab: TabId;
  onSetTab: (t: TabId) => void;
  onReset: (showIntro?: boolean) => void;
  onChangeLocale: (locale: SupportedLocale) => Promise<void> | void;
};

export function GameApp({
  initial,
  initialAppliedGrantSeq,
  dialogues,
  tab,
  onSetTab,
  onReset,
  onChangeLocale,
}: Props) {
  const appliedGrantSeqRef = useRef(initialAppliedGrantSeq);
  const safeInsets = useSafeAreaInsets();
  const tgInsets = React.useContext(TelegramSafeAreaInsetsCtx);
  const tgTopPadding =
    Math.max(0, tgInsets.sysTop - safeInsets.top) + tgInsets.contentTop;

  const game = useGame(initial, dialogues);
  const latestRef = useRef<GameState & { replaceStateFromSync: any }>(
    game as any,
  );
  useEffect(() => {
    latestRef.current = game as any;
  });

  useAutoSave(latestRef, appliedGrantSeqRef);
  const syncPendingGrantsNow = useGrantSync(appliedGrantSeqRef, latestRef);

  const minAttackEnergy = Math.min(
    ...getAliens().map((a) => a.attackEnergyCost),
  );
  const screenGreetedRef = useRef<Set<string>>(new Set());
  const prevCharacterMessageRef = useRef<string | null>(null);

  const [statsBarHeight, setStatsBarHeight] = useState(0);
  const [researchOpen, setResearchOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [storyLogOpen, setStoryLogOpen] = useState(false);
  const [prestigeOpen, setPrestigeOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [seenStoryCount, setSeenStoryCount] = useState(0);
  const [clickPowerInfoOpen, setClickPowerInfoOpen] = useState(false);
  const [passiveRateInfoOpen, setPassiveRateInfoOpen] = useState(false);
  const [metalInfoOpenId, setMetalInfoOpenId] = useState<MetalId | null>(null);

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

  const goToTab = useCallback(
    (t: TabId) => {
      logEvent('tab_switch', { tab: t, via: 'action' });
      setResearchOpen(false);
      setAchievementsOpen(false);
      onSetTab(t);
    },
    [onSetTab],
  );

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
                  loreKey: game.achievementToast.loreKey,
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
            };
            setSeenStoryCount(getStoryLogUnlockedEntries(ctx).length);
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
            if (
              !game.canPrestige &&
              game.prestigeBlockedReason === 'level_too_low'
            ) {
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
              chosenCharacterId: game.chosenCharacterId,
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
          onChangeLocale={onChangeLocale}
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
          onStarsPurchaseApplied={() => syncPendingGrantsNow()}
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
    <LinearGradient
      colors={['#050918', '#0a1628', '#061020']}
      style={styles.gradientBg}
    >
      <StarField />
      <RNSAView
        edges={['top']}
        style={[
          styles.container,
          { backgroundColor: 'transparent' },
          tgTopPadding > 0 ? { paddingTop: tgTopPadding } : null,
        ]}
      >
        <StatusBar style="light" />
        {tab !== 'battle' && (
          <View
            onLayout={(e) => setStatsBarHeight(e.nativeEvent.layout.height)}
          >
            <GlobalStatsBar
              energy={game.energy}
              metals={game.metals}
              discoveredMetals={game.discoveredMetals}
              onOpenMetalInfo={(metalId) => {
                logEvent('modal_open', { modal: 'metal_info', metalId });
                setMetalInfoOpenId(metalId);
              }}
            />
          </View>
        )}
        <View style={styles.content}>{tabContent}</View>

        <GameModals
          statsBarHeight={statsBarHeight}
          telegramTopInset={tgTopPadding}
          researchOpen={researchOpen}
          onCloseResearch={() => setResearchOpen(false)}
          playerLevel={game.playerLevel}
          playerXP={game.playerXP}
          energy={game.energy}
          research={game.research}
          onBuyResearch={game.buyResearch}
          battleUnlocked={battleUnlocked}
          expeditionUnlocked={shipyardUnlocked}
          storyLogOpen={storyLogOpen}
          onCloseStoryLog={() => setStoryLogOpen(false)}
          dialogues={dialogues}
          unlockedPlanetIds={game.unlockedPlanetIds}
          chosenCharacterId={game.chosenCharacterId}
          prestigeOpen={prestigeOpen}
          onClosePrestige={() => setPrestigeOpen(false)}
          prestige={game.prestige}
          prestigeBlockedReason={game.prestigeBlockedReason}
          canPrestige={game.canPrestige}
          onConfirmPrestige={() => {
            logEvent('prestige_confirm', {
              playerLevel: game.playerLevel,
              prestigeCountBefore: game.prestige.count,
            });
            game.performPrestige();
          }}
          achievementsOpen={achievementsOpen}
          onCloseAchievements={() => setAchievementsOpen(false)}
          achievements={game.achievements}
          onClaimAchievement={game.claimAchievement}
        />

        <GameToasts
          firstIronToast={game.firstIronToast}
          onCloseFirstIronToast={game.closeFirstIronToast}
          achievementsUnlockToast={game.achievementsUnlockToast}
          onCloseAchievementsUnlockToast={game.closeAchievementsUnlockToast}
          onOpenAchievements={() => setAchievementsOpen(true)}
          upgradesUnlockToast={game.upgradesUnlockToast}
          onCloseUpgradesUnlockToast={game.closeUpgradesUnlockToast}
          currentUnlockToast={game.currentUnlockToast}
          onDismissUnlockToast={game.dismissUnlockToast}
          firstShipToast={game.firstShipToast}
          onCloseFirstShipToast={game.closeFirstShipToast}
          planetsUnlocked={planetsUnlocked}
          minAttackEnergy={minAttackEnergy}
          planetsUnlockToast={game.planetsUnlockToast}
          onClosePlanetsUnlockToast={game.closePlanetsUnlockToast}
          shipyardUnlockToast={game.shipyardUnlockToast}
          onCloseShipyardUnlockToast={game.closeShipyardUnlockToast}
          planetUnlockToast={game.planetUnlockToast}
          onClosePlanetUnlockToast={game.closePlanetUnlockToast}
          onGoToTab={goToTab}
        />

        <MetalInfoPopup
          metalInfoOpenId={metalInfoOpenId}
          onClose={() => setMetalInfoOpenId(null)}
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
          title={t('ui.click_power_info.title')}
          onClose={() => {
            logEvent('toast_close', { toast: 'click_power_info' });
            setClickPowerInfoOpen(false);
          }}
          headerEmoji="⛏️"
          text={t('ui.click_power_info.text', {
            clickPower:
              game.clickPower < 1000
                ? game.clickPower.toFixed(2)
                : formatNum(game.clickPower),
          })}
          clerk
        />

        <Popup
          visible={passiveRateInfoOpen}
          title={t('ui.passive_rate_info.title')}
          onClose={() => {
            logEvent('toast_close', { toast: 'passive_rate_info' });
            setPassiveRateInfoOpen(false);
          }}
          headerEmoji="⚡"
          text={t('ui.passive_rate_info.text', {
            passiveRate: formatNum(game.passiveRate),
          })}
          clerk
        />

        <TabBar
          tab={tab}
          onSetTab={onSetTab}
          upgradesUnlocked={upgradesUnlocked}
          shipyardUnlocked={shipyardUnlocked}
          planetsUnlocked={planetsUnlocked}
          battleUnlocked={battleUnlocked}
          shopUnlocked={shopUnlocked}
          energy={game.energy}
          upgrades={game.upgrades}
          metals={game.metals}
          fleet={game.fleet}
          battle={game.battle}
          defeatInfo={game.defeatInfo}
          expeditions={game.expeditions}
          expeditionRemainingMap={game.expeditionRemainingMap}
          unlockedPlanetIds={game.unlockedPlanetIds}
          playerLevel={game.playerLevel}
        />

        {/* <DevTools
          energy={game.energy}
          iron={game.metals.iron}
          titan={game.metals.titan}
          iridium={game.metals.iridium}
          playerXP={game.playerXP}
          upgradesUnlocked={upgradesUnlocked}
          shipyardUnlocked={shipyardUnlocked}
          planetsUnlocked={planetsUnlocked}
          onApplyEditor={(patch) => {
            game.debugSetValues({
              energy: patch.energy,
              iron: patch.iron,
              titan: patch.titan,
              iridium: patch.iridium,
              playerXP: patch.playerXP,
              tabsUnlocked: patch.tabsUnlocked,
            });
          }}
          onReset={onReset}
        /> */}
      </RNSAView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: { flex: 1 },
  container: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  content: { flex: 1 },
});
