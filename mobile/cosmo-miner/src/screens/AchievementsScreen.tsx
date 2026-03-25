import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ACHIEVEMENTS,
  type AchievementDefinition,
  type AchievementId
} from '../game/ACHIEVEMENTS';
import type { AchievementsState } from '../game/types';

export type AchievementsScreenProps = {
  achievements: AchievementsState;
};

const LOCKED_CARD_OPACITY = 0.6;
const LOCKED_ICON_OPACITY = 0.55;
const LOCKED_NAME_COLOR = 'rgba(255,255,255,0.45)';
const LOCKED_LORE_COLOR = 'rgba(255,255,255,0.35)';

function isUnlocked(set: Set<AchievementId>, def: AchievementDefinition) {
  return set.has(def.id);
}

export function AchievementsScreen({ achievements }: AchievementsScreenProps) {
  const unlockedSet = useMemo(
    () => new Set(achievements.unlockedIds as AchievementId[]),
    [achievements.unlockedIds]
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          {Array.from(unlockedSet).length}/{ACHIEVEMENTS.length} страниц
          получено
        </Text>

        {ACHIEVEMENTS.map((def) => {
          const unlocked = isUnlocked(unlockedSet, def);

          return (
            <View
              key={def.id}
              style={[
                styles.card,
                unlocked ? styles.cardUnlocked : null,
                unlocked ? { opacity: 1 } : { opacity: LOCKED_CARD_OPACITY }
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  unlocked ? null : { opacity: LOCKED_ICON_OPACITY }
                ]}
              >
                {def.icon}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.name,
                    { color: unlocked ? '#ffd700' : LOCKED_NAME_COLOR }
                  ]}
                >
                  {def.name}
                </Text>
                <Text
                  style={[
                    styles.lore,
                    unlocked ? null : { color: LOCKED_LORE_COLOR }
                  ]}
                >
                  {unlocked ? def.lore : '???'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 },
  title: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 14
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255,255,255,0.68)',
    marginBottom: 12,
    letterSpacing: 1,
    fontWeight: '800'
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.015)',
    marginBottom: 10
  },
  cardUnlocked: {
    borderColor: 'rgba(255,180,0,0.22)',
    backgroundColor: 'rgba(255,180,0,0.03)'
  },
  icon: { fontSize: 26, flexShrink: 0 },
  name: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  lore: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.6)'
  }
});
