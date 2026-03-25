import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent
} from 'react-native';
import { ALIENS } from '../game/ALIENS';
import { PLANETS } from '../game/PLANETS';
import type { BattleState } from '../game/types';
import { AnimatedHitEffects } from '../ui/AnimatedHitEffects';

export type BattleScreenProps = {
  battle: BattleState | null;
  timeRemaining: number;
  totalDamage: number;
  defeatInfo: { shipName: string } | null;
  onAttack: () => void;
  onForfeit: () => void;
  onGoToShipyard: () => void;
  onClearDefeat: () => void;
};

export function BattleScreen({
  battle,
  timeRemaining,
  totalDamage,
  defeatInfo,
  onAttack,
  onForfeit,
  onGoToShipyard,
  onClearDefeat
}: BattleScreenProps) {
  const [hitTrigger, setHitTrigger] = useState(0);
  const [hitOrigin, setHitOrigin] = useState<
    { x: number; y: number } | undefined
  >(undefined);
  const battleHitAreaRef = useRef<View>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2
      })),
    []
  );

  const handleAttack = (e: GestureResponderEvent) => {
    const native = e.nativeEvent as unknown as {
      locationX?: number;
      locationY?: number;
      pageX?: number;
      pageY?: number;
    };

    const commitHit = (x: number, y: number) => {
      setHitOrigin({ x, y });
      onAttack();
      setHitTrigger((t) => t + 1);
    };

    if (Platform.OS === 'web' && battleHitAreaRef.current) {
      battleHitAreaRef.current.measureInWindow((mx, my) => {
        commitHit(
          (native.pageX ?? 0) - mx,
          (native.pageY ?? 0) - my
        );
      });
    } else {
      commitHit(native.locationX ?? 80, native.locationY ?? 80);
    }
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear
      }),
      Animated.timing(shakeAnim, {
        toValue: 4,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear
      })
    ]).start();
  };

  const timerColor =
    timeRemaining > 20000
      ? '#00d4ff'
      : timeRemaining > 10000
        ? '#ff9900'
        : '#ff3333';

  const formatTimer = (ms: number) => {
    const totalMs = Math.max(0, ms);
    const secs = Math.floor(totalMs / 1000);
    const centis = Math.floor((totalMs % 1000) / 10);
    return `${secs}.${centis.toString().padStart(2, '0')}`;
  };

  // No battle and no recent defeat
  if (!battle && !defeatInfo) {
    return (
      <LinearGradient
        colors={['#050918', '#0a1628', '#061020']}
        style={styles.screen}
      >
        {stars.map((s) => (
          <View
            key={s.id}
            style={[
              styles.star,
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                opacity: s.opacity
              }
            ]}
          />
        ))}
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⚔️</Text>
          <Text style={styles.emptyTitle}>НЕТ АКТИВНОГО БОЯ</Text>
          <Text style={styles.emptyText}>
            Выберите вражескую планету на вкладке ПЛАН. и начните атаку.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // Defeat screen
  if (!battle && defeatInfo) {
    return (
      <LinearGradient
        colors={['#1a0505', '#200a0a', '#0a0505']}
        style={styles.screen}
      >
        {stars.map((s) => (
          <View
            key={s.id}
            style={[
              styles.star,
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                opacity: s.opacity * 0.5
              }
            ]}
          />
        ))}
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💥</Text>
          <Text style={[styles.emptyTitle, { color: '#ff4444' }]}>
            КОРАБЛЬ СЛОМАН
          </Text>
          <Text style={[styles.emptyText, { color: 'rgba(255,150,150,0.7)' }]}>
            «{defeatInfo.shipName}» получил критические повреждения и вышел из
            боя.{'\n\n'}
            Отправьтесь в Верфь для починки.
          </Text>
          <Pressable onPress={() => { onClearDefeat(); onGoToShipyard(); }} style={styles.goShipyardBtn}>
            <Text style={styles.goShipyardText}>🛠️ ПЕРЕЙТИ В ВЕРФЬ</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  // Active battle
  const alien = ALIENS.find((a) => a.planetId === battle!.planetId);
  const planet = PLANETS.find((p) => p.id === battle!.planetId);
  const hpPercent = battle!.maxHP > 0 ? battle!.currentHP / battle!.maxHP : 0;
  const hpColor =
    hpPercent > 0.6 ? '#ff4444' : hpPercent > 0.3 ? '#ff9900' : '#ffdd00';

  return (
    <LinearGradient
      colors={['#050918', '#0a0a28', '#061020']}
      style={styles.screen}
    >
      {stars.map((s) => (
        <View
          key={s.id}
          style={[
            styles.star,
            {
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              opacity: s.opacity
            }
          ]}
        />
      ))}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.raceLabel}>
              {alien?.icon} {alien?.name ?? 'Противник'}
            </Text>
            <Text style={styles.planetLabel}>
              {planet?.icon} {planet?.name}
            </Text>
          </View>
          {/* Timer */}
          <View style={[styles.timerBox, { borderColor: `${timerColor}66` }]}>
            <Text style={styles.timerLabel}>ВРЕМЯ</Text>
            <Text style={[styles.timerValue, { color: timerColor }]}>
              {formatTimer(timeRemaining)}
            </Text>
          </View>
        </View>

        {/* HP bar */}
        <View style={styles.hpLabelRow}>
          <Text style={styles.hpLabel}>HP ПРОТИВНИКА</Text>
          <Text style={styles.hpNumbers}>
            {battle!.currentHP.toLocaleString()} /{' '}
            {battle!.maxHP.toLocaleString()}
          </Text>
        </View>
        <View style={styles.hpBarBg}>
          <View
            style={[
              styles.hpBarFill,
              {
                width: `${Math.max(0, hpPercent * 100)}%`,
                backgroundColor: hpColor
              }
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statChip}>⚔️ {totalDamage}/клик</Text>
        </View>
      </View>

      {/* Forfeit button */}
      <View style={styles.forfeitRow}>
        <Pressable onPress={onForfeit} style={styles.forfeitBtn}>
          <Text style={styles.forfeitText}>✕ ОТСТУПИТЬ</Text>
        </Pressable>
      </View>

      {/* Main — clickable rocket */}
      <View style={styles.main}>
        <View
          ref={battleHitAreaRef}
          style={styles.battleHitArea}
          collapsable={false}
        >
          <AnimatedHitEffects
            trigger={hitTrigger}
            origin={hitOrigin}
            damage={totalDamage}
            style={styles.rocketBtn}
          >
            <Pressable
              onPressIn={handleAttack}
              style={({ pressed }) => [
                StyleSheet.absoluteFill,
                styles.rocketPressable,
                pressed ? { opacity: 0.9 } : null
              ]}
            >
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                {alien?.image ? (
                  <Image
                    source={alien.image}
                    style={styles.alienShipImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.rocketEmoji}>🚀</Text>
                )}
              </Animated.View>
              <Text style={styles.clickHint}>АТАКОВАТЬ</Text>
            </Pressable>
          </AnimatedHitEffects>
        </View>

        <Text style={styles.hint}>◈ ЖМИТЕ ДЛЯ АТАКИ ◈</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative', overflow: 'hidden', userSelect: 'none' },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    zIndex: 0
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    zIndex: 2
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 12
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    lineHeight: 20,
    marginBottom: 20
  },
  goShipyardBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'rgba(0,212,255,0.06)'
  },
  goShipyardText: {
    fontSize: 12,
    color: '#00d4ff',
    fontWeight: '900',
    letterSpacing: 1
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(20,0,40,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,80,80,0.15)',
    zIndex: 2
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  raceLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ff6666',
    letterSpacing: 1
  },
  planetLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  timerBox: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  timerLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    fontWeight: '800'
  },
  timerValue: { fontSize: 20, fontWeight: '900' },
  hpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  hpLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    fontWeight: '800'
  },
  hpNumbers: { fontSize: 8, color: 'rgba(255,100,100,0.7)', fontWeight: '800' },
  hpBarBg: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8
  },
  hpBarFill: { height: '100%', borderRadius: 6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: { fontSize: 9, color: 'rgba(255,150,150,0.7)', fontWeight: '700' },
  forfeitRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 8,
    zIndex: 2,
  },
  forfeitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.35)',
    backgroundColor: 'rgba(255,40,40,0.1)',
  },
  forfeitText: {
    fontSize: 11,
    color: 'rgba(255,100,100,0.85)',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  battleHitArea: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 0,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rocketBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,40,40,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)'
  },
  rocketPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 120
  },
  rocketEmoji: { fontSize: 108 },
  alienShipImage: { width: 150, height: 150 },
  clickHint: {
    marginTop: 8,
    fontSize: 10,
    color: 'rgba(255,100,100,0.7)',
    fontWeight: '800',
    letterSpacing: 3
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    fontSize: 9,
    color: 'rgba(255,80,80,0.25)',
    letterSpacing: 3,
    fontWeight: '700'
  }
});
