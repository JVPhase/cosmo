import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { SkillCheckRing } from '../ui/SkillCheckRing';

export type BattleScreenProps = {
  battle: BattleState | null;
  timeRemaining: number;
  totalDamage: number;
  defeatInfo: { shipName: string } | null;
  onAttack: (multiplier?: number) => void;
  onReflect: (penaltyMs?: number) => void;
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
  onReflect,
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

  const [abilityActive, setAbilityActive] = useState(false);
  const [shieldWarning, setShieldWarning] = useState(false);
  const [qteAttempted, setQteAttempted] = useState(false);
  const [successZoneStart, setSuccessZoneStart] = useState(0);
  const [opportunityActive, setOpportunityActive] = useState(false);
  const abilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opportunityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breakShieldEarlyRef = useRef<(() => void) | null>(null);
  const warnAnim = useRef(new Animated.Value(1)).current;
  const warnAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const lastHitDamageRef = useRef(0);

  const alien = useMemo(
    () => (battle ? ALIENS.find((a) => a.planetId === battle.planetId) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [battle?.planetId]
  );

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

  // Alien ability cycle
  useEffect(() => {
    if (!battle || !alien?.ability) {
      if (abilityTimeoutRef.current) clearTimeout(abilityTimeoutRef.current);
      if (warnTimeoutRef.current) clearTimeout(warnTimeoutRef.current);
      setAbilityActive(false);
      setShieldWarning(false);
      return;
    }
    const { ability } = alien;
    const WARN_MS = 2000;
    let active = false;
    const schedule = () => {
      const delay = active ? ability.durationMs : ability.intervalMs;
      // Schedule warning 2s before shield activates (only during idle phase)
      if (!active && delay > WARN_MS) {
        warnTimeoutRef.current = setTimeout(() => setShieldWarning(true), delay - WARN_MS);
      }
      abilityTimeoutRef.current = setTimeout(() => {
        active = !active;
        setShieldWarning(false);
        setAbilityActive(active);
        schedule();
      }, delay);
    };
    // Allow external early termination of the shield
    breakShieldEarlyRef.current = () => {
      if (abilityTimeoutRef.current) clearTimeout(abilityTimeoutRef.current);
      if (warnTimeoutRef.current) clearTimeout(warnTimeoutRef.current);
      active = false;
      setAbilityActive(false);
      setShieldWarning(false);
      schedule();
    };
    schedule();
    return () => {
      if (abilityTimeoutRef.current) clearTimeout(abilityTimeoutRef.current);
      if (warnTimeoutRef.current) clearTimeout(warnTimeoutRef.current);
      if (opportunityTimeoutRef.current) clearTimeout(opportunityTimeoutRef.current);
      setAbilityActive(false);
      setShieldWarning(false);
      setOpportunityActive(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!battle, alien?.ability?.type]);

  // Accelerating blink when shield is about to activate
  useEffect(() => {
    if (shieldWarning) {
      const blink = (dur: number) => [
        Animated.timing(warnAnim, { toValue: 0.1, duration: dur / 2, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(warnAnim, { toValue: 1,   duration: dur / 2, useNativeDriver: true, easing: Easing.linear }),
      ];
      warnAnimRef.current = Animated.sequence([
        // slow   ~600ms: 2 × 300ms
        ...blink(300), ...blink(300),
        // medium ~600ms: 3 × 200ms
        ...blink(200), ...blink(200), ...blink(200),
        // fast   ~480ms: 6 × 80ms
        ...blink(80), ...blink(80), ...blink(80), ...blink(80), ...blink(80), ...blink(80),
        // turbo  ~240ms: 6 × 40ms
        ...blink(40), ...blink(40), ...blink(40), ...blink(40), ...blink(40), ...blink(40),
      ]);
      warnAnimRef.current.start();
    } else {
      warnAnimRef.current?.stop();
      warnAnim.setValue(1);
    }
  }, [shieldWarning, warnAnim]);

  // Randomise success zone position and reset QTE on each shield activation
  useEffect(() => {
    if (abilityActive) {
      setSuccessZoneStart(Math.floor(Math.random() * 360));
      setQteAttempted(false);
    }
  }, [abilityActive]);

  const handleQteSuccess = () => {
    setQteAttempted(true);
    breakShieldEarlyRef.current?.();
    // Open opportunity window for the duration the shield would have lasted
    const durationMs = alien?.ability?.durationMs ?? 3000;
    setOpportunityActive(true);
    if (opportunityTimeoutRef.current) clearTimeout(opportunityTimeoutRef.current);
    opportunityTimeoutRef.current = setTimeout(() => setOpportunityActive(false), durationMs);
  };

  const handleQteFail = () => {
    setQteAttempted(true);
    onReflect(2000); // -2s за провал QTE
  };

  const attackMultiplier = opportunityActive ? 2 : 1;
  const effectiveDamage = abilityActive ? 0 : Math.floor(totalDamage * attackMultiplier);

  const handleAttack = (e: GestureResponderEvent) => {
    const native = e.nativeEvent as unknown as {
      locationX?: number;
      locationY?: number;
      pageX?: number;
      pageY?: number;
    };

    // After failed QTE — clicks still penalise timer and deal half damage
    if (abilityActive && qteAttempted) {
      onReflect(1000); // -1s
      const commitReflectHit = (x: number, y: number) => {
        lastHitDamageRef.current = Math.floor(totalDamage * 0.5);
        setHitOrigin({ x, y });
        onAttack(0.5);
        setHitTrigger((t) => t + 1);
      };
      if (Platform.OS === 'web' && battleHitAreaRef.current) {
        battleHitAreaRef.current.measureInWindow((mx, my) => {
          commitReflectHit((native.pageX ?? 0) - mx, (native.pageY ?? 0) - my);
        });
      } else {
        commitReflectHit(native.locationX ?? 80, native.locationY ?? 80);
      }
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true, easing: Easing.linear }),
      ]).start();
      return;
    }

    const commitHit = (x: number, y: number) => {
      lastHitDamageRef.current = Math.floor(totalDamage * attackMultiplier);
      setHitOrigin({ x, y });
      onAttack(attackMultiplier);
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
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true, easing: Easing.linear })
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
          <Text style={styles.statChip}>⚔️ {effectiveDamage}/клик</Text>
          {abilityActive && !qteAttempted && (
            <Text style={[styles.statChip, { color: '#00dc64' }]}>
              🎯 QTE — снимите щит!
            </Text>
          )}
          {abilityActive && qteAttempted && (
            <Text style={[styles.statChip, { color: '#ff8844' }]}>
              🛡 ×0.5 урон / −1с за клик
            </Text>
          )}
          {opportunityActive && (
            <Text style={[styles.statChip, { color: '#ff9900' }]}>
              ⚡ ×2 АТАКА!
            </Text>
          )}
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
            damage={lastHitDamageRef.current || effectiveDamage}
            style={[styles.rocketBtn, abilityActive && styles.rocketBtnShield, opportunityActive && styles.rocketBtnOpportunity]}
          >
            <Pressable
              onPressIn={abilityActive && !qteAttempted ? undefined : handleAttack}
              style={({ pressed }) => [
                StyleSheet.absoluteFill,
                styles.rocketPressable,
                pressed && !abilityActive ? { opacity: 0.9 } : null
              ]}
            >
              <Animated.View style={{ transform: [{ translateX: shakeAnim }], opacity: shieldWarning ? warnAnim : 1 }}>
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
              {(!abilityActive || opportunityActive) && (
                <Text style={[styles.clickHint, opportunityActive && { color: '#ff9900' }]}>
                  {opportunityActive ? '⚡ АТАКОВАТЬ' : 'АТАКОВАТЬ'}
                </Text>
              )}
            </Pressable>
          </AnimatedHitEffects>

          {/* QTE ring overlay — поверх корабля, скрывается после попытки */}
          {abilityActive && !qteAttempted && (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="box-none">
              <SkillCheckRing
                active={abilityActive}
                speedMs={1800}
                successZoneDeg={65}
                successZoneStart={successZoneStart}
                attempted={qteAttempted}
                onSuccess={handleQteSuccess}
                onFail={handleQteFail}
                size={220}
              />
            </View>
          )}
        </View>

        <Text style={styles.hint}>
          {opportunityActive
            ? '⚡ ОКНО ВОЗМОЖНОСТЕЙ — АТАКУЙТЕ! ⚡'
            : abilityActive
              ? (qteAttempted ? '⌛ ЩИТ ДЕРЖИТСЯ...' : '🎯 НАЖМИТЕ В КРАСНУЮ ЗОНУ!')
              : '◈ ЖМИТЕ ДЛЯ АТАКИ ◈'}
        </Text>
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
  statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
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
  rocketBtnShield: {
    backgroundColor: 'rgba(50,100,255,0.08)',
    borderColor: 'rgba(80,150,255,0.35)',
  },
  rocketBtnOpportunity: {
    backgroundColor: 'rgba(255,130,0,0.1)',
    borderColor: 'rgba(255,160,0,0.6)',
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
  },
});

