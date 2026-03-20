import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AchievementsScreen } from "./src/screens/AchievementsScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { UpgradesScreen } from "./src/screens/UpgradesScreen";
import { useGame } from "./src/game/useGame";
import { loadGame, saveGame } from "./src/game/storage";
import type { GameStateInit } from "./src/game/types";

type TabId = "game" | "upgrades" | "map" | "achievements" | "settings";

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: "game", icon: "🪨", label: "ДОБЫЧА" },
  { id: "upgrades", icon: "⚡", label: "АПГРЕЙДЫ" },
  { id: "map", icon: "🗺️", label: "ЭКСПЕДИЦИИ" },
  { id: "achievements", icon: "🏆", label: "ДОСТИЖЕНИЯ" },
  { id: "settings", icon: "⚙️", label: "НАСТРОЙКИ" },
];

function GameApp({ initial, tab, onSetTab }: { initial: GameStateInit; tab: TabId; onSetTab: (t: TabId) => void }) {
  const game = useGame(initial);

  const latestSaveRef = useRef({
    energy: game.energy,
    totalEarned: game.totalEarned,
    upgrades: game.upgrades,
    unlockedPlanetIds: game.unlockedPlanetIds,
    achievements: game.achievements,
    settings: game.settings,
  });

  useEffect(() => {
    latestSaveRef.current = {
      energy: game.energy,
      totalEarned: game.totalEarned,
      upgrades: game.upgrades,
      unlockedPlanetIds: game.unlockedPlanetIds,
      achievements: game.achievements,
      settings: game.settings,
    };
  }, [game.energy, game.totalEarned, game.upgrades, game.unlockedPlanetIds, game.achievements, game.settings]);

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
        />
      );
      break;
    case "upgrades":
      tabContent = <UpgradesScreen energy={game.energy} upgrades={game.upgrades} onBuyUpgrade={game.buyUpgrade} />;
      break;
    case "map":
      tabContent = (
        <MapScreen
          energy={game.energy}
          unlockedPlanetIds={game.unlockedPlanetIds}
          onUnlockPlanet={game.unlockPlanet}
        />
      );
      break;
    case "achievements":
      tabContent = (
        <AchievementsScreen
          energy={game.energy}
          totalEarned={game.totalEarned}
          upgrades={game.upgrades}
          achievements={game.achievements}
        />
      );
      break;
    case "settings":
      tabContent = (
        <SettingsScreen
          settings={game.settings}
          onSetSoundEnabled={game.setSoundEnabled}
          onSetMusicEnabled={game.setMusicEnabled}
          onSetLanguage={game.setLanguage}
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      const loaded = await loadGame();
      if (!mounted) return;
      setInitial(loaded ?? {});
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (initial === undefined) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  return <GameApp initial={initial} tab={tab} onSetTab={setTab} />;
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
