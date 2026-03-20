import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ACHIEVEMENTS, type AchievementId } from "../game/ACHIEVEMENTS";
import { computeUpgradesBought } from "../game/computeStats";
import { formatNum } from "../game/formatNum";
import type { UpgradesState } from "../game/types";
import type { GameState } from "../game/types";

export type AchievementsScreenProps = Pick<
  GameState,
  "energy" | "totalEarned" | "upgrades" | "achievements"
>;

function getAnyUpgradeMaxLevel(upgrades: UpgradesState): number {
  let max = 0;
  for (const upgId in upgrades) {
    const lvl = upgrades[upgId as unknown as keyof UpgradesState] ?? 0;
    if (lvl > max) max = lvl;
  }
  return max;
}

export function AchievementsScreen({ energy, totalEarned, upgrades, achievements }: AchievementsScreenProps) {
  const unlockedSet = useMemo(() => new Set(achievements.unlockedIds as AchievementId[]), [achievements.unlockedIds]);
  const upgradesBought = useMemo(() => computeUpgradesBought(upgrades), [upgrades]);
  const maxUpgradeLevel = useMemo(() => getAnyUpgradeMaxLevel(upgrades), [upgrades]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏆 ДОСТИЖЕНИЯ</Text>

        {ACHIEVEMENTS.map((def) => {
          const unlocked = unlockedSet.has(def.id);

          const current =
            def.target.type === "energyAtLeast"
              ? energy
              : def.target.type === "totalEarnedAtLeast"
              ? totalEarned
              : def.target.type === "anyUpgradeLevelAtLeast"
              ? maxUpgradeLevel
              : def.target.type === "upgradesBoughtAtLeast"
              ? upgradesBought
              : 0;

          const target = def.target.value;
          const progress = target > 0 ? Math.min(1, current / target) : 0;

          return (
            <View key={def.id} style={[styles.card, unlocked ? styles.cardUnlocked : null]}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{def.title}</Text>
                <Text style={[styles.status, unlocked ? styles.statusUnlocked : styles.statusLocked]}>
                  {unlocked ? "ОТКРЫТО" : `${Math.round(progress * 100)}%`}
                </Text>
              </View>
              <Text style={styles.desc}>{def.description}</Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>

              <Text style={styles.reward}>Награда: +{formatNum(def.rewardEnergy)} ⚡</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050918" },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 },
  title: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 14,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 12,
  },
  cardUnlocked: {
    borderColor: "rgba(120,255,120,0.35)",
    backgroundColor: "rgba(120,255,120,0.08)",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 13, fontWeight: "900", color: "#00d4ff" },
  status: { fontSize: 10, fontWeight: "900" },
  statusUnlocked: { color: "rgba(120,255,120,0.85)" },
  statusLocked: { color: "rgba(255,255,255,0.5)" },
  desc: {
    marginTop: 6,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 8,
    backgroundColor: "rgba(0,212,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 8,
    backgroundColor: "rgba(0,212,255,0.65)",
  },
  reward: {
    marginTop: 10,
    fontSize: 10,
    color: "rgba(255,200,0,0.55)",
    fontWeight: "700",
  },
});

