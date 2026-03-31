import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ACHIEVEMENTS,
  type AchievementId
} from '../game/ACHIEVEMENTS';
import { formatNum } from '../game/formatNum';
import type { AchievementsState } from '../game/types';

export type AchievementsScreenProps = {
  achievements: AchievementsState;
  onClaim: (id: AchievementId) => void;
};

const LOCKED_CARD_OPACITY = 0.6;
const LOCKED_ICON_OPACITY = 0.55;
const LOCKED_NAME_COLOR = 'rgba(255,255,255,0.45)';
const LOCKED_LORE_COLOR = 'rgba(255,255,255,0.35)';

export function AchievementsScreen({ achievements, onClaim }: AchievementsScreenProps) {
  const unlockedSet = useMemo(
    () => new Set(achievements.unlockedIds as AchievementId[]),
    [achievements.unlockedIds]
  );
  const claimedSet = useMemo(
    () => new Set(achievements.claimedIds as AchievementId[]),
    [achievements.claimedIds]
  );
  const unlockedOrderMap = useMemo(
    () => new Map(achievements.unlockedIds.map((id, i) => [id, i])),
    [achievements.unlockedIds]
  );

  const sortedAchievements = useMemo(() => {
    return [...ACHIEVEMENTS].sort((a, b) => {
      const aUnlocked = unlockedSet.has(a.id);
      const bUnlocked = unlockedSet.has(b.id);
      const aClaimed = claimedSet.has(a.id);
      const bClaimed = claimedSet.has(b.id);
      const aClaimable = aUnlocked && !aClaimed;
      const bClaimable = bUnlocked && !bClaimed;

      // Claimable first
      if (aClaimable && !bClaimable) return -1;
      if (!aClaimable && bClaimable) return 1;

      // Among claimable: sort by unlock order (most recent first)
      if (aClaimable && bClaimable) {
        return (unlockedOrderMap.get(b.id) ?? 0) - (unlockedOrderMap.get(a.id) ?? 0);
      }

      // Locked last
      if (aUnlocked && !bUnlocked) return -1;
      if (!aUnlocked && bUnlocked) return 1;

      // Among claimed: sort by unlock order (most recent first)
      if (aUnlocked && bUnlocked) {
        return (unlockedOrderMap.get(b.id) ?? 0) - (unlockedOrderMap.get(a.id) ?? 0);
      }

      // Both locked: keep original order
      return 0;
    });
  }, [unlockedSet, claimedSet, unlockedOrderMap]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={sortedAchievements}
        keyExtractor={(def) => String(def.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            {unlockedSet.size}/{ACHIEVEMENTS.length} страниц получено
          </Text>
        }
        renderItem={({ item: def }) => {
          const unlocked = unlockedSet.has(def.id);
          const claimed = claimedSet.has(def.id);
          const claimable = unlocked && !claimed;

          const card = (
            <View
              style={[
                styles.card,
                unlocked ? (claimable ? styles.cardClaimable : styles.cardClaimed) : null,
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
                    { color: claimable ? '#ffd700' : unlocked ? 'rgba(255,215,0,0.45)' : LOCKED_NAME_COLOR }
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
                {unlocked && (
                  <Text style={[styles.reward, { color: claimable ? '#00d4ff' : 'rgba(0,212,255,0.35)' }]}>
                    {claimable ? `Забрать: +${formatNum(def.reward)} ⚡` : `Получено: +${formatNum(def.reward)} ⚡`}
                  </Text>
                )}
              </View>
              {claimable && (
                <View style={styles.claimBadge}>
                  <Text style={styles.claimBadgeText}>!</Text>
                </View>
              )}
            </View>
          );

          if (claimable) {
            return (
              <Pressable
                onPress={() => onClaim(def.id)}
                style={({ pressed }) => [pressed ? { opacity: 0.8 } : null]}
              >
                {card}
              </Pressable>
            );
          }

          return <View>{card}</View>;
        }}
      />
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
  cardClaimable: {
    borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.04)'
  },
  cardClaimed: {
    borderColor: 'rgba(255,180,0,0.12)',
    backgroundColor: 'rgba(255,180,0,0.015)'
  },
  icon: { fontSize: 26, flexShrink: 0 },
  name: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  lore: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.6)'
  },
  reward: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  claimBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 0,
  },
  claimBadgeText: {
    color: '#050918',
    fontSize: 12,
    fontWeight: '900',
  }
});
