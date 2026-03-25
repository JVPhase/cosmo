import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { BattleScreen } from './src/screens/BattleScreen';
import { GameScreen } from './src/screens/GameScreen';
import { PlanetsScreen } from './src/screens/PlanetsScreen';
import { ResearchScreen } from './src/screens/ResearchScreen';
import { ShipyardScreen } from './src/screens/ShipyardScreen';
import { UpgradesScreen } from './src/screens/UpgradesScreen';
import { IntroOverlay } from './src/ui/IntroOverlay';
import { ModalSheet } from './src/ui/ModalSheet';
import { PasswordScreen } from './src/ui/PasswordScreen';
import { useGame } from './src/game/useGame';
import {
  clearGame,
  loadGame,
  loadIntroSeen,
  saveGame,
  saveIntroSeen
} from './src/game/storage';
import { ALIENS } from './src/game/ALIENS';
import { SHIPS } from './src/game/SHIPS';
import { CANNONS, computeCannonCost } from './src/game/CANNONS';
import { computeUpgradeCost, UPGRADES } from './src/game/UPGRADES';
import { RESEARCH } from './src/game/RESEARCH';
import type { GameStateInit } from './src/game/types';

const MIN_ATTACK_ENERGY = Math.min(...ALIENS.map((a) => a.attackEnergyCost));
const MIN_UPGRADE_COST = Math.min(...UPGRADES.map((u) => u.baseCost));

type TabId = 'game' | 'upgrades' | 'planets' | 'shipyard' | 'battle';

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'game', icon: '⛏️', label: 'ДОБЫЧА' },
  { id: 'upgrades', icon: '⚡', label: 'АПГР.' },
  { id: 'planets', icon: '🌍', label: 'ПЛАН.' },
  { id: 'shipyard', icon: '🛠️', label: 'ВЕРФЬ' },
  { id: 'battle', icon: '⚔️', label: 'БОЙ' }
];

