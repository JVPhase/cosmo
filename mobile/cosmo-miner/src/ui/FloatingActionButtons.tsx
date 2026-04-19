import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type FloatingActionButtonsProps = {
  headerHeight: number;
  hasAffordableResearch: boolean;
  onOpenResearch: () => void;
  achievementsUnlocked: boolean;
  hasUnclaimedAchievements: boolean;
  onOpenAchievements: () => void;
  onOpenStoryLog: () => void;
  hasNewStoryEntry: boolean;
  onOpenPrestige: () => void;
  isPrestigeAvailable: boolean;
  prestigeCount: number;
};

export function FloatingActionButtons({
  headerHeight,
  hasAffordableResearch,
  onOpenResearch,
  achievementsUnlocked,
  hasUnclaimedAchievements,
  onOpenAchievements,
  onOpenStoryLog,
  hasNewStoryEntry,
  onOpenPrestige,
  isPrestigeAvailable,
  prestigeCount,
}: FloatingActionButtonsProps) {
  if (headerHeight === 0) return null;

  return (
    <View style={[styles.floatingBtns, { top: headerHeight + 10 }]}>
      <Pressable
        onPress={onOpenResearch}
        style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
      >
        <Text style={styles.floatingBtnIcon}>🔬</Text>
        {hasAffordableResearch && <View style={styles.floatingBtnBadge} />}
      </Pressable>

      {achievementsUnlocked && (
        <Pressable
          onPress={onOpenAchievements}
          style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
        >
          <Text style={styles.floatingBtnIcon}>🏆</Text>
          {hasUnclaimedAchievements && <View style={styles.floatingBtnBadge} />}
        </Pressable>
      )}

      <Pressable
        onPress={onOpenStoryLog}
        style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
      >
        <Text style={styles.floatingBtnIcon}>📖</Text>
        {hasNewStoryEntry && <View style={styles.floatingBtnBadge} />}
      </Pressable>

      <Pressable
        onPress={onOpenPrestige}
        style={({ pressed }) => [
          styles.floatingBtn,
          isPrestigeAvailable && styles.floatingBtnPrestige,
          pressed ? { opacity: 0.7 } : null,
        ]}
      >
        <Text style={styles.floatingBtnIcon}>♻️</Text>
        {isPrestigeAvailable && <View style={styles.floatingBtnBadgeGold} />}
        {prestigeCount > 0 && (
          <View style={styles.floatingBtnPrestigeBadge}>
            <Text style={styles.floatingBtnPrestigeBadgeText}>{prestigeCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBtns: {
    position: 'absolute',
    left: 10,
    flexDirection: 'column',
    gap: 6 as any,
    zIndex: 5,
  },
  floatingBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingBtnIcon: { fontSize: 16 },
  floatingBtnBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff3b3b',
  },
  floatingBtnPrestige: {
    borderColor: 'rgba(255,200,0,0.45)',
    backgroundColor: 'rgba(255,200,0,0.10)',
  },
  floatingBtnBadgeGold: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ffd700',
  },
  floatingBtnPrestigeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255,200,0,0.85)',
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  floatingBtnPrestigeBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#050918',
  },
});
