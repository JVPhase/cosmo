import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { computeUpgradeCost, getUpgrades, type UpgradeId } from "../game/UPGRADES";
import { formatNum } from "../game/formatNum";
import type { UpgradesState } from "../game/types";
import { t } from "../game/i18n";

export type UpgradesScreenProps = {
  energy: number;
  upgrades: UpgradesState;
  onBuyUpgrade: (id: UpgradeId, count: number) => void;
};

type Tab = 'click' | 'passive';
const MULT_OPTIONS: Array<{ label: string; value: number }> = [
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '5x', value: 5 },
  { label: 'max', value: Infinity },
];

export function UpgradesScreen({ energy, upgrades, onBuyUpgrade }: UpgradesScreenProps) {
  const [tab, setTab] = useState<Tab>('click');
  const [mult, setMult] = useState<number>(1);

  const clickUpgrades = getUpgrades().filter((u) => u.clickBonus > 0);
  const passiveUpgrades = getUpgrades().filter((u) => u.passiveBonus > 0);

  const visibleUpgrades = (list: typeof clickUpgrades) => {
    const firstUnboughtIdx = list.findIndex((u) => (upgrades[u.id as UpgradeId] ?? 0) === 0);
    return firstUnboughtIdx === -1 ? list : list.slice(0, firstUnboughtIdx + 1);
  };

  const data = visibleUpgrades(tab === 'click' ? clickUpgrades : passiveUpgrades);

  return (
    <View style={styles.screen}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'click' && styles.tabActive]}
          onPress={() => setTab('click')}
        >
          <Text style={[styles.tabText, tab === 'click' && styles.tabTextActive]}>
            {t('ui.upgrades.tab_active')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'passive' && styles.tabActive]}
          onPress={() => setTab('passive')}
        >
          <Text style={[styles.tabText, tab === 'passive' && styles.tabTextActive]}>
            {t('ui.upgrades.tab_passive')}
          </Text>
        </Pressable>
      </View>

      {/* Multiplier selector */}
      <View style={styles.multRow}>
        {MULT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.label}
            style={[styles.multBtn, mult === opt.value && styles.multBtnActive]}
            onPress={() => setMult(opt.value)}
          >
            <Text style={[styles.multText, mult === opt.value && styles.multTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(upg) => String(upg.id)}
        contentContainerStyle={styles.content}
        ListFooterComponent={<Text style={styles.energyFooter}>{t('ui.upgrades.energy_footer', { energy: formatNum(energy) })}</Text>}
        renderItem={({ item: upg }) => {
          const level = upgrades[upg.id as UpgradeId] ?? 0;
          const baseBonus = upg.clickBonus > 0 ? upg.clickBonus : upg.passiveBonus;
          const unit = upg.clickBonus > 0 ? t('ui.upgrades.unit_click') : t('ui.upgrades.unit_sec');
          const currentScale = level > 0 ? Math.pow(1.6, level) : 0;
          const currentOutput = baseBonus * currentScale;

          // For max: count affordable levels; for 1x/2x/5x: compute full cost regardless of balance
          let displayCost = 0;
          let affordableCount = 0;
          if (mult === Infinity) {
            for (let i = 0; i < 9999; i++) {
              const c = computeUpgradeCost(upg, level + i);
              if (displayCost + c > energy) break;
              displayCost += c;
              affordableCount += 1;
            }
          } else {
            for (let i = 0; i < mult; i++) {
              displayCost += computeUpgradeCost(upg, level + i);
            }
            affordableCount = mult;
          }

          const canBuy = mult === Infinity
            ? energy >= computeUpgradeCost(upg, level)
            : energy >= displayCost;
          const effectiveCount = mult === Infinity ? affordableCount : mult;
          const nextLevel = level + effectiveCount;
          const nextScale = Math.pow(1.6, nextLevel);
          const nextOutput = baseBonus * nextScale;

          return (
            <Pressable
              onPress={() => onBuyUpgrade(upg.id as UpgradeId, mult)}
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
                {level > 0 ? (
                  <Text style={styles.bonus}>
                    {t('ui.upgrades.output_change', { current: formatNum(currentOutput), unit, next: formatNum(nextOutput) })}
                  </Text>
                ) : (
                  <Text style={styles.bonus}>
                    {t('ui.upgrades.output_first_buy', { next: formatNum(nextOutput), unit })}
                  </Text>
                )}
                {level > 0 && <Text style={styles.level}>{t('ui.upgrades.level', { level: String(level) })}</Text>}
              </View>

              <View style={styles.costBox}>
                <Text style={[styles.cost, { color: canBuy ? "#ffd700" : "rgba(255,200,0,0.5)" }]}>
                  {formatNum(displayCost || computeUpgradeCost(upg, level))}
                </Text>
                {mult === Infinity && affordableCount > 0 && (
                  <Text style={styles.costCount}>×{affordableCount}</Text>
                )}
                <Text style={styles.costUnit}>{t('ui.upgrades.cost_unit')}</Text>
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
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.15)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabActive: {
    backgroundColor: 'rgba(0,212,255,0.12)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.35)',
  },
  tabTextActive: {
    color: '#00d4ff',
  },
  multRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    gap: 6,
  },
  multBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.15)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  multBtnActive: {
    backgroundColor: 'rgba(255,200,0,0.12)',
    borderColor: 'rgba(255,200,0,0.5)',
  },
  multText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,200,0,0.35)',
    letterSpacing: 0.5,
  },
  multTextActive: {
    color: '#ffd700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
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
  costCount: {
    fontSize: 9,
    color: "rgba(255,200,0,0.6)",
    fontWeight: "700",
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
