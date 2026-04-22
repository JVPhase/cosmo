import React from 'react';
import { logEvent } from '../game/analytics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../game/i18n';

export type AchievementToastData = {
  id: number;
  nameKey: string;
  icon: string;
  loreKey: string;
};

export type AchievementToastProps = {
  toast: AchievementToastData | null;
  onClose: () => void;
  onOpenAchievements: () => void;
};

export function AchievementToast({ toast, onClose, onOpenAchievements }: AchievementToastProps) {
  if (!toast) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.achievementToast, pressed && { opacity: 0.85 }]}
      onPress={() => {
        logEvent('toast_action', { toast: 'achievement', action: 'open_achievements', id: toast.id });
        onClose();
        onOpenAchievements();
      }}
    >
      <Text style={styles.achievementIcon}>{toast.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.achievementLabel}>{t('ui.achievement_unlocked')}</Text>
        <Text style={styles.achievementName}>{t('config.' + toast.nameKey)}</Text>
        <Text style={styles.achievementLore}>{t('config.' + toast.loreKey)}</Text>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onClose();
        }}
        style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
      >
        <Text style={styles.achievementClose}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  achievementToast: {
    position: 'absolute',
    top: 86,
    left: 10,
    right: 10,
    zIndex: 30,
    backgroundColor: 'rgba(40,25,0,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,0.7)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10 as any,
    alignItems: 'center',
  },
  achievementIcon: { fontSize: 26 },
  achievementLabel: {
    fontSize: 8,
    color: 'rgba(255,180,0,0.7)',
    letterSpacing: 2,
    fontWeight: '900',
    marginBottom: 2,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffd700',
    marginTop: 2,
  },
  achievementLore: {
    fontSize: 10,
    color: 'rgba(255,200,100,0.65)',
    marginTop: 2,
    lineHeight: 16,
    fontWeight: '700',
  },
  achievementClose: { fontSize: 14, color: 'rgba(0,212,255,0.35)', padding: 6 },
});
