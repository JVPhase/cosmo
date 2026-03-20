import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { AnimatedMineEffects } from "../ui/AnimatedMineEffects";
import { type DerivedStats } from "../game/computeStats";
import { formatNum } from "../game/formatNum";

type Point = { x: number; y: number };

export type GameScreenProps = {
  energy: number;
  totalEarned: number;
  clickPower: number;
  passiveRate: number; // per second
  onMine: () => void;
};

export function GameScreen({ energy, totalEarned, clickPower, passiveRate, onMine }: GameScreenProps) {
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>⚡ ЭНЕРГИЙ</Text>
            <Text style={styles.energy}>{formatNum(energy)}</Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.headerLabelRight}>ВСЕГО ДОБЫТО</Text>
            <Text style={styles.total}>{formatNum(totalEarned)}</Text>
            {passiveRate > 0 && <Text style={styles.passive}>{formatNum(passiveRate)}/сек</Text>}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statText}>+{formatNum(clickPower)}/клик</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxBlue]}>
            <Text style={styles.statText}>{formatNum(passiveRate)}/сек пассивно</Text>
          </View>
        </View>
      </View>

      {/* Main */}
      <View style={styles.main}>
        <AnimatedMineEffects trigger={trigger} origin={origin} clickPower={clickPower} style={styles.asteroidWrap}>
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
              styles.asteroid,
              pressed ? { opacity: 0.92 } : null,
            ]}
          >
            <LinearGradient
              colors={["#4a3f2f", "#2a2018", "#1a1008"]}
              style={StyleSheet.absoluteFill}
            />
            {/* Surface / veins */}
            <View style={[styles.vein, { top: "26%", left: "30%", transform: [{ rotate: "-20deg" }] }]} />
            <View style={[styles.vein2, { top: "48%", left: "46%", transform: [{ rotate: "15deg" }] }]} />

            <View style={styles.asteroidCenter}>
              <Text style={styles.asteroidIcon}>⛏️</Text>
              <Text style={styles.clickHint}>КЛИКНИ</Text>
            </View>
          </Pressable>
        </AnimatedMineEffects>

        <Text style={styles.hint}>▲ ДОБЫВАЙ ЭНЕРГИЮ ▲</Text>
      </View>
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
    fontSize: 10,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 3,
    fontWeight: "700",
  },
  headerLabelRight: {
    fontSize: 10,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 3,
    fontWeight: "700",
    textAlign: "right",
  },
  energy: {
    fontSize: 34,
    fontWeight: "900",
    color: "#ffd700",
    marginTop: 2,
    textShadowColor: "rgba(255,200,0,0.55)",
    textShadowRadius: 18,
  },
  total: {
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(0,212,255,0.85)",
  },
  passive: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(120,255,120,0.75)",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,200,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,200,0,0.16)",
    alignItems: "center",
  },
  statBoxBlue: {
    backgroundColor: "rgba(0,212,255,0.08)",
    borderColor: "rgba(0,212,255,0.16)",
  },
  statText: {
    fontSize: 10,
    color: "rgba(255,200,0,0.75)",
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
});

