import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logEvent } from '../game/analytics';
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
import { getMaxUltsPerBattle, type ModuleDefinition } from '../game/MODULES';
import { PLANETS } from '../game/PLANETS';
import { formatNum } from '../game/formatNum';
import type { BattleState } from '../game/types';
import { AnimatedHitEffects } from '../ui/AnimatedHitEffects';
import { SkillCheckRing } from '../ui/SkillCheckRing';
import { StarField } from '../ui/StarField';

const BattleTimer = React.memo(function BattleTimer({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const ms = Math.max(0, expiresAt - now);
  const secs = Math.floor(ms / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  const label = `${secs}.${centis.toString().padStart(2, '0')}`;
  const color = ms > 20000 ? '#00d4ff' : ms > 10000 ? '#ff9900' : '#ff3333';

  return (
    <View style={[styles.timerBox, { borderColor: `${color}66` }]}>
      <Text style={styles.timerLabel}>ВРЕМЯ</Text>
      <Text style={[styles.timerValue, { color }]}>{label}</Text>
    </View>
  );
});

export type BattleScreenProps = {
  battle: BattleState | null;
  totalDamage: number;
  defeatInfo: { shipName: string } | null;
  equippedModule: ModuleDefinition | null;
  equippedModuleLevel: number;
  onAttack: (multiplier?: number) => void;
  onReflect: (penaltyMs?: number) => void;
  onHeal: (amount: number, mode?: 'fractionOfMax' | 'flatHp') => void;
  onForfeit: () => void;
  onGoToShipyard: () => void;
  onClearDefeat: () => void;
  onAddBattleTime: (ms: number) => void;
};

export function BattleScreen({
  battle,
  totalDamage,
  defeatInfo,
  equippedModule,
  equippedModuleLevel,
  onAttack,
  onReflect,
  onHeal,
  onForfeit,
  onGoToShipyard,
  onClearDefeat,
  onAddBattleTime,
}: BattleScreenProps) {
  const [hitState, setHitState] = useState<{ count: number; origin?: { x: number; y: number } }>({ count: 0 });
  const battleHitAreaRef = useRef<View>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [abilityActive, setAbilityActive] = useState(false);
  const [shieldWarning, setShieldWarning] = useState(false);
  const [qteAttempted, setQteAttempted] = useState(false);
  const [qteFailed, setQteFailed] = useState(false);
  const [healState, setHealState] = useState<{
    count: number;
    origin?: { x: number; y: number };
    label?: string;
  }>({ count: 0 });
  const [successZoneStart, setSuccessZoneStart] = useState(0);
  const [opportunityActive, setOpportunityActive] = useState(false);
  const abilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opportunityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breakShieldEarlyRef = useRef<(() => void) | null>(null);
  const warnAnim = useRef(new Animated.Value(1)).current;
  const warnAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const lastHitDamageRef = useRef(0);

  // Ultimate state
  const [ultCharge, setUltCharge] = useState(0);
  const [ultActive, setUltActive] = useState(false);
  const [ultSurgeMultiplier, setUltSurgeMultiplier] = useState(1);
  const [dispelImmune, setDispelImmune] = useState(false);
  const dispelImmuneRef = useRef(false);
  const ultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ultsUsedThisBattle, setUltsUsedThisBattle] = useState(0);

  // Reset ult state when battle starts/ends
  const battleId = battle ? `${battle.planetId}-${battle.expiresAt}` : null;
  useEffect(() => {
    if (ultTimeoutRef.current) clearTimeout(ultTimeoutRef.current);
    setUltCharge(0);
    setUltActive(false);
    setUltSurgeMultiplier(1);
    setDispelImmune(false);
    dispelImmuneRef.current = false;
    setUltsUsedThisBattle(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId]);

  const alien = useMemo(
    () => (battle ? ALIENS.find((a) => a.planetId === battle.planetId) ?? null : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [battle?.planetId]
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
        // Dispel immune: skip this illusion activation
        if (!active && dispelImmuneRef.current && ability.type === 'illusion') {
          schedule();
          return;
        }
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

  const isIllusion = alien?.ability?.type === 'illusion';

  // Randomise success zone position and reset QTE flags on each ability activation
  useEffect(() => {
    if (abilityActive) {
      setSuccessZoneStart(Math.floor(Math.random() * 360));
      setQteAttempted(false);
      setQteFailed(false);
    }
  }, [abilityActive]);

  const handleQteSuccess = () => {
    logEvent('qte_success', { alienAbilityType: alien?.ability?.type ?? null });
    setQteAttempted(true);
    breakShieldEarlyRef.current?.();
    // Open opportunity window for the duration the ability would have lasted
    const durationMs = alien?.ability?.durationMs ?? 3000;
    setOpportunityActive(true);
    if (opportunityTimeoutRef.current) clearTimeout(opportunityTimeoutRef.current);
    opportunityTimeoutRef.current = setTimeout(() => setOpportunityActive(false), durationMs);
  };

  const handleQteFail = () => {
    logEvent('qte_fail', { alienAbilityType: alien?.ability?.type ?? null });
    setQteAttempted(true);
    if (isIllusion) {
      setQteFailed(true);
      onHeal(0.10); // противник восстанавливает 10% maxHP
    } else {
      onReflect(2000); // -2s за провал QTE (щит)
    }
  };

  const surgeBonus = equippedModule?.id === 'surge' && ultActive ? ultSurgeMultiplier : 1;
  const attackMultiplier = (opportunityActive ? 2 : 1) * surgeBonus;
  const effectiveDamage = abilityActive ? 0 : Math.floor(totalDamage * attackMultiplier);

  const hitsToCharge = equippedModule?.hitsToCharge ?? 0;
  const maxUltsPerBattle = getMaxUltsPerBattle(equippedModuleLevel);
  const ultLimitReached = ultsUsedThisBattle >= maxUltsPerBattle;
  const ultReady = equippedModule !== null && ultCharge >= hitsToCharge && !ultActive && !ultLimitReached;

  const handleActivateUlt = useCallback(() => {
    if (!ultReady || !equippedModule) return;
    logEvent('activate_ult', { moduleId: equippedModule.id });
    setUltCharge(0);
    setUltsUsedThisBattle((prev) => prev + 1);
    setUltActive(true);
    if (equippedModule.id === 'surge') {
      setUltSurgeMultiplier(5);
      if (ultTimeoutRef.current) clearTimeout(ultTimeoutRef.current);
      ultTimeoutRef.current = setTimeout(() => {
        setUltActive(false);
        setUltSurgeMultiplier(1);
      }, equippedModule.ultDurationMs);
    } else if (equippedModule.id === 'warp') {
      onAddBattleTime(20_000);
      setUltActive(false);
    } else if (equippedModule.id === 'dispel') {
      // Break active illusion if running
      if (abilityActive && isIllusion) {
        breakShieldEarlyRef.current?.();
      }
      dispelImmuneRef.current = true;
      setDispelImmune(true);
      if (ultTimeoutRef.current) clearTimeout(ultTimeoutRef.current);
      ultTimeoutRef.current = setTimeout(() => {
        dispelImmuneRef.current = false;
        setDispelImmune(false);
        setUltActive(false);
      }, equippedModule.ultDurationMs);
    }
  }, [ultReady, equippedModule, abilityActive, isIllusion, onAddBattleTime]);

  const handleAttack = useCallback((e: GestureResponderEvent) => {
    const native = e.nativeEvent as unknown as {
      locationX?: number;
      locationY?: number;
      pageX?: number;
      pageY?: number;
    };

    // Illusion failed — clicks heal the enemy by the same HP as the player's attack would deal
    if (abilityActive && qteAttempted && qteFailed && isIllusion) {
      const healHp = Math.floor(totalDamage * attackMultiplier);
      const commitHealHit = (x: number, y: number) => {
        setHealState((prev) => ({
          count: prev.count + 1,
          origin: { x, y },
          label: `+${formatNum(healHp)}`,
        }));
        onHeal(healHp, 'flatHp');
      };
      if (Platform.OS === 'web' && battleHitAreaRef.current) {
        battleHitAreaRef.current.measureInWindow((mx, my) => {
          commitHealHit((native.pageX ?? 0) - mx, (native.pageY ?? 0) - my);
        });
      } else {
        commitHealHit(native.locationX ?? 80, native.locationY ?? 80);
      }
      return;
    }

    // Shield failed — clicks penalise timer and deal half damage
    if (abilityActive && qteAttempted && !isIllusion) {
      onReflect(1000); // -1s
      const commitReflectHit = (x: number, y: number) => {
        lastHitDamageRef.current = Math.floor(totalDamage * 0.5);
        onAttack(0.5);
        setHitState((prev) => ({ count: prev.count + 1, origin: { x, y } }));
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
      onAttack(attackMultiplier);
      setHitState((prev) => ({ count: prev.count + 1, origin: { x, y } }));
      if (equippedModule && !ultActive) {
        setUltCharge((prev) => Math.min(equippedModule.hitsToCharge, prev + 1));
      }
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
  }, [abilityActive, qteAttempted, qteFailed, isIllusion, attackMultiplier, totalDamage, onHeal, onReflect, onAttack, equippedModule, ultActive]);


  // No battle and no recent defeat
  if (!battle && !defeatInfo) {
    return (
      <LinearGradient
        colors={['#050918', '#0a1628', '#061020']}
        style={styles.screen}
      >
        <StarField />
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
        <StarField dimmed />
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
      <StarField />

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
          {battle && <BattleTimer expiresAt={battle.expiresAt} />}
        </View>

        {/* HP bar */}
        <View style={styles.hpLabelRow}>
          <Text style={styles.hpLabel}>HP ПРОТИВНИКА</Text>
          <Text style={styles.hpNumbers}>
            {formatNum(battle!.currentHP)} /{' '}
            {formatNum(battle!.maxHP)}
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
          <Text style={styles.statChip}>⚔️ {formatNum(effectiveDamage)}/клик</Text>
          {abilityActive && !qteAttempted && (
            <Text style={[styles.statChip, { color: '#00dc64' }]}>
              🎯 QTE — {isIllusion ? 'рассейте иллюзию!' : 'снимите щит!'}
            </Text>
          )}
          {abilityActive && qteAttempted && !isIllusion && (
            <Text style={[styles.statChip, { color: '#ff8844' }]}>
              🛡 ×0.5 урон / −1с за клик
            </Text>
          )}
          {abilityActive && qteAttempted && isIllusion && (
            <Text style={[styles.statChip, { color: '#44ff88' }]}>
              👻 клики лечат врага +5%
            </Text>
          )}
          {opportunityActive && (
            <Text style={[styles.statChip, { color: '#ff9900' }]}>
              ⚡ ×2 АТАКА!
            </Text>
          )}
          {equippedModule?.id === 'surge' && ultActive && (
            <Text style={[styles.statChip, { color: '#ffe066' }]}>
              ⚡ ×5 ВСПЛЕСК!
            </Text>
          )}
          {equippedModule?.id === 'dispel' && dispelImmune && (
            <Text style={[styles.statChip, { color: '#b388ff' }]}>
              👁️ ИММУНИТЕТ К ИЛЛЮЗИИ
            </Text>
          )}
        </View>
      </View>

      {/* Forfeit button + Ult button row */}
      <View style={styles.forfeitRow}>
        <Pressable onPress={onForfeit} style={styles.forfeitBtn}>
          <Text style={styles.forfeitText}>✕ ОТСТУПИТЬ</Text>
        </Pressable>
        {equippedModule && (
          <Pressable
            onPress={handleActivateUlt}
            disabled={!ultReady}
            style={[styles.ultBtn, ultReady && styles.ultBtnReady, ultActive && styles.ultBtnActive]}
          >
            <View style={styles.ultBtnInner}>
              <Text style={styles.ultBtnIcon}>{equippedModule.icon}</Text>
              <View style={styles.ultBtnText}>
                <View style={styles.ultBtnTopRow}>
                  <Text style={[styles.ultBtnName, ultReady && { color: '#ffe066' }]}>
                    {ultActive ? '◈ АКТИВНО' : ultReady ? `◈ ${equippedModule.ultName}` : equippedModule.ultName}
                  </Text>
                  <Text style={[styles.ultBtnCounter, ultLimitReached && { color: '#ff5555' }]}>
                    {ultsUsedThisBattle}/{maxUltsPerBattle}
                  </Text>
                </View>
                <View style={styles.ultChargeBarBg}>
                  <View
                    style={[
                      styles.ultChargeBarFill,
                      { width: `${Math.min(100, (ultCharge / hitsToCharge) * 100)}%` },
                      ultReady && { backgroundColor: '#ffe066' },
                      ultActive && { backgroundColor: '#ff9900', width: '100%' },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Pressable>
        )}
      </View>

      {/* Main — clickable rocket */}
      <View style={styles.main}>
        <View
          ref={battleHitAreaRef}
          style={styles.battleHitArea}
          collapsable={false}
        >
          <AnimatedHitEffects
            trigger={hitState.count}
            origin={hitState.origin}
            damage={lastHitDamageRef.current || effectiveDamage}
            style={[
              styles.rocketBtn,
              abilityActive && !isIllusion && styles.rocketBtnShield,
              abilityActive && isIllusion && styles.rocketBtnIllusion,
              opportunityActive && styles.rocketBtnOpportunity,
            ]}
          >
            <Pressable
              onPressIn={abilityActive && !qteAttempted ? undefined : handleAttack}
              style={({ pressed }) => [
                StyleSheet.absoluteFill,
                styles.rocketPressable,
                pressed && !abilityActive ? { opacity: 0.9 } : null
              ]}
            >
              <Animated.View style={{
                transform: [{ translateX: shakeAnim }],
                opacity: (isIllusion && abilityActive && !qteAttempted)
                  ? 0.4
                  : (shieldWarning ? warnAnim : 1)
              }}>
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
              {abilityActive && qteAttempted && isIllusion && qteFailed && (
                <Text style={styles.illusionClickHint}>
                  +{formatNum(Math.floor(totalDamage * attackMultiplier))} HP
                </Text>
              )}
            </Pressable>
          </AnimatedHitEffects>

          {/* Heal effect overlay — green HP floater */}
          {healState.count > 0 && healState.origin && (
            <View
              style={[StyleSheet.absoluteFill, styles.healOverlay]}
              pointerEvents="none"
            >
              <Text
                style={[
                  styles.healFloatText,
                  { left: healState.origin.x - 28, top: healState.origin.y - 20 },
                ]}
              >
                {healState.label ?? '+HP'}
              </Text>
            </View>
          )}

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
              ? isIllusion
                ? (qteAttempted ? '👻 ИЛЛЮЗИЯ! КЛИКИ ЛЕЧАТ ВРАГА...' : '🎯 НАЖМИТЕ В КРАСНУЮ ЗОНУ!')
                : (qteAttempted ? '⌛ ЩИТ ДЕРЖИТСЯ...' : '🎯 НАЖМИТЕ В КРАСНУЮ ЗОНУ!')
              : '◈ ЖМИТЕ ДЛЯ АТАКИ ◈'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative', overflow: 'hidden', userSelect: 'none' },
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
  illusionClickHint: {
    marginTop: 8,
    fontSize: 11,
    color: '#44ff88',
    fontWeight: '900',
    letterSpacing: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    fontSize: 9,
    color: 'rgba(255,80,80,0.25)',
    letterSpacing: 3,
    fontWeight: '700'
  },
  rocketBtnIllusion: {
    backgroundColor: 'rgba(150,50,255,0.08)',
    borderColor: 'rgba(180,80,255,0.4)',
  },
  healOverlay: {
    zIndex: 10,
  },
  healFloatText: {
    position: 'absolute',
    fontSize: 14,
    color: '#44ff88',
    fontWeight: '900',
    letterSpacing: 1,
  },
  ultBtn: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  ultBtnReady: {
    borderColor: 'rgba(255,224,102,0.6)',
    backgroundColor: 'rgba(255,224,102,0.1)',
  },
  ultBtnActive: {
    borderColor: 'rgba(255,153,0,0.7)',
    backgroundColor: 'rgba(255,153,0,0.15)',
  },
  ultBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ultBtnIcon: { fontSize: 16 },
  ultBtnText: { flex: 1 },
  ultBtnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ultBtnName: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  ultBtnCounter: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '700',
  },
  ultChargeBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  ultChargeBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#00d4ff',
  },
});

