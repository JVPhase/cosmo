import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getMetals, type MetalId } from '../../game/METALS';
import type { MetalsState } from '../../game/types';
import { t } from '../../game/i18n';

export function MetalCost({
  cost,
  color,
}: {
  cost: Partial<MetalsState>;
  color: string;
}) {
  const METALS = getMetals();
  return (
    <View style={styles.metalCostRow}>
      {Object.entries(cost).map(([k, v]) => {
        const metal = METALS.find((m) => m.id === k);
        if (!metal) return null;
        return (
          <View key={k} style={styles.metalCostItem}>
            <Image
              source={metal.image}
              style={styles.metalCostIcon}
              resizeMode="contain"
            />
            <Text style={[styles.metalCostText, { color }]}>{v}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function canAffordCost(
  metals: MetalsState,
  cost: Partial<MetalsState>,
): boolean {
  return Object.entries(cost).every(
    ([k, v]) => (metals[k as keyof MetalsState] ?? 0) >= v,
  );
}

export function costMetalsDiscovered(
  discoveredMetals: MetalId[],
  cost: Partial<MetalsState>,
): boolean {
  return Object.keys(cost).every((k) =>
    discoveredMetals.includes(k as MetalId),
  );
}

export function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return t('ui.duration.hm', { h: String(h), m: String(m) });
  if (m > 0) return t('ui.duration.ms', { m: String(m), s: String(s) });
  return t('ui.duration.s', { s: String(s) });
}

const styles = StyleSheet.create({
  metalCostRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metalCostItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metalCostIcon: { width: 14, height: 14 },
  metalCostText: { fontSize: 10, fontWeight: '800' },
});

export const sharedStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 10,
    color: 'rgba(0,212,255,0.4)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  btnYellow: {
    borderColor: 'rgba(255,200,0,0.4)',
    backgroundColor: 'rgba(255,200,0,0.07)',
  },
  btnOrange: {
    borderColor: 'rgba(255,150,0,0.4)',
    backgroundColor: 'rgba(255,150,0,0.07)',
  },
  btnGreen: {
    borderColor: 'rgba(0,255,136,0.35)',
    backgroundColor: 'rgba(0,255,136,0.07)',
  },
  btnDisabled: {
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'transparent',
  },
  btnGold: {
    borderColor: 'rgba(255,224,102,0.5)',
    backgroundColor: 'rgba(255,224,102,0.08)',
  },
  btnCyan: {
    borderColor: 'rgba(0,212,255,0.5)',
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
});
