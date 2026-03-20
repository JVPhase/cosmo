import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { UpgradesScreen } from "./src/screens/UpgradesScreen";
import { PlanetsScreen } from "./src/screens/PlanetsScreen";
import { AchievementsScreen } from "./src/screens/AchievementsScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { IntroOverlay } from "./src/ui/IntroOverlay";
import { useGame } from "./src/game/useGame";
import { loadGame, loadIntroSeen, saveGame, saveIntroSeen } from "./src/game/storage";
import type { GameStateInit } from "./src/game/types";

type TabId = "game" | "upgrades" | "planets" | "achievements";

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: "game", icon: "⛏️", label: "ДОБЫЧА" },
  { id: "upgrades", icon: "⚡", label: "АПГРЕЙДЫ" },
  { id: "planets", icon: "🌍", label: "ПЛАНЕТЫ" },
  { id: "achievements", icon: "🏆", label: "ДЕЛО" },
];

function GameApp({ initial, tab, onSetTab }: { initial: GameStateInit; tab: TabId; onSetTab: (t: TabId) => void }) {
  const game = useGame(initial);

  const latestSaveRef = useRef({
    energy: game.energy,
    totalEarned: game.totalEarned,
    clicks: game.clicks,
    upgrades: game.upgrades,
    unlockedPlanetIds: game.unlockedPlanetIds,
    achievements: game.achievements,
    selectedPlanetId: game.selectedPlanetId,
  });

  useEffect(() => {
    latestSaveRef.current = {
      energy: game.energy,
      totalEarned: game.totalEarned,
      clicks: game.clicks,
      upgrades: game.upgrades,
      unlockedPlanetIds: game.unlockedPlanetIds,
      achievements: game.achievements,
      selectedPlanetId: game.selectedPlanetId,
    };
  }, [game.energy, game.totalEarned, game.clicks, game.upgrades, game.unlockedPlanetIds, game.selectedPlanetId, game.achievements]);

  // Save every few seconds (avoid saving on each tick).
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame(latestSaveRef.current).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  let tabContent: React.ReactNode = null;
  switch (tab) {
    case "game":
      tabContent = (
        <GameScreen
          energy={game.energy}
          totalEarned={game.totalEarned}
          clickPower={game.clickPower}
          passiveRate={game.passiveRate}
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
          energy={game.energy}
          unlockedPlanetIds={game.unlockedPlanetIds}
          selectedPlanetId={game.selectedPlanetId}
          onUnlockPlanet={game.unlockPlanet}
          onChoosePlanet={(id) => {
            game.selectPlanet(id);
            onSetTab("game");
          }}
        />
      );
      break;
    case "achievements":
      tabContent = (
        <AchievementsScreen
          achievements={game.achievements}
        />
      );
      break;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>{tabContent}</View>

      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable key={t.id} onPress={() => onSetTab(t.id)} style={styles.tabBtn}>
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{t.label}</Text>
              {active ? <View style={styles.tabActiveLine} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
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
    return () => {
      mounted = false;
    };
  }, []);

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
    height: 78,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,212,255,0.15)",
    backgroundColor: "rgba(0,10,30,0.95)",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 9,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "800",
  },
  tabLabelActive: {
    color: "#00d4ff",
  },
  tabActiveLine: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    height: 2,
    backgroundColor: "#00d4ff",
  },
});
