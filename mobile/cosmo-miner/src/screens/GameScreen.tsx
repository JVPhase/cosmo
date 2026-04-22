import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { getMetals, type MetalId } from '../game/METALS';
import type { PlanetDefinition } from '../game/PLANETS';
import type { MetalsState } from '../game/types';
import { AchievementToast } from '../ui/AchievementToast';
import { CharacterChannelButton } from '../ui/CharacterChannelButton';
import { ClerkBubble } from '../ui/ClerkBubble';
import { FloatingActionButtons } from '../ui/FloatingActionButtons';
import { GameHeader } from '../ui/GameHeader';
import { LevelUpToast } from '../ui/LevelUpToast';
import { MiningArea, type MetalFloat, type TapState } from '../ui/MiningArea';

export type GameScreenProps = {
  energy: number;
  totalEarned: number;
  clickPower: number;
  passiveRate: number;
  metals: MetalsState;
  discoveredMetals: MetalId[];
  onMine: () => void;
  planet: PlanetDefinition;
  clerkMessage: string | null;
  onCloseClerk: () => void;
  achievementToast: {
    id: number;
    nameKey: string;
    icon: string;
    loreKey: string;
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
  onOpenMetalInfo: (metalId: MetalId) => void;
  onOpenStoryLog: () => void;
  hasNewStoryEntry: boolean;
  onOpenPrestige: () => void;
  isPrestigeAvailable: boolean;
  prestigeCount: number;
  hasUnreadChannelMessage: boolean;
  chosenCharacter: { id: string; name: string; icon: string } | null;
  onOpenCharacterChannel: () => void;
  characterChannelUnlocked: boolean;
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
  onOpenMetalInfo,
  onOpenStoryLog,
  hasNewStoryEntry,
  onOpenPrestige,
  isPrestigeAvailable,
  prestigeCount,
  hasUnreadChannelMessage,
  chosenCharacter,
  onOpenCharacterChannel,
  characterChannelUnlocked,
}: GameScreenProps) {
  const METALS = getMetals();
  const [tapState, setTapState] = useState<TapState>({ count: 0 });
  const [headerHeight, setHeaderHeight] = useState(0);
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
      opacity: Math.random() * 0.6 + 0.25,
    }));
  }, []);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.14, duration: 1100, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
      glowScale.stopAnimation();
    };
  }, [glowScale]);

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
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
    },
    [onMine]
  );

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

    setMetalFloats((prev) => [...prev, ...newFloats].slice(-6));
    setTimeout(() => {
      const t = Date.now();
      setMetalFloats((prev) => prev.filter((f) => t - f.born < 1100));
    }, 1100);
  }, [metals]);

  return (
    <LinearGradient colors={['#050918', '#0a1628', '#061020']} style={styles.screen}>
      {stars.map((s) => (
        <View
          key={s.id}
          style={[styles.star, { top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, opacity: s.opacity }]}
        />
      ))}

      <AchievementToast
        toast={achievementToast}
        onClose={onCloseAchievementToast}
        onOpenAchievements={onOpenAchievements}
      />

      <GameHeader
        energy={energy}
        totalEarned={totalEarned}
        clickPower={clickPower}
        passiveRate={passiveRate}
        metals={metals}
        discoveredMetals={discoveredMetals}
        planet={planet}
        playerLevel={playerLevel}
        playerXP={playerXP}
        onOpenClickPowerInfo={onOpenClickPowerInfo}
        onOpenPassiveRateInfo={onOpenPassiveRateInfo}
        onOpenMetalInfo={onOpenMetalInfo}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />

      <FloatingActionButtons
        headerHeight={headerHeight}
        hasAffordableResearch={hasAffordableResearch}
        onOpenResearch={onOpenResearch}
        achievementsUnlocked={achievementsUnlocked}
        hasUnclaimedAchievements={hasUnclaimedAchievements}
        onOpenAchievements={onOpenAchievements}
        onOpenStoryLog={onOpenStoryLog}
        hasNewStoryEntry={hasNewStoryEntry}
        onOpenPrestige={onOpenPrestige}
        isPrestigeAvailable={isPrestigeAvailable}
        prestigeCount={prestigeCount}
      />

      <CharacterChannelButton
        headerHeight={headerHeight}
        characterChannelUnlocked={characterChannelUnlocked}
        chosenCharacter={chosenCharacter}
        hasUnreadChannelMessage={hasUnreadChannelMessage}
        onOpenCharacterChannel={onOpenCharacterChannel}
      />

      <LevelUpToast levelUpToast={levelUpToast} onClose={onCloseLevelUpToast} />

      <MiningArea
        planet={planet}
        passiveRate={passiveRate}
        clickPower={clickPower}
        tapState={tapState}
        handlePressIn={handlePressIn}
        showClickHint={showClickHint}
        miningPlayAreaRef={miningPlayAreaRef}
        metalFloats={metalFloats}
        glowScale={glowScale}
        METALS={METALS}
      />

      <ClerkBubble message={clerkMessage} onClose={onCloseClerk} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    zIndex: 0,
  },
});
