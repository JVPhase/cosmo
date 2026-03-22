import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { UpgradesScreen } from "./src/screens/UpgradesScreen";
import { PlanetsScreen } from "./src/screens/PlanetsScreen";
import { AchievementsScreen } from "./src/screens/AchievementsScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { ShipyardScreen } from "./src/screens/ShipyardScreen";
import { BattleScreen } from "./src/screens/BattleScreen";
import { IntroOverlay } from "./src/ui/IntroOverlay";
import { PasswordScreen } from "./src/ui/PasswordScreen";
import { useGame } from "./src/game/useGame";
import { loadGame, loadIntroSeen, saveGame, saveIntroSeen } from "./src/game/storage";
import type { GameStateInit } from "./src/game/types";

type TabId = "game" | "upgrades" | "planets" | "shipyard" | "battle" | "achievements";

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: "game", icon: "⛏️", label: "ДОБЫЧА" },
  { id: "upgrades", icon: "⚡", label: "АПГР." },
  { id: "planets", icon: "🌍", label: "ПЛАН." },
  { id: "shipyard", icon: "🛠️", label: "ВЕРФЬ" },
  { id: "battle", icon: "⚔️", label: "БОЙ" },
  { id: "achievements", icon: "🏆", label: "ДЕЛО" },
];

function GameApp({ initial, tab, onSetTab }: { initial: GameStateInit; tab: TabId; onSetTab: (t: TabId) => void }) {
  const game = useGame(initial);

  const latestRef = useRef(game);
  useEffect(() => { latestRef.current = game; });

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
      } as any).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-switch to game tab after battle victory
  useEffect(() => {
    if (game.battleVictory) {
      onSetTab("game");
      game.clearBattleVictory();
    }
  }, [game.battleVictory]);

  let tabContent: React.ReactNode = null;
  switch (tab) {
    case "game":
      tabContent = (
        <GameScreen
          energy={game.energy}
          totalEarned={game.totalEarned}
          clickPower={game.clickPower}
          passiveRate={game.passiveRate}
          metals={game.metals}
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
                  lore: game.achievementToast.lore,
                }
              : null
          }
          onCloseAchievementToast={game.closeAchievementToast}
        />
      );
      break;
    case "upgrades":
      tabContent = <UpgradesScreen energy={game.energy} upgrades={game.upgrades} onBuyUpgrade={game.buyUpgrade} />;
      break;
    case "planets":
      tabContent = (
        <PlanetsScreen
          unlockedPlanetIds={game.unlockedPlanetIds}
          selectedPlanetId={game.selectedPlanetId}
          battle={game.battle}
          shipDamage={game.totalDamage}
          energy={game.energy}
          onAttackPlanet={(id) => {
            game.startBattle(id);
            onSetTab("battle");
          }}
          onChoosePlanet={(id) => {
            game.selectPlanet(id);
            onSetTab("game");
          }}
        />
      );
      break;
    case "shipyard":
      tabContent = (
        <ShipyardScreen
          metals={game.metals}
          fleet={game.fleet}
          totalDamage={game.totalDamage}
          battle={game.battle}
          onBuildShip={game.buildShip}
          onRepairShip={game.repairShip}
          onSelectShip={game.selectShip}
          onCraftCannon={(shipId, cannonId) => game.craftCannon(shipId, cannonId)}
        />
      );
      break;
    case "battle":
      tabContent = (
        <BattleScreen
          battle={game.battle}
          timeRemaining={game.timeRemaining}
          totalDamage={game.totalDamage}
          defeatInfo={game.defeatInfo}
          onAttack={game.attackBattle}
          onGoToShipyard={() => onSetTab("shipyard")}
          onClearDefeat={game.clearDefeatInfo}
        />
      );
      break;
    case "achievements":
      tabContent = <AchievementsScreen achievements={game.achievements} />;
      break;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>{tabContent}</View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.id;
          const hasBattle = t.id === "battle" && !!game.battle;
          const hasDefeat = t.id === "battle" && !!game.defeatInfo;
          return (
            <Pressable key={t.id} onPress={() => onSetTab(t.id)} style={styles.tabBtn}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{t.label}</Text>
              {active ? <View style={styles.tabActiveLine} /> : null}
              {(hasBattle || hasDefeat) ? (
                <View style={[styles.tabBadge, hasDefeat ? { backgroundColor: "#ff9900" } : {}]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabId>("game");
  const [initial, setInitial] = useState<GameStateInit | undefined>(undefined);
  const [introSeen, setIntroSeen] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [loaded, seen] = await Promise.all([loadGame(), loadIntroSeen()]);
      if (!mounted) return;
      setInitial(loaded ?? {});
      setIntroSeen(seen);
    })();
    return () => { mounted = false; };
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
      <GameApp initial={initial} tab={tab} onSetTab={setTab} />
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
  container: { flex: 1, backgroundColor: "#050918" },
  content: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "rgba(0,212,255,0.7)", fontWeight: "800" },
  tabBar: {
    height: 72,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,212,255,0.15)",
    backgroundColor: "rgba(0,10,30,0.95)",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    position: "relative",
  },
  tabIcon: { fontSize: 16 },
  tabLabel: {
    marginTop: 2,
    fontSize: 8,
    letterSpacing: 0.5,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "800",
  },
  tabLabelActive: { color: "#00d4ff" },
  tabActiveLine: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 6,
    height: 2,
    backgroundColor: "#00d4ff",
  },
  tabBadge: {
    position: "absolute",
    top: 8,
    right: "25%",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ff4444",
  },
});
