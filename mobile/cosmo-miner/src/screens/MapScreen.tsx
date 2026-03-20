import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PLANETS, type PlanetId } from "../game/PLANETS";
import { formatNum } from "../game/formatNum";

export type MapScreenProps = {
  energy: number;
  unlockedPlanetIds: PlanetId[];
  onUnlockPlanet: (id: PlanetId) => void;
};

export function MapScreen({ energy, unlockedPlanetIds, onUnlockPlanet }: MapScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🗺️ ЭКСПЕДИЦИИ</Text>

        {PLANETS.filter((p) => p.unlockCost > 0).map((p) => {
          const unlocked = unlockedPlanetIds.includes(p.id);
          const canUnlock = !unlocked && energy >= p.unlockCost;

          return (
            <Pressable
              key={p.id}
              onPress={() => onUnlockPlanet(p.id)}
              disabled={!canUnlock}
              style={({ pressed }) => [
                styles.card,
                unlocked ? styles.cardUnlocked : canUnlock ? styles.cardCanBuy : styles.cardLocked,
                pressed && canUnlock ? { opacity: 0.92 } : null,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.meta}>
                  Множитель клика: x{p.clickMultiplier.toFixed(2)} | пассив: x{p.passiveMultiplier.toFixed(2)}
                </Text>
              </View>

              <View style={styles.right}>
                {unlocked ? (
                  <Text style={styles.unlocked}>РАЗБЛОКИРОВАНО</Text>
                ) : (
                  <>
                    <Text style={[styles.cost, { color: canUnlock ? "#ffd700" : "rgba(255,200,0,0.3)" }]}>
                      {formatNum(p.unlockCost)}
                    </Text>
                    <Text style={styles.costUnit}>⚡ энергий</Text>
                  </>
                )}
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.energyFooter}>Энергий: {formatNum(energy)}</Text>
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
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardUnlocked: {
    backgroundColor: "rgba(120,255,120,0.08)",
    borderColor: "rgba(120,255,120,0.35)",
  },
  cardCanBuy: {
    backgroundColor: "rgba(0,212,255,0.08)",
    borderColor: "rgba(0,212,255,0.3)",
  },
  cardLocked: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.07)",
    opacity: 0.95,
  },
  name: {
    fontSize: 13,
    fontWeight: "900",
    color: "#00d4ff",
  },
  meta: {
    marginTop: 4,
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  right: { alignItems: "flex-end" },
  unlocked: {
    color: "rgba(120,255,120,0.7)",
    fontWeight: "900",
    fontSize: 11,
  },
  cost: {
    fontSize: 14,
    fontWeight: "900",
  },
  costUnit: {
    marginTop: 2,
    fontSize: 9,
    color: "rgba(255,200,0,0.4)",
    fontWeight: "700",
  },
  energyFooter: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(0,212,255,0.5)",
    fontWeight: "700",
  },
});