function GameApp({
  initial,
  tab,
  onSetTab,
  onReset
}: {
  initial: GameStateInit;
  tab: TabId;
  onSetTab: (t: TabId) => void;
  onReset: () => void;
}) {
  const game = useGame(initial);
  const [researchOpen, setResearchOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
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
    if (editorToggles.unlockUpgrades)
      energy = Math.max(energy, MIN_UPGRADE_COST);
    if (editorToggles.unlockPlanets)
      energy = Math.max(energy, MIN_ATTACK_ENERGY);
    if (editorToggles.unlockShipyard)
      iron = Math.max(iron, SHIPS[0].baseCost.iron ?? 30);
    game.debugSetValues({
      energy,
      iron,
      titan: parse(editorFields.titan),
      iridium: parse(editorFields.iridium),
      playerXP: parse(editorFields.playerXP)
    });
    setEditorOpen(false);
  };

  const latestRef = useRef(game);
  useEffect(() => {
    latestRef.current = game;
  });

  // Save every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const g = latestRef.current;
      saveGame({
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
        expeditions: g.expeditions
      } as any).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const firstShipCost = SHIPS[0].baseCost;
  const shipyardUnlocked =
    game.fleet.ownedShips.length > 0 ||
    Object.entries(firstShipCost).every(
      ([metal, qty]) =>
        (game.metals[metal as keyof typeof game.metals] ?? 0) >= (qty ?? 0)
    );

  const upgradesUnlocked =
    game.energy >= MIN_UPGRADE_COST ||
    Object.values(game.upgrades).some((v) => v > 0);

  const planetsUnlocked =
    game.unlockedPlanetIds.length > 1 || game.energy >= MIN_ATTACK_ENERGY;

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
          onCloseClerk={game.closeClerk}
          achievementToast={
            game.achievementToast
              ? {
                  id: game.achievementToast.id,
                  name: game.achievementToast.name,
                  icon: game.achievementToast.icon,
                  lore: game.achievementToast.lore
                }
              : null
          }
          onCloseAchievementToast={game.closeAchievementToast}
          playerLevel={game.playerLevel}
          playerXP={game.playerXP}
          levelUpToast={game.levelUpToast}
          onCloseLevelUpToast={game.closeLevelUpToast}
          firstIronToast={game.firstIronToast}
          onCloseFirstIronToast={game.closeFirstIronToast}
          hasAffordableResearch={RESEARCH.some(
            (n) =>
              !game.research[n.id] &&
              game.playerLevel >= n.requiredLevel &&
              n.requires.every((r) => game.research[r]) &&
              game.energy >= n.energyCost &&
              (n.branch !== 'battle' || battleUnlocked)
          )}
          onOpenResearch={() => setResearchOpen(true)}
          onOpenAchievements={() => setAchievementsOpen(true)}
          achievementsUnlocked={game.achievementsUnlocked}
          achievementsUnlockToast={game.achievementsUnlockToast}
          onCloseAchievementsUnlockToast={game.closeAchievementsUnlockToast}
          upgradesUnlockToast={game.upgradesUnlockToast}
          onCloseUpgradesUnlockToast={game.closeUpgradesUnlockToast}
          onOpenUpgrades={() => onSetTab('upgrades')}
          currentUnlockToast={game.currentUnlockToast}
          onDismissUnlockToast={game.dismissUnlockToast}
          firstShipToast={game.firstShipToast}
          onCloseFirstShipToast={game.closeFirstShipToast}
          shipyardUnlockToast={game.shipyardUnlockToast}
          onCloseShipyardUnlockToast={game.closeShipyardUnlockToast}
          onOpenShipyard={() => onSetTab('shipyard')}
          planetUnlockToast={game.planetUnlockToast}
          onClosePlanetUnlockToast={game.closePlanetUnlockToast}
          onOpenPlanets={() => onSetTab('planets')}
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
          onBuildShip={game.buildShip}
          onRepairShip={game.repairShip}
          onSelectShip={game.selectShip}
          onCraftCannon={(shipId, cannonId) =>
            game.craftCannon(shipId, cannonId)
          }
          onStartExpedition={game.startExpedition}
          onClaimExpedition={game.claimExpedition}
        />
      );
      break;
    case 'battle':
      tabContent = (
        <BattleScreen
          battle={game.battle}
          timeRemaining={game.timeRemaining}
          totalDamage={game.totalDamage}
          defeatInfo={game.defeatInfo}
          onAttack={game.attackBattle}
          onForfeit={game.forfeitBattle}
          onGoToShipyard={() => onSetTab('shipyard')}
          onClearDefeat={game.clearDefeatInfo}
        />
      );
      break;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>{tabContent}</View>

      <ModalSheet
        visible={researchOpen}
        title="◈ ИССЛЕДОВАНИЯ · МММРДР ◈"
        onClose={() => setResearchOpen(false)}
      >
        <ResearchScreen
          playerLevel={game.playerLevel}
          playerXP={game.playerXP}
          energy={game.energy}
          research={game.research}
          onBuyResearch={game.buyResearch}
          battleUnlocked={battleUnlocked}
        />
      </ModalSheet>

      <ModalSheet
        visible={achievementsOpen}
        title="◈ ЛИЧНОЕ ДЕЛО ◈"
        onClose={() => setAchievementsOpen(false)}
      >
        <AchievementsScreen achievements={game.achievements} />
      </ModalSheet>

      {(() => {
        const visibleTabs = TABS.filter((t) => {
          if (t.id === 'upgrades') return upgradesUnlocked;
          if (t.id === 'shipyard') return shipyardUnlocked;
          if (t.id === 'planets') return planetsUnlocked;
          if (t.id === 'battle') return battleUnlocked;
          return true;
        });
        if (visibleTabs.length < 2) return null;
        return (
          <View style={styles.tabBar}>
            {visibleTabs.map((t) => {
              const active = tab === t.id;
              const hasBattle = t.id === 'battle' && !!game.battle;
              const hasDefeat = t.id === 'battle' && !!game.defeatInfo;
              const hasExpeditionDone =
                t.id === 'shipyard' &&
                game.expeditions.some(
                  (e) => (game.expeditionRemainingMap[e.shipId] ?? 1) === 0
                );
              const hasAffordableUpgrade =
                t.id === 'upgrades' &&
                tab !== 'upgrades' &&
                UPGRADES.some(
                  (u) =>
                    game.energy >=
                    computeUpgradeCost(u, game.upgrades[u.id] ?? 0)
                );
              const hasAffordableShipyard =
                t.id === 'shipyard' &&
                tab !== 'shipyard' &&
                (SHIPS.some(
                  (ship) =>
                    !game.fleet.ownedShips.some((o) => o.shipId === ship.id) &&
                    Object.entries(ship.baseCost).every(
                      ([m, qty]) =>
                        (game.metals[m as keyof typeof game.metals] ?? 0) >=
                        (qty ?? 0)
                    )
                ) ||
                  (game.fleet.ownedShips.length > 0 &&
                    CANNONS.some((cannon) =>
                      game.fleet.ownedShips.some((ship) => {
                        const cost = computeCannonCost(
                          cannon,
                          ship.cannons[cannon.id] ?? 0
                        );
                        return Object.entries(cost).every(
                          ([m, qty]) =>
                            (game.metals[m as keyof typeof game.metals] ?? 0) >=
                            (qty ?? 0)
                        );
                      })
                    )));

              return (
                <Pressable
                  key={t.id}
                  onPress={() => onSetTab(t.id)}
                  style={styles.tabBtn}
                >
                  <Text style={styles.tabIcon}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      active ? styles.tabLabelActive : null
                    ]}
                  >
                    {t.label}
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
                      style={[styles.tabBadge, { backgroundColor: '#ff3b3b' }]}
                    />
                  ) : null}
                  {hasAffordableUpgrade ? (
                    <View
                      style={[styles.tabBadge, { backgroundColor: '#ff3b3b' }]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        );
      })()}

      <View style={styles.sideButtons}>
        <Pressable
          onPress={() => setResetConfirmOpen(true)}
          style={styles.resetBtn}
        >
          <Text style={styles.resetIcon}>✕</Text>
          <Text style={styles.resetLabel}>СБРОС</Text>
        </Pressable>
        <Pressable onPress={openEditor} style={styles.editorBtn}>
          <Text style={styles.editorIcon}>✎</Text>
          <Text style={styles.editorLabel}>ПРОГ.</Text>
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
                  { key: 'iridium', label: 'Иридий' }
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
                  { key: 'unlockPlanets', label: 'Планеты открыты' }
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
                        : styles.editorToggleOff
                    ]}
                  >
                    <Text
                      style={[
                        styles.editorToggleText,
                        editorToggles[key] ? styles.editorToggleTextOn : null
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
                  setResetConfirmOpen(false);
                  onReset();
                }}
              >
                <Text style={styles.resetCardConfirmText}>Сбросить</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabId>('game');
  const [initial, setInitial] = useState<GameStateInit | undefined>(undefined);
  const [introSeen, setIntroSeen] = useState<boolean | undefined>(undefined);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [loaded, seen] = await Promise.all([loadGame(), loadIntroSeen()]);
      if (!mounted) return;
      setInitial(loaded ?? {});
      setIntroSeen(seen);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleReset = useCallback(async () => {
    await clearGame().catch(() => {});
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(0,212,255,0.7)', fontWeight: '800' },
  tabBar: {
    height: 68,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.15)',
    backgroundColor: 'rgba(0,10,30,0.95)'
  },
  tabBtn: {
    flex: 1,
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
