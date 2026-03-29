import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logEvent } from '../game/analytics';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent
} from 'react-native';
import { AnimatedMineEffects } from '../ui/AnimatedMineEffects';
import { PassiveMiningFx } from '../ui/PassiveMiningFx';
import { formatNum } from '../game/formatNum';
import { METALS, type MetalId } from '../game/METALS';
import type { PlanetDefinition } from '../game/PLANETS';
import { getPlayerTitle, xpAtLevelStart, xpForNextLevel } from '../game/PLAYER';
import type { MetalsState } from '../game/types';

const CHARACTER_TEXT_COLORS: Record<string, string> = {
  lien:   '#f5c842', // тёплый золотой
  riva:   '#42e8c4', // мятный бирюзовый
  graves: '#a0b4e0', // холодный серо-голубой
  alex:   '#80d9a0', // мягкий зелёный
};

const CHARACTER_BORDER_COLORS: Record<string, string> = {
  lien:   'rgba(245,200,66,0.35)',
  riva:   'rgba(66,232,196,0.35)',
  graves: 'rgba(160,180,224,0.35)',
  alex:   'rgba(128,217,160,0.35)',
};

type Point = { x: number; y: number };

type MetalFloat = {
  id: number;
  born: number;
  metalId: MetalId;
  amount: number;
  offsetX: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
};

export type GameScreenProps = {
  energy: number;
  totalEarned: number;
  clickPower: number;
  passiveRate: number; // per second
  metals: MetalsState;
  discoveredMetals: MetalId[];
  onMine: () => void;
  planet: PlanetDefinition;
  clerkMessage: string | null;
  onCloseClerk: () => void;
  achievementToast: {
    id: number;
    name: string;
    icon: string;
    lore: string;
  } | null;
  onCloseAchievementToast: () => void;
  playerLevel: number;
  playerXP: number;
  levelUpToast: number | null;
  onCloseLevelUpToast: () => void;
  hasAffordableResearch: boolean;
  onOpenResearch: () => void;
  onOpenAchievements: () => void;
  achievementsUnlocked: boolean;
  hasUnclaimedAchievements: boolean;
  onOpenClickPowerInfo: () => void;
  onOpenPassiveRateInfo: () => void;
  onOpenPlanetBonusInfo: () => void;
  onOpenMetalInfo: (metalId: MetalId) => void;
  onOpenStoryLog: () => void;
  hasNewStoryEntry: boolean;
  characterMessage: string | null;
  onCloseCharacterMessage: () => void;
  chosenCharacter: { id: string; name: string; icon: string } | null;
};

