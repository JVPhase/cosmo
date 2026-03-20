import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { computeUpgradeCost, getUpgradeById, UPGRADES, type UpgradeId } from "../game/UPGRADES";
import { formatNum } from "../game/formatNum";
import type { UpgradesState } from "../game/types";

export type UpgradesScreenProps = {
  energy: number;
  upgrades: UpgradesState;
  onBuyUpgrade: (id: UpgradeId) => void;
};

export function UpgradesScreen({ energy, upgrades, onBuyUpgrade }: UpgradesScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>◈ АПГРЕЙДЫ ◈</Text>

        {UPGRADES.map((upg) => {
          const level = upgrades[upg.id] ?? 0;
          const cost = computeUpgradeCost(upg, level);
          const canBuy = energy >= cost;

          return (
            <Pressable
              key={upg.id}
              onPress={() => onBuyUpgrade(upg.id)}
              disabled={!canBuy}
              style={({ pressed }) => [
                styles.card,
                canBuy ? styles.cardCanBuy : styles.cardLocked,
                pressed && canBuy ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={styles.icon}>{upg.icon}</Text>

              <View style={styles.mainText}>
                <Text style={[styles.name, { color: canBuy ? "#00d4ff" : "rgba(255,255,255,0.5)" }]}>{upg.name}</Text>
                <Text style={styles.desc}>{upg.desc}</Text>
                {level > 0 && <Text style={styles.level}>Ур. {level}</Text>}
              </View>

              <View style={styles.costBox}>
                <Text style={[styles.cost, { color: canBuy ? "#ffd700" : "rgba(255,200,0,0.3)" }]}>{formatNum(cost)}</Text>
                <Text style={styles.costUnit}>⚡ энергий</Text>
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
  screen: {
    flex: 1,
    backgroundColor: "#050918",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  title: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 3,
    fontWeight: "800",
    marginBottom: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
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
  icon: {
    fontSize: 28,
  },
  mainText: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  desc: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },
  level: {
    marginTop: 4,
    fontSize: 9,
    color: "rgba(120,255,120,0.65)",
    fontWeight: "700",
  },
  costBox: {
    alignItems: "flex-end",
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

