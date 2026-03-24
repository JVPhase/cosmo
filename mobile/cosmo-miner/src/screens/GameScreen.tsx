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
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { AnimatedMineEffects } from '../ui/AnimatedMineEffects';
import { Popup } from '../ui/Popup';
import { formatNum } from '../game/formatNum';
import { METALS, type MetalId } from '../game/METALS';
import { SHIPS } from '../game/SHIPS';

const ironMetal = METALS.find((m) => m.id === 'iron')!;
import type { PlanetDefinition } from '../game/PLANETS';
import { getPlayerTitle, xpAtLevelStart, xpForNextLevel } from '../game/PLAYER';
import type { MetalsState } from '../game/types';

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
  firstIronToast: boolean;
  onCloseFirstIronToast: () => void;
  onOpenResearch: () => void;
  onOpenAchievements: () => void;
  achievementsUnlocked: boolean;
  achievementsUnlockToast: boolean;
  onCloseAchievementsUnlockToast: () => void;
  upgradesUnlockToast: boolean;
  onCloseUpgradesUnlockToast: () => void;
  currentUnlockToast: { title: string; text: string; image?: number; headerEmoji?: string } | null;
  onDismissUnlockToast: () => void;
  firstShipToast: boolean;
  onCloseFirstShipToast: () => void;
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
  firstIronToast,
  onCloseFirstIronToast,
  onOpenResearch,
  onOpenAchievements,
  achievementsUnlocked,
  achievementsUnlockToast,
  onCloseAchievementsUnlockToast,
  upgradesUnlockToast,
  onCloseUpgradesUnlockToast,
  currentUnlockToast,
  onDismissUnlockToast,
  firstShipToast,
  onCloseFirstShipToast,
}: GameScreenProps) {
  const xpStart = xpAtLevelStart(playerLevel);
  const xpNext = xpForNextLevel(playerLevel);
  const xpPercent = xpNext !== null ? Math.min(1, (playerXP - xpStart) / (xpNext - xpStart)) : 1;
  const [trigger, setTrigger] = useState(0);
  const [origin, setOrigin] = useState<Point | undefined>(undefined);
  const [headerHeight, setHeaderHeight] = useState(0);
  const onHeaderLayout = (e: LayoutChangeEvent) => setHeaderHeight(e.nativeEvent.layout.height);
  const [ironInfoOpen, setIronInfoOpen] = useState(false);
  const [showClickHint, setShowClickHint] = useState(true);
  const miningPlayAreaRef = useRef<View>(null);
  const lastClickRef = useRef<number | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMetalsRef = useRef<MetalsState>(metals);
  const metalFloatIdRef = useRef(0);
  const [metalFloats, setMetalFloats] = useState<MetalFloat[]>([]);
  const glowScale = useRef(new Animated.Value(1)).current;
  const orbitRotation = useRef(new Animated.Value(0)).current;
  const orbitRotate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stars = useMemo(() => {
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 0.6,
      opacity: Math.random() * 0.6 + 0.25,
    }));
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.14,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
      glowScale.stopAnimation();
    };
  }, [glowScale]);

  useEffect(() => {
    const spin = Animated.loop(
      Animated.sequence([
        Animated.timing(orbitRotation, {
          toValue: 0,
          duration: 0,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(orbitRotation, {
          toValue: 1,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    orbitRotation.setValue(0);
    spin.start();

    return () => {
      spin.stop();
      orbitRotation.stopAnimation();
    };
  }, [orbitRotation]);

  const handlePressIn = (e: GestureResponderEvent) => {
    const nativeEvent = e.nativeEvent as unknown as {
      locationX?: number;
      locationY?: number;
      pageX?: number;
      pageY?: number;
    };

    const commitTap = (x: number, y: number) => {
      setOrigin({ x, y });
      setTrigger((t) => t + 1);
      onMine();
    };

    if (Platform.OS === 'web' && miningPlayAreaRef.current) {
      miningPlayAreaRef.current.measureInWindow((mx, my) => {
        commitTap(
          (nativeEvent.pageX ?? 0) - mx,
          (nativeEvent.pageY ?? 0) - my,
        );
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
  };

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
        Animated.timing(translateY, { toValue: -175, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]).start();

      return { id: ++metalFloatIdRef.current, born: now, metalId: d.metalId, amount: d.amount, offsetX, translateY, opacity };
    });

    setMetalFloats((prev) => [...prev, ...newFloats]);

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
              opacity: s.opacity,
            },
          ]}
        />
      ))}

      {/* Achievement toast */}
      {achievementToast ? (
        <View style={styles.achievementToast}>
          <Text style={styles.achievementIcon}>{achievementToast.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.achievementLabel}>
              🏆 ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО
            </Text>
            <Text style={styles.achievementName}>{achievementToast.name}</Text>
            <Text style={styles.achievementLore}>{achievementToast.lore}</Text>
          </View>
          <Pressable
            onPress={onCloseAchievementToast}
            style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
          >
            <Text style={styles.achievementClose}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Header */}
      <View style={styles.header} onLayout={onHeaderLayout}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>◈ МГМР · СОТ. №4,829,441 ◈</Text>
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
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: 'rgba(255,200,0,0.06)',
                borderColor: 'rgba(255,200,0,0.13)',
              },
            ]}
          >
            <Text
              style={[styles.statText, { color: 'rgba(255,200,0,0.75)' }]}
            >{`+${clickPower < 1000 ? clickPower.toFixed(2) : formatNum(clickPower)}/клик`}</Text>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: 'rgba(0,212,255,0.06)',
                borderColor: 'rgba(0,212,255,0.13)',
              },
            ]}
          >
            <Text
              style={[styles.statText, { color: 'rgba(0,212,255,0.75)' }]}
            >{`${formatNum(passiveRate)}/сек`}</Text>
          </View>
          <View
            style={[
              styles.statBox,
              {
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.06)',
              },
            ]}
          >
            <Text style={[styles.statText, { color: planet.color }]}>
              ×{planet.bonus} бонус
            </Text>
          </View>
        </View>

        {/* Metal inventory */}
        <View style={styles.metalsRow}>
          {METALS.filter((m) => discoveredMetals.includes(m.id)).map((m) => (
            <Pressable
              key={m.id}
              style={styles.metalItem}
              onPress={m.id === 'iron' ? () => setIronInfoOpen(true) : undefined}
            >
              <Image source={m.image} style={styles.metalIcon} resizeMode="contain" />
              <Text style={styles.metalCount}>{metals[m.id] ?? 0}</Text>
            </Pressable>
          ))}
        </View>

        {/* XP bar */}
        <View style={styles.xpRow}>
          <Text style={styles.xpLevel}>УР.{playerLevel}</Text>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercent * 100}%` }]} />
          </View>
          <Text style={styles.xpTitle}>{getPlayerTitle(playerLevel)}</Text>
        </View>
      </View>

      {/* Floating action buttons */}
      {headerHeight > 0 && (
        <View style={[styles.floatingBtns, { top: headerHeight + 10 }]}>
          <Pressable
            onPress={onOpenResearch}
            style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
          >
            <Text style={styles.floatingBtnIcon}>🔬</Text>
          </Pressable>
          {achievementsUnlocked && (
            <Pressable
              onPress={onOpenAchievements}
              style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
            >
              <Text style={styles.floatingBtnIcon}>🏆</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Level-up toast */}
      {levelUpToast ? (
        <View style={styles.levelUpToast}>
          <Text style={styles.levelUpIcon}>⬆️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.levelUpLabel}>НОВЫЙ УРОВЕНЬ</Text>
            <Text style={styles.levelUpLevel}>Уровень {levelUpToast} · {getPlayerTitle(levelUpToast)}</Text>
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
            { transform: [{ scale: glowScale }] },
          ]}
        />
        <View style={styles.asteroidOrbitContainer}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.asteroidOrbit,
              {
                transform: [{ rotate: orbitRotate }],
              },
            ]}
          >
            <View style={styles.asteroidOrbitObject} />
          </Animated.View>
        </View>
        <View ref={miningPlayAreaRef} style={styles.miningPlayArea} collapsable={false}>
          <AnimatedMineEffects
            trigger={trigger}
            origin={origin}
            clickPower={clickPower}
            mineColor={planet.color}
            style={styles.asteroidWrap}
          >
            <Pressable
              onPressIn={handlePressIn}
              style={({ pressed }) => [
                styles.asteroid,
                pressed ? { opacity: 0.92 } : null,
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
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.metalFloatOverlay]}>
          {metalFloats.map((f) => {
            const metal = METALS.find((m) => m.id === f.metalId)!;
            return (
              <Animated.View
                key={f.id}
                style={{
                  position: 'absolute',
                  opacity: f.opacity,
                  transform: [{ translateX: f.offsetX }, { translateY: f.translateY }],
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Image source={metal.image} style={styles.metalFloatIcon} resizeMode="contain" />
                <Text style={styles.metalFloatText}>+{f.amount}</Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <Popup
        visible={firstIronToast}
        title="◈ ПЕРВАЯ НАХОДКА · КЛЕРК-7 ◈"
        onClose={onCloseFirstIronToast}
        image={ironMetal.image}
        text={'Зафиксирован первый образец Железа™! За эту выдающуюся находку вам полагается премия — после заполнения форм ЖЛ-1 по ЖЛ-83, нотариально заверенного снимка астероида и справки с предыдущего места работы. P.S. Этот металл может пригодиться. Возможно.'}
        clerk
      />

      <Popup
        visible={achievementsUnlockToast}
        title="◈ СИСТЕМА ДОСТИЖЕНИЙ · КЛЕРК-7 ◈"
        onClose={onCloseAchievementsUnlockToast}
        text={'Хочу вас подбодрить. Серьёзно. Поэтому внедряю систему достижений — специально для вас.\n\nКаждое достижение будет официально зафиксировано в личном деле. Форма ДСТ-1 уже направлена в архив в трёх экземплярах.\n\nТак держать, сотрудник №4,829,441. Вы справляетесь. Почти.'}
        clerk
        headerEmoji="🏆"
      />

      <Popup
        visible={upgradesUnlockToast}
        title="◈ АПГРЕЙДЫ ДОСТУПНЫ · КЛЕРК-7 ◈"
        onClose={onCloseUpgradesUnlockToast}
        text={'Поздравляю — у вас достаточно энергии для первого улучшения оборудования!\n\nАпгрейды повышают мощность добычи и пассивный доход. Настоятельно рекомендую вкладывать всё, что есть.\n\nФорма АПГ-1 «Заявка на улучшение» заполнена автоматически. Можете не благодарить.'}
        clerk
        headerEmoji="⚡"
      />

      <Popup
        visible={ironInfoOpen}
        title="◈ ЖЕЛЕЗО™ · КЛЕРК-7 ◈"
        onClose={() => setIronInfoOpen(false)}
        image={ironMetal.image}
        text={'Железо — базовый промышленный металл. Добывайте его как можно больше.\n\nПо регламенту МГМР, минимальная норма сбора не установлена. Это не значит, что её нет — просто форма МН-2 «Установление нормы» находится на согласовании с 2341 года.\n\nВывод: добывайте. Много. Пока не спросили.'}
        clerk
      />

      <Popup
        visible={!!currentUnlockToast}
        title={currentUnlockToast?.title ?? ""}
        onClose={onDismissUnlockToast}
        image={currentUnlockToast?.image}
        text={currentUnlockToast?.text ?? ""}
        headerEmoji={currentUnlockToast?.headerEmoji}
        clerk
      />

      <Popup
        visible={firstShipToast}
        title="◈ ПЕРВЫЙ КОРАБЛЬ · КЛЕРК-7 ◈"
        onClose={onCloseFirstShipToast}
        image={SHIPS[0].image}
        text={'Поздравляю с постройкой первого корабля!\n\nОднако для навигации необходимы данные из реестра МГМР. Министерство готово их предоставить — как только вы выйдете на связь. Для этого потребуется 10 000 единиц энергии. Форма НВГ-1 «Запрос навигационных данных» будет заполнена автоматически.'}
        clerk
        headerEmoji="🚀"
      />

      {/* Clerk bubble */}
      {clerkMessage ? (
        <View style={styles.clerkBubble}>
          <Text style={styles.clerkIcon}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.clerkHeader}>КЛЕРК-7 · ИИ-АССИСТЕНТ МГМР</Text>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    zIndex: 0,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,20,60,0.55)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.12)',
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLabel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.35)',
    letterSpacing: 3,
    marginBottom: 2,
    fontWeight: '800',
  },
  planetLine: {
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.85,
    marginBottom: 2,
    fontWeight: '800',
  },
  headerLabelRight: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    fontWeight: '800',
  },
  energy: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffd700',
    letterSpacing: 1,
    textShadowColor: 'rgba(255,200,0,0.45)',
    textShadowRadius: 20,
    lineHeight: 34,
  },
  energyUnit: { fontSize: 12, opacity: 0.55, fontWeight: '800' },
  total: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(0,212,255,0.85)',
  },
  passive: {
    marginTop: 1,
    fontSize: 9,
    color: 'rgba(120,255,120,0.65)',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 7,
  },
  statBox: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  statText: {
    fontSize: 8,
    fontWeight: '800',
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
    zIndex: 2,
    height: 200,
  },
  miningPlayArea: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 0,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  asteroidOrbitContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  asteroidOrbit: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
  },
  asteroidOrbitObject: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 10,
    top: -5,
    left: 145,
    backgroundColor: 'rgba(0,212,255,0.7)',
  },
  asteroidPulseGlow: {
    width: 100,
    height: 100,
    borderRadius: 100,
    position: 'absolute',
    backgroundColor: 'rgba(0,212,255,0.08)',
    shadowColor: 'rgba(0,212,255,0.5)',
    shadowOpacity: 1,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 0 },
  },
  asteroidWrap: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  asteroid: {
    flex: 1,
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  asteroidImage: {
    ...StyleSheet.absoluteFill,
    width: 170,
    height: 170,
  },
  asteroidCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 20, 60, 0.55)',
    padding: 12,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.12)',
    userSelect: 'none',
  },
  asteroidIcon: {
    fontSize: 36,
    textShadowColor: 'rgba(255,200,0,0.5)',
    textShadowRadius: 12,
  },
  clickHint: {
    marginTop: 4,
    fontSize: 9,
    color: 'rgba(255,200,0,0.7)',
    fontWeight: '800',
    letterSpacing: 3,
  },
  vein: {
    position: 'absolute',
    width: 44,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,180,0,0.42)',
    shadowColor: 'rgba(255,180,0,0.6)',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  vein2: {
    position: 'absolute',
    width: 26,
    height: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(0,212,255,0.38)',
    shadowColor: 'rgba(0,212,255,0.65)',
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  metalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  metalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metalIcon: { width: 18, height: 18 },
  metalCount: {
    fontSize: 10,
    color: 'rgba(255,220,100,0.75)',
    fontWeight: '700',
  },
  hint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 10,
    color: 'rgba(0,212,255,0.28)',
    letterSpacing: 3,
    fontWeight: '700',
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
    alignItems: 'flex-start',
  },
  clerkIcon: { fontSize: 24, flexShrink: 0 },
  clerkHeader: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.55)',
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: '800',
  },
  clerkText: { fontSize: 11, color: 'rgba(200,230,255,0.9)', lineHeight: 18 },
  clerkClose: { fontSize: 14, color: 'rgba(0,212,255,0.35)' },

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

  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  xpLevel: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.6)',
    fontWeight: '900',
    letterSpacing: 0.5,
    minWidth: 30,
  },
  xpBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(0,212,255,0.6)',
  },
  xpTitle: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.35)',
    fontWeight: '700',
    letterSpacing: 0.3,
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
  },
  floatingBtnIcon: { fontSize: 16 },
  metalFloatOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metalFloatIcon: { width: 16, height: 16 },
  metalFloatText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffd700',
    textShadowColor: 'rgba(255,200,0,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
