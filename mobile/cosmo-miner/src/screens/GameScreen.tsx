import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { AnimatedMineEffects } from "../ui/AnimatedMineEffects";
import { formatNum } from "../game/formatNum";
import type { PlanetDefinition } from "../game/PLANETS";

type Point = { x: number; y: number };

export type GameScreenProps = {
  energy: number;
  totalEarned: number;
  clickPower: number;
  passiveRate: number; // per second
  onMine: () => void;
  planet: PlanetDefinition;
  clerkMessage: string | null;
  onCloseClerk: () => void;
  achievementToast: { id: number; name: string; icon: string; lore: string } | null;
  onCloseAchievementToast: () => void;
};

export function GameScreen({
  energy,
  totalEarned,
  clickPower,
  passiveRate,
  onMine,
  planet,
  clerkMessage,
  onCloseClerk,
  achievementToast,
  onCloseAchievementToast,
}: GameScreenProps) {
  const [trigger, setTrigger] = useState(0);
  const [origin, setOrigin] = useState<Point | undefined>(undefined);

  const stars = useMemo(() => {
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 0.6,
      opacity: Math.random() * 0.6 + 0.25,
    }));
  }, []);

  const handlePress = (e: GestureResponderEvent) => {
    const nativeEvent = e.nativeEvent as unknown as { locationX?: number; locationY?: number };
    const x = nativeEvent.locationX ?? 0;
    const y = nativeEvent.locationY ?? 0;
    setOrigin({ x, y });
    setTrigger((t) => t + 1);
    onMine();
  };

  return (
    <LinearGradient colors={["#050918", "#0a1628", "#061020"]} style={styles.screen}>
      {/* Stars */}
      {stars.map((s) => (
        <View
          key={s.id}
          style={[
            styles.star,
            {
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
            },
          ]}
        />
      ))}

      {/* Achievement toast */}
      {achievementToast ? (
        <View style={styles.achievementToast}>
          <Text style={styles.achievementIcon}>{achievementToast.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.achievementLabel}>🏆 ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО</Text>
            <Text style={styles.achievementName}>{achievementToast.name}</Text>
            <Text style={styles.achievementLore}>{achievementToast.lore}</Text>
          </View>
          <Pressable onPress={onCloseAchievementToast} style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}>
            <Text style={styles.achievementClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>◈ МГМР · СОТ. №4,829,441 ◈</Text>
            <Text style={[styles.planetLine, { color: planet.color }]}>
              {planet.icon} {planet.name} · {planet.resource}
            </Text>
            <Text style={styles.energy}>
              {formatNum(energy)} <Text style={styles.energyUnit}>⚡</Text>
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.headerLabelRight}>ВСЕГО ДОБЫТО</Text>
            <Text style={styles.total}>{formatNum(totalEarned)}</Text>
            <Text style={styles.passive}>{formatNum(passiveRate)}/сек</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "rgba(255,200,0,0.06)", borderColor: "rgba(255,200,0,0.13)" }]}>
            <Text style={[styles.statText, { color: "rgba(255,200,0,0.75)" }]}>{`+${formatNum(clickPower)}/клик`}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "rgba(0,212,255,0.06)", borderColor: "rgba(0,212,255,0.13)" }]}>
            <Text style={[styles.statText, { color: "rgba(0,212,255,0.75)" }]}>{`${formatNum(passiveRate)}/сек`}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }]}>
            <Text style={[styles.statText, { color: planet.color }]}>×{planet.bonus} бонус</Text>
          </View>
        </View>
      </View>

      {/* Main */}
      <View style={styles.main}>
        <AnimatedMineEffects
          trigger={trigger}
          origin={origin}
          clickPower={clickPower}
          mineColor={planet.color}
          style={styles.asteroidWrap}
        >
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
              styles.asteroid,
              pressed ? { opacity: 0.92 } : null,
            ]}
          >
            <View style={StyleSheet.absoluteFill as any}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: planet.color, opacity: 0.16 }]} />
              <LinearGradient colors={[planet.color + "66", "#18100a", "#0a0804"]} style={StyleSheet.absoluteFill} />
            </View>
            {/* Surface / veins */}
            <View style={[styles.vein, { top: "26%", left: "30%", transform: [{ rotate: "-20deg" }] }]} />
            <View style={[styles.vein2, { top: "48%", left: "46%", transform: [{ rotate: "15deg" }] }]} />

            <View style={styles.asteroidCenter}>
              <Text style={styles.asteroidIcon}>⛏️</Text>
              <Text style={styles.clickHint}>КЛИКНИ</Text>
            </View>
          </Pressable>
        </AnimatedMineEffects>

        <Text style={styles.hint}>◈ ДОБЫВАЙ {planet.resource} ◈</Text>
      </View>

      {/* Clerk bubble */}
      {clerkMessage ? (
        <View style={styles.clerkBubble}>
          <Text style={styles.clerkIcon}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.clerkHeader}>КЛЕРК-7 · ИИ-АССИСТЕНТ МГМР</Text>
            <Text style={styles.clerkText}>{clerkMessage}</Text>
          </View>
          <Pressable onPress={onCloseClerk} style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}>
            <Text style={styles.clerkClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    zIndex: 0,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: "rgba(0,20,60,0.55)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,212,255,0.12)",
    zIndex: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLabel: {
    fontSize: 8,
    color: "rgba(0,212,255,0.35)",
    letterSpacing: 3,
    marginBottom: 2,
    fontWeight: "800",
  },
  planetLine: {
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.85,
    marginBottom: 2,
    fontWeight: "800",
  },
  headerLabelRight: {
    fontSize: 8,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 1,
    fontWeight: "800",
  },
  energy: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffd700",
    letterSpacing: 1,
    textShadowColor: "rgba(255,200,0,0.45)",
    textShadowRadius: 20,
    lineHeight: 34,
  },
  energyUnit: { fontSize: 12, opacity: 0.55, fontWeight: "800" },
  total: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(0,212,255,0.85)",
  },
  passive: {
    marginTop: 1,
    fontSize: 9,
    color: "rgba(120,255,120,0.65)",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 7,
  },
  statBox: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  statText: {
    fontSize: 8,
    fontWeight: "800",
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 28,
    zIndex: 2,
  },
  asteroidWrap: {
    width: 170,
    height: 170,
  },
  asteroid: {
    flex: 1,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,212,255,0.25)",
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  asteroidCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  asteroidIcon: {
    fontSize: 36,
    textShadowColor: "rgba(255,200,0,0.5)",
    textShadowRadius: 12,
  },
  clickHint: {
    marginTop: 4,
    fontSize: 9,
    color: "rgba(255,200,0,0.7)",
    fontWeight: "800",
    letterSpacing: 3,
  },
  vein: {
    position: "absolute",
    width: 44,
    height: 3,
    borderRadius: 3,
    backgroundColor: "rgba(255,180,0,0.42)",
    shadowColor: "rgba(255,180,0,0.6)",
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  vein2: {
    position: "absolute",
    width: 26,
    height: 2,
    borderRadius: 3,
    backgroundColor: "rgba(0,212,255,0.38)",
    shadowColor: "rgba(0,212,255,0.65)",
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  hint: {
    position: "absolute",
    bottom: 20,
    fontSize: 10,
    color: "rgba(0,212,255,0.28)",
    letterSpacing: 3,
    fontWeight: "700",
  },
  clerkBubble: {
    position: "absolute",
    bottom: 76,
    left: 10,
    right: 10,
    zIndex: 20,
    backgroundColor: "rgba(4,16,45,0.97)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.35)",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10 as any,
    alignItems: "flex-start",
  },
  clerkIcon: { fontSize: 24, flexShrink: 0 },
  clerkHeader: { fontSize: 8, color: "rgba(0,212,255,0.55)", letterSpacing: 2, marginBottom: 4, fontWeight: "800" },
  clerkText: { fontSize: 11, color: "rgba(200,230,255,0.9)", lineHeight: 18 },
  clerkClose: { fontSize: 14, color: "rgba(0,212,255,0.35)" },

  achievementToast: {
    position: "absolute",
    top: 86,
    left: 10,
    right: 10,
    zIndex: 30,
    backgroundColor: "rgba(255,180,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,180,0,0.45)",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10 as any,
    alignItems: "center",
  },
  achievementIcon: { fontSize: 26 },
  achievementLabel: { fontSize: 8, color: "rgba(255,180,0,0.7)", letterSpacing: 2, fontWeight: "900", marginBottom: 2 },
  achievementName: { fontSize: 12, fontWeight: "800", color: "#ffd700", marginTop: 2 },
  achievementLore: { fontSize: 10, color: "rgba(255,200,100,0.65)", marginTop: 2, lineHeight: 16, fontWeight: "700" },
  achievementClose: { fontSize: 14, color: "rgba(0,212,255,0.35)", padding: 6 },
});

