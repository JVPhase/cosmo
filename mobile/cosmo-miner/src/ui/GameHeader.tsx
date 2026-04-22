import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { formatNum } from '../game/formatNum';
import { t } from '../game/i18n';
import { getMetals, type MetalId } from '../game/METALS';
import type { PlanetDefinition } from '../game/PLANETS';
import { getPlayerTitle, xpAtLevelStart, xpForNextLevel } from '../game/PLAYER';
import type { MetalsState } from '../game/types';

export type GameHeaderProps = {
  energy: number;
  totalEarned: number;
  clickPower: number;
  passiveRate: number;
  metals: MetalsState;
  discoveredMetals: MetalId[];
  planet: PlanetDefinition;
  playerLevel: number;
  playerXP: number;
  onOpenClickPowerInfo: () => void;
  onOpenPassiveRateInfo: () => void;
  onOpenMetalInfo: (metalId: MetalId) => void;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function GameHeader({
  energy,
  totalEarned,
  clickPower,
  passiveRate,
  metals,
  discoveredMetals,
  planet,
  playerLevel,
  playerXP,
  onOpenClickPowerInfo,
  onOpenPassiveRateInfo,
  onOpenMetalInfo,
  onLayout,
}: GameHeaderProps) {
  const METALS = getMetals();
  const xpStart = xpAtLevelStart(playerLevel);
  const xpNext = xpForNextLevel(playerLevel);
  const xpPercent =
    xpNext !== null
      ? Math.min(1, (playerXP - xpStart) / (xpNext - xpStart))
      : 1;

  return (
    <View style={styles.header} onLayout={onLayout}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerLabel}>{t('ui.game_header.org_label')}</Text>
          <Text style={[styles.planetLine, { color: planet.color }]}>
            {planet.icon} {planet.name}
          </Text>
          <Text style={styles.energy}>
            {formatNum(energy)} <Text style={styles.energyUnit}>⚡</Text>
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerLabelRight}>{t('ui.game_header.total_earned')}</Text>
          <Text style={styles.total}>{formatNum(totalEarned)}</Text>
          <Text style={styles.passive}>{formatNum(passiveRate)}{t('ui.game_header.per_sec')}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Pressable
          onPress={onOpenClickPowerInfo}
          style={[styles.statBox, { backgroundColor: 'rgba(255,200,0,0.06)', borderColor: 'rgba(255,200,0,0.13)' }]}
        >
          <Text style={[styles.statText, { color: 'rgba(255,200,0,0.75)' }]}>
            {`+${clickPower < 1000 ? clickPower.toFixed(2) : formatNum(clickPower)}${t('ui.game_header.per_click')}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenPassiveRateInfo}
          style={[styles.statBox, { backgroundColor: 'rgba(0,212,255,0.06)', borderColor: 'rgba(0,212,255,0.13)' }]}
        >
          <Text style={[styles.statText, { color: 'rgba(0,212,255,0.75)' }]}>
            {`${formatNum(passiveRate)}${t('ui.game_header.per_sec')}`}
          </Text>
        </Pressable>
      </View>

      <View style={styles.metalsRow}>
        {METALS.filter((m) => discoveredMetals.includes(m.id)).map((m) => (
          <Pressable key={m.id} style={styles.metalItem} onPress={() => onOpenMetalInfo(m.id)}>
            <Image source={m.image} style={styles.metalIcon} resizeMode="contain" />
            <Text style={styles.metalCount}>{formatNum(metals[m.id] ?? 0)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.xpRow}>
        <Text style={styles.xpLevel}>{t('ui.game_header.level_prefix')}{playerLevel}</Text>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${xpPercent * 100}%` }]} />
        </View>
        <Text style={styles.xpTitle}>{getPlayerTitle(playerLevel)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,20,60,0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.12)',
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLabel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.35)',
    letterSpacing: 3,
    marginBottom: 2,
    fontWeight: '800',
  },
  planetLine: {
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.85,
    marginBottom: 2,
    fontWeight: '800',
  },
  headerLabelRight: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    fontWeight: '800',
  },
  energy: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffd700',
    letterSpacing: 1,
    textShadowColor: 'rgba(255,200,0,0.45)',
    textShadowRadius: 20,
    lineHeight: 34,
  },
  energyUnit: { fontSize: 12, opacity: 0.55, fontWeight: '800' },
  total: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(0,212,255,0.85)',
  },
  passive: {
    marginTop: 1,
    fontSize: 9,
    color: 'rgba(120,255,120,0.65)',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 7,
  },
  statBox: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  statText: {
    fontSize: 8,
    fontWeight: '800',
  },
  metalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
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
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  xpLevel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.6)',
    fontWeight: '900',
    letterSpacing: 0.5,
    minWidth: 30,
  },
  xpBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(0,212,255,0.6)',
  },
  xpTitle: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.35)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