export function GameScreen({
  energy,
  totalEarned,
  clickPower,
  passiveRate,
  metals,
  discoveredMetals,
  onMine,
  planet,
  clerkMessage,
  onCloseClerk,
  achievementToast,
  onCloseAchievementToast,
  playerLevel,
  playerXP,
  levelUpToast,
  onCloseLevelUpToast,
  hasAffordableResearch,
  onOpenResearch,
  onOpenAchievements,
  achievementsUnlocked,
  hasUnclaimedAchievements,
  onOpenClickPowerInfo,
  onOpenPassiveRateInfo,
  onOpenPlanetBonusInfo,
  onOpenMetalInfo,
  onOpenStoryLog,
  hasNewStoryEntry,
  characterMessage,
  onCloseCharacterMessage,
  chosenCharacter,
}: GameScreenProps) {
  const xpStart = xpAtLevelStart(playerLevel);
  const xpNext = xpForNextLevel(playerLevel);
  const xpPercent =
    xpNext !== null
      ? Math.min(1, (playerXP - xpStart) / (xpNext - xpStart))
      : 1;
  const [tapState, setTapState] = useState<{ count: number; origin?: Point }>({ count: 0 });
  const [headerHeight, setHeaderHeight] = useState(0);
  const onHeaderLayout = (e: LayoutChangeEvent) =>
    setHeaderHeight(e.nativeEvent.layout.height);
  const [showClickHint, setShowClickHint] = useState(true);
  const miningPlayAreaRef = useRef<View>(null);
  const lastClickRef = useRef<number | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMetalsRef = useRef<MetalsState>(metals);
  const metalFloatIdRef = useRef(0);
  const [metalFloats, setMetalFloats] = useState<MetalFloat[]>([]);
  const glowScale = useRef(new Animated.Value(1)).current;
  const stars = useMemo(() => {
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 0.6,
      opacity: Math.random() * 0.6 + 0.25
    }));
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.14,
          duration: 1100,
          useNativeDriver: true
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true
        })
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
      glowScale.stopAnimation();
    };
  }, [glowScale]);

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    const nativeEvent = e.nativeEvent as unknown as {
      locationX?: number;
      locationY?: number;
      pageX?: number;
      pageY?: number;
    };

    const commitTap = (x: number, y: number) => {
      setTapState((prev) => ({ count: prev.count + 1, origin: { x, y } }));
      onMine();
    };

    if (Platform.OS === 'web' && miningPlayAreaRef.current) {
      miningPlayAreaRef.current.measureInWindow((mx, my) => {
        commitTap((nativeEvent.pageX ?? 0) - mx, (nativeEvent.pageY ?? 0) - my);
      });
    } else {
      commitTap(nativeEvent.locationX ?? 0, nativeEvent.locationY ?? 0);
    }

    lastClickRef.current = Date.now();
    setShowClickHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowClickHint(true);
    }, 30000);
  }, [onMine]);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const prev = prevMetalsRef.current;
    const deltas: { metalId: MetalId; amount: number }[] = [];

    for (const m of METALS) {
      const diff = (metals[m.id] ?? 0) - (prev[m.id] ?? 0);
      if (diff > 0) deltas.push({ metalId: m.id, amount: diff });
    }

    prevMetalsRef.current = metals;

    if (deltas.length === 0) return;

    const now = Date.now();
    const spacing = 54;
    const newFloats: MetalFloat[] = deltas.map((d, i) => {
      const offsetX = (i - (deltas.length - 1) / 2) * spacing;
      const translateY = new Animated.Value(-85);
      const opacity = new Animated.Value(1);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -175,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ]).start();

      return {
        id: ++metalFloatIdRef.current,
        born: now,
        metalId: d.metalId,
        amount: d.amount,
        offsetX,
        translateY,
        opacity
      };
    });

    setMetalFloats((prev) => [...prev, ...newFloats].slice(-6));

    setTimeout(() => {
      const t = Date.now();
      setMetalFloats((prev) => prev.filter((f) => t - f.born < 1100));
    }, 1100);
  }, [metals]);

  return (
    <LinearGradient
      colors={['#050918', '#0a1628', '#061020']}
      style={styles.screen}
    >
      {/* Stars */}
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

      {/* Achievement toast */}
      {achievementToast ? (
        <Pressable
          style={({ pressed }) => [
            styles.achievementToast,
            pressed && { opacity: 0.85 }
          ]}
          onPress={() => {
            logEvent('toast_action', { toast: 'achievement', action: 'open_achievements', id: achievementToast?.id });
            onCloseAchievementToast();
            onOpenAchievements();
          }}
        >
          <Text style={styles.achievementIcon}>{achievementToast.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.achievementLabel}>
              🏆 ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО
            </Text>
            <Text style={styles.achievementName}>{achievementToast.name}</Text>
            <Text style={styles.achievementLore}>{achievementToast.lore}</Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onCloseAchievementToast();
            }}
            style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
          >
            <Text style={styles.achievementClose}>✕</Text>
          </Pressable>
        </Pressable>
      ) : null}

      {/* Header */}
      <View style={styles.header} onLayout={onHeaderLayout}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>◈ МММРДР · СОТ. №4,829,441 ◈</Text>
            <Text style={[styles.planetLine, { color: planet.color }]}>
              {planet.icon} {planet.name} · {planet.resource}
            </Text>
            <Text style={styles.energy}>
              {formatNum(energy)} <Text style={styles.energyUnit}>⚡</Text>
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerLabelRight}>ВСЕГО ДОБЫТО</Text>
            <Text style={styles.total}>{formatNum(totalEarned)}</Text>
            <Text style={styles.passive}>{formatNum(passiveRate)}/сек</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Pressable
            onPress={onOpenClickPowerInfo}
            style={[
              styles.statBox,
              {
                backgroundColor: 'rgba(255,200,0,0.06)',
                borderColor: 'rgba(255,200,0,0.13)'
              }
            ]}
          >
            <Text
              style={[styles.statText, { color: 'rgba(255,200,0,0.75)' }]}
            >{`+${clickPower < 1000 ? clickPower.toFixed(2) : formatNum(clickPower)}/клик`}</Text>
          </Pressable>
          <Pressable
            onPress={onOpenPassiveRateInfo}
            style={[
              styles.statBox,
              {
                backgroundColor: 'rgba(0,212,255,0.06)',
                borderColor: 'rgba(0,212,255,0.13)'
              }
            ]}
          >
            <Text
              style={[styles.statText, { color: 'rgba(0,212,255,0.75)' }]}
            >{`${formatNum(passiveRate)}/сек`}</Text>
          </Pressable>
          <Pressable
            onPress={onOpenPlanetBonusInfo}
            style={[
              styles.statBox,
              {
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.06)'
              }
            ]}
          >
            <Text style={[styles.statText, { color: planet.color }]}>
              ×{planet.bonus} бонус
            </Text>
          </Pressable>
        </View>

        {/* Metal inventory */}
        <View style={styles.metalsRow}>
          {METALS.filter((m) => discoveredMetals.includes(m.id)).map((m) => (
            <Pressable
              key={m.id}
              style={styles.metalItem}
              onPress={() => onOpenMetalInfo(m.id)}
            >
              <Image
                source={m.image}
                style={styles.metalIcon}
                resizeMode="contain"
              />
              <Text style={styles.metalCount}>{formatNum(metals[m.id] ?? 0)}</Text>
            </Pressable>
          ))}
        </View>

        {/* XP bar */}
        <View style={styles.xpRow}>
          <Text style={styles.xpLevel}>УР.{playerLevel}</Text>
          <View style={styles.xpBarBg}>
            <View
              style={[styles.xpBarFill, { width: `${xpPercent * 100}%` }]}
            />
          </View>
          <Text style={styles.xpTitle}>{getPlayerTitle(playerLevel)}</Text>
        </View>
      </View>

      {/* Floating action buttons */}
      {headerHeight > 0 && (
        <View style={[styles.floatingBtns, { top: headerHeight + 10 }]}>
          <Pressable
            onPress={onOpenResearch}
            style={({ pressed }) => [
              styles.floatingBtn,
              pressed ? { opacity: 0.7 } : null
            ]}
          >
            <Text style={styles.floatingBtnIcon}>🔬</Text>
            {hasAffordableResearch && <View style={styles.floatingBtnBadge} />}
          </Pressable>
          {achievementsUnlocked && (
            <Pressable
              onPress={onOpenAchievements}
              style={({ pressed }) => [
                styles.floatingBtn,
                pressed ? { opacity: 0.7 } : null
              ]}
            >
              <Text style={styles.floatingBtnIcon}>🏆</Text>
              {hasUnclaimedAchievements && (
                <View style={styles.floatingBtnBadge} />
              )}
            </Pressable>
          )}
          <Pressable
            onPress={onOpenStoryLog}
            style={({ pressed }) => [
              styles.floatingBtn,
              pressed ? { opacity: 0.7 } : null
            ]}
          >
            <Text style={styles.floatingBtnIcon}>📖</Text>
            {hasNewStoryEntry && <View style={styles.floatingBtnBadge} />}
          </Pressable>
        </View>
      )}

      {/* Level-up toast */}
      {levelUpToast ? (
        <View style={styles.levelUpToast}>
          <Text style={styles.levelUpIcon}>⬆️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.levelUpLabel}>НОВЫЙ УРОВЕНЬ</Text>
            <Text style={styles.levelUpLevel}>
              Уровень {levelUpToast} · {getPlayerTitle(levelUpToast)}
            </Text>
          </View>
          <Pressable
            onPress={onCloseLevelUpToast}
            style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
          >
            <Text style={styles.levelUpClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Main */}
      <View style={styles.main}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.asteroidPulseGlow,
            { transform: [{ scale: glowScale }] }
          ]}
        />
        <View style={styles.asteroidOrbitContainer}>
          <PassiveMiningFx passiveRate={passiveRate} mineColor={planet.color} />
        </View>
        <View
          ref={miningPlayAreaRef}
          style={styles.miningPlayArea}
          collapsable={false}
        >
          <AnimatedMineEffects
            trigger={tapState.count}
            origin={tapState.origin}
            clickPower={clickPower}
            mineColor={planet.color}
            style={styles.asteroidWrap}
          >
            <Pressable
              onPressIn={handlePressIn}
              style={({ pressed }) => [
                styles.asteroid,
                pressed ? { opacity: 0.92 } : null
              ]}
            >
              <Image
                source={planet.image}
                resizeMode="contain"
                style={styles.asteroidImage}
              />

              {showClickHint && (
                <View style={styles.asteroidCenter}>
                  <Text style={styles.asteroidIcon}>⛏️</Text>
                  <Text style={styles.clickHint}>КЛИКНИ</Text>
                </View>
              )}
            </Pressable>
          </AnimatedMineEffects>
        </View>

        <Text style={styles.hint}>◈ ДОБЫВАЙ {planet.resource} ◈</Text>

        {/* Metal drop floats */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.metalFloatOverlay]}
        >
          {metalFloats.map((f) => {
            const metal = METALS.find((m) => m.id === f.metalId)!;
            return (
              <Animated.View
                key={f.id}
                style={{
                  position: 'absolute',
                  opacity: f.opacity,
                  transform: [
                    { translateX: f.offsetX },
                    { translateY: f.translateY }
                  ],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <Image
                  source={metal.image}
                  style={styles.metalFloatIcon}
                  resizeMode="contain"
                />
                <Text style={styles.metalFloatText}>+{f.amount}</Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Clerk bubble */}
      {clerkMessage ? (
        <View style={styles.clerkBubble}>
          <Text style={styles.clerkIcon}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.clerkHeader}>
              КЛЕРК-7 · ИИ-АССИСТЕНТ МММРДР
            </Text>
            <Text style={styles.clerkText}>{clerkMessage}</Text>
          </View>
          <Pressable
            onPress={onCloseClerk}
            style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
          >
            <Text style={styles.clerkClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Character message bubble */}
      {characterMessage && chosenCharacter && !clerkMessage ? (
        <View style={[styles.characterBubble, { borderColor: CHARACTER_BORDER_COLORS[chosenCharacter.id] ?? 'rgba(255,200,80,0.35)' }]}>
          <Text style={styles.characterIcon}>{chosenCharacter.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.characterHeader, { color: CHARACTER_TEXT_COLORS[chosenCharacter.id] ?? 'rgba(255,200,80,0.7)' }]}>
              {chosenCharacter.name.toUpperCase()} · ВХОДЯЩЕЕ СООБЩЕНИЕ
            </Text>
            <Text style={[styles.characterText, { color: CHARACTER_TEXT_COLORS[chosenCharacter.id] ?? 'rgba(200,230,255,0.9)' }]}>
              {characterMessage}
            </Text>
          </View>
          <Pressable
            onPress={onCloseCharacterMessage}
            style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
          >
            <Text style={styles.clerkClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none'
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    zIndex: 0
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,20,60,0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.12)',
    zIndex: 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerLabel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.35)',
    letterSpacing: 3,
    marginBottom: 2,
    fontWeight: '800'
  },
  planetLine: {
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.85,
    marginBottom: 2,
    fontWeight: '800'
  },
  headerLabelRight: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    fontWeight: '800'
  },
  energy: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffd700',
    letterSpacing: 1,
    textShadowColor: 'rgba(255,200,0,0.45)',
    textShadowRadius: 20,
    lineHeight: 34
  },
  energyUnit: { fontSize: 12, opacity: 0.55, fontWeight: '800' },
  total: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(0,212,255,0.85)'
  },
  passive: {
    marginTop: 1,
    fontSize: 9,
    color: 'rgba(120,255,120,0.65)',
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 7
  },
  statBox: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center'
  },
  statText: {
    fontSize: 8,
    fontWeight: '800'
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
    zIndex: 2,
    height: 200
  },
  miningPlayArea: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 0,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  asteroidOrbitContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  asteroidOrbit: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)'
  },
  asteroidOrbitObject: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 10,
    top: -5,
    left: 145,
    backgroundColor: 'rgba(0,212,255,0.7)'
  },
  asteroidPulseGlow: {
    width: 80,
    height: 80,
    borderRadius: 80,
    position: 'absolute',
    backgroundColor: 'rgba(0,212,255,0.08)',
    shadowColor: 'rgba(0,212,255,0.5)',
    shadowOpacity: 1,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 0 }
  },
  asteroidWrap: {
    width: 170,
    height: 170,
    borderRadius: 85
  },
  asteroid: {
    flex: 1,
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  asteroidImage: {
    ...StyleSheet.absoluteFill,
    width: 170,
    height: 170
  },
  asteroidCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 20, 60, 0.55)',
    padding: 12,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
    userSelect: 'none'
  },
  asteroidIcon: {
    fontSize: 36,
    textShadowColor: 'rgba(255,200,0,0.5)',
    textShadowRadius: 12
  },
  clickHint: {
    marginTop: 4,
    fontSize: 9,
    color: 'rgba(255,200,0,0.7)',
    fontWeight: '800',
    letterSpacing: 3
  },
  vein: {
    position: 'absolute',
    width: 44,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,180,0,0.42)',
    shadowColor: 'rgba(255,180,0,0.6)',
    shadowOpacity: 1,
    shadowRadius: 8
  },
  vein2: {
    position: 'absolute',
    width: 26,
    height: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(0,212,255,0.38)',
    shadowColor: 'rgba(0,212,255,0.65)',
    shadowOpacity: 1,
    shadowRadius: 8
  },
  metalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
  },
  metalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metalIcon: { width: 18, height: 18 },
  metalCount: {
    fontSize: 10,
    color: 'rgba(255,220,100,0.75)',
    fontWeight: '700'
  },
  hint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 10,
    color: 'rgba(0,212,255,0.28)',
    letterSpacing: 3,
    fontWeight: '700'
  },
  clerkBubble: {
    position: 'absolute',
    bottom: 76,
    left: 10,
    right: 10,
    zIndex: 20,
    backgroundColor: 'rgba(4,16,45,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10 as any,
    alignItems: 'flex-start'
  },
  clerkIcon: { fontSize: 24, flexShrink: 0 },
  clerkHeader: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.55)',
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: '800'
  },
  clerkText: { fontSize: 11, color: 'rgba(200,230,255,0.9)', lineHeight: 18 },
  clerkClose: { fontSize: 14, color: 'rgba(0,212,255,0.35)' },
  characterBubble: {
    position: 'absolute',
    bottom: 76,
    left: 10,
    right: 10,
    zIndex: 20,
    backgroundColor: 'rgba(4,16,45,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,80,0.35)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  characterIcon: { fontSize: 24, flexShrink: 0 },
  characterHeader: {
    fontSize: 8,
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: '800',
  },
  characterText: { fontSize: 11, lineHeight: 18 },

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
    alignItems: 'center'
  },
  achievementIcon: { fontSize: 26 },
  achievementLabel: {
    fontSize: 8,
    color: 'rgba(255,180,0,0.7)',
    letterSpacing: 2,
    fontWeight: '900',
    marginBottom: 2
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffd700',
    marginTop: 2
  },
  achievementLore: {
    fontSize: 10,
    color: 'rgba(255,200,100,0.65)',
    marginTop: 2,
    lineHeight: 16,
    fontWeight: '700'
  },
  achievementClose: { fontSize: 14, color: 'rgba(0,212,255,0.35)', padding: 6 },

  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6
  },
  xpLevel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.6)',
    fontWeight: '900',
    letterSpacing: 0.5,
    minWidth: 30
  },
  xpBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden'
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(0,212,255,0.6)'
  },
  xpTitle: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.35)',
    fontWeight: '700',
    letterSpacing: 0.3
  },

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
    alignItems: 'center'
  },
  levelUpIcon: { fontSize: 26 },
  levelUpLabel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.7)',
    letterSpacing: 2,
    fontWeight: '900',
    marginBottom: 2
  },
  levelUpLevel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00d4ff',
    marginTop: 2
  },
  levelUpClose: { fontSize: 14, color: 'rgba(0,212,255,0.35)', padding: 6 },

  floatingBtns: {
    position: 'absolute',
    left: 10,
    flexDirection: 'column',
    gap: 6 as any,
    zIndex: 5
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
    position: 'relative'
  },
  floatingBtnIcon: { fontSize: 16 },
  floatingBtnBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff3b3b'
  },
  metalFloatOverlay: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  metalFloatIcon: { width: 16, height: 16 },
  metalFloatText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffd700',
    textShadowColor: 'rgba(255,200,0,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8
  }
});
