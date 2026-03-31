import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { computeUpgradeCost, UPGRADES, type UpgradeId } from "../game/UPGRADES";
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
      <FlatList
        data={UPGRADES}
        keyExtractor={(upg) => String(upg.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<Text style={styles.title}>◈ КАТАЛОГ АПГРЕЙДОВ ◈</Text>}
        ListFooterComponent={<Text style={styles.energyFooter}>Энергий: {formatNum(energy)}</Text>}
        renderItem={({ item: upg }) => {
          const level = upgrades[upg.id] ?? 0;
          const cost = computeUpgradeCost(upg, level);
          const canBuy = energy >= cost;

          return (
            <Pressable
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
                <Text style={styles.desc}>{upg.lore}</Text>
                <Text style={styles.bonus}>
                  {upg.clickBonus > 0 ? `+${upg.clickBonus} ⚡ за клик` : `+${upg.passiveBonus} ⚡/сек`}
                  {" за уровень"}
                </Text>
                {level > 0 && <Text style={styles.level}>Ур. {level}</Text>}
              </View>

              <View style={styles.costBox}>
                <Text style={[styles.cost, { color: canBuy ? "#ffd700" : "rgba(255,200,0,0.5)" }]}>{formatNum(cost)}</Text>
                <Text style={styles.costUnit}>⚡ энергий</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050918",
    userSelect: 'none',
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
    color: "rgba(255,255,255,0.65)",
  },
  bonus: {
    marginTop: 3,
    fontSize: 9,
    color: "rgba(0,212,255,0.75)",
    fontWeight: "700",
  },
  level: {
    marginTop: 4,
    fontSize: 9,
    color: "rgba(120,255,120,0.8)",
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
    color: "rgba(255,200,0,0.6)",
    fontWeight: "700",
  },
  energyFooter: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(0,212,255,0.5)",
    fontWeight: "700",
  },
});

