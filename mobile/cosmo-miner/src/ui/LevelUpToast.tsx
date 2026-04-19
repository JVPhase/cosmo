import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../game/i18n';
import { getPlayerTitle } from '../game/PLAYER';

export type LevelUpToastProps = {
  levelUpToast: number | null;
  onClose: () => void;
};

export function LevelUpToast({ levelUpToast, onClose }: LevelUpToastProps) {
  if (!levelUpToast) return null;

  return (
    <View style={styles.levelUpToast}>
      <Text style={styles.levelUpIcon}>⬆️</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.levelUpLabel}>{t('ui.level_up.label')}</Text>
        <Text style={styles.levelUpLevel}>
          {t('ui.level_up.level_line', { level: String(levelUpToast), title: getPlayerTitle(levelUpToast) })}
        </Text>
      </View>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
      >
        <Text style={styles.levelUpClose}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  levelUpToast: {
    position: 'absolute',
    top: 86,
    left: 10,
    right: 10,
    zIndex: 30,
    backgroundColor: 'rgba(0,50,80,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.5)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10 as any,
    alignItems: 'center',
  },
  levelUpIcon: { fontSize: 26 },
  levelUpLabel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.7)',
    letterSpacing: 2,
    fontWeight: '900',
    marginBottom: 2,
  },
  levelUpLevel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00d4ff',
    marginTop: 2,
  },
  levelUpClose: { fontSize: 14, color: 'rgba(0,212,255,0.35)', padding: 6 },
});
