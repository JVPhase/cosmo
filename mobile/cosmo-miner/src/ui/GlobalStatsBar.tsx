import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNum } from '../game/formatNum';
import { getMetals, type MetalId } from '../game/METALS';
import type { MetalsState } from '../game/types';

export type GlobalStatsBarProps = {
  energy: number;
  metals: MetalsState;
  discoveredMetals: MetalId[];
  onOpenMetalInfo: (metalId: MetalId) => void;
};

export function GlobalStatsBar({
  energy,
  metals,
  discoveredMetals,
  onOpenMetalInfo,
}: GlobalStatsBarProps) {
  const METALS = getMetals();
  const discovered = METALS.filter((m) => discoveredMetals.includes(m.id));

  return (
    <View style={styles.bar}>
      <Text style={styles.energy}>
        ⚡ <Text style={styles.energyValue}>{formatNum(energy)}</Text>
      </Text>
      {discovered.length > 0 && <View style={styles.separator} />}
      {discovered.map((m) => (
        <Pressable
          key={m.id}
          style={styles.metalItem}
          onPress={() => onOpenMetalInfo(m.id)}
        >
          <Image
            source={m.image}
            style={styles.metalIcon}
            resizeMode="contain"
          />
          <Text style={styles.metalCount}>{formatNum(metals[m.id] ?? 0)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.12)',
    gap: 10,
  },
  energy: {
    fontSize: 12,
    color: 'rgba(255,200,0,0.6)',
    fontWeight: '800',
  },
  energyValue: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: '900',
  },
  separator: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  metalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metalIcon: { width: 18, height: 18 },
  metalCount: {
    fontSize: 10,
    color: 'rgba(255,220,100,0.75)',
    fontWeight: '700',
  },
});
