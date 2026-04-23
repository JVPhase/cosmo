import React from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { t } from '../game/i18n';
import { getPlayerTitle, xpAtLevelStart, xpForNextLevel } from '../game/PLAYER';

export type GameHeaderProps = {
  playerLevel: number;
  playerXP: number;
  onLayout: (e: LayoutChangeEvent) => void;
};

export function GameHeader({ playerLevel, playerXP, onLayout }: GameHeaderProps) {
  const xpStart = xpAtLevelStart(playerLevel);
  const xpNext = xpForNextLevel(playerLevel);
  const xpPercent =
    xpNext !== null
      ? Math.min(1, (playerXP - xpStart) / (xpNext - xpStart))
      : 1;

  return (
    <View style={styles.header} onLayout={onLayout}>
      <Text style={styles.level}>{t('ui.game_header.level_prefix')}{playerLevel}</Text>
      <View style={styles.xpBarBg}>
        <View style={[styles.xpBarFill, { width: `${xpPercent * 100}%` }]} />
      </View>
      <Text style={styles.title}>{getPlayerTitle(playerLevel)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
    zIndex: 2,
  },
  level: {
    fontSize: 9,
    color: 'rgba(0,212,255,0.85)',
    fontWeight: '900',
    letterSpacing: 0.5,
    minWidth: 34,
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
  title: {
    fontSize: 9,
    color: 'rgba(0,212,255,0.4)',
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'right',
  },
});
