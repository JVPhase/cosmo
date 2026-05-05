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
});
