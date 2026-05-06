import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { formatNum } from '../game/formatNum';
import { t } from '../game/i18n';
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
import type { SupportedLocale } from '../ui/LocalePickerOverlay';

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
  onChangeLocale: (locale: SupportedLocale) => Promise<void> | void;
};

export function GameScreen({
  energy: _energy,
  totalEarned: _totalEarned,
  clickPower,
  passiveRate,
  metals,
  discoveredMetals: _discoveredMetals,
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
  onOpenMetalInfo: _onOpenMetalInfo,
  onOpenStoryLog,
  hasNewStoryEntry,
  onOpenPrestige,
  isPrestigeAvailable,
  prestigeCount,
  hasUnreadChannelMessage,
  chosenCharacter,
  onOpenCharacterChannel,
  characterChannelUnlocked,
  onChangeLocale,
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
      return {
        id: ++metalFloatIdRef.current,
        born: now,
        metalId: d.metalId,
        amount: d.amount,
        offsetX,
      };
    });

    setMetalFloats((prev) => [...prev, ...newFloats].slice(-6));
    setTimeout(() => {
      const t = Date.now();
      setMetalFloats((prev) => prev.filter((f) => t - f.born < 1100));
    }, 1100);
  }, [metals]);

  return (
    <View style={styles.screen}>
      <AchievementToast
        toast={achievementToast}
        onClose={onCloseAchievementToast}
        onOpenAchievements={onOpenAchievements}
      />

      <GameHeader
        playerLevel={playerLevel}
        playerXP={playerXP}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />

      <Text style={styles.planetTitle}>{planet.name}</Text>

      <FloatingActionButtons
        headerHeight={headerHeight}
        hasAffordableResearch={hasAffordableResearch}
        onOpenResearch={onOpenResearch}
        achievementsUnlocked={achievementsUnlocked}
        hasUnclaimedAchievements={hasUnclaimedAchievements}
        onOpenAchievements={onOpenAchievements}
        onOpenStoryLog={onOpenStoryLog}
        hasNewStoryEntry={hasNewStoryEntry}
        onChangeLocale={onChangeLocale}
      />

      <CharacterChannelButton
        headerHeight={headerHeight}
        characterChannelUnlocked={characterChannelUnlocked}
        chosenCharacter={chosenCharacter}
        hasUnreadChannelMessage={hasUnreadChannelMessage}
        onOpenCharacterChannel={onOpenCharacterChannel}
        onOpenPrestige={onOpenPrestige}
        isPrestigeAvailable={isPrestigeAvailable}
        prestigeCount={prestigeCount}
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

      <View style={styles.bottomStats}>
        <Pressable onPress={onOpenClickPowerInfo} style={styles.statChip}>
          <Text style={styles.statChipLabel}>{t('ui.game_header.click_label') || 'КЛИК'}</Text>
          <Text style={styles.statChipValue}>+{formatNum(clickPower)} ⚡</Text>
        </Pressable>
        <Pressable onPress={onOpenPassiveRateInfo} style={styles.statChip}>
          <Text style={styles.statChipLabel}>{t('ui.game_header.passive_label') || 'ПАССИВ'}</Text>
          <Text style={styles.statChipValue}>+{formatNum(passiveRate)}{t('ui.game_header.per_sec') || '/с'} ⚡</Text>
        </Pressable>
      </View>

      <ClerkBubble message={clerkMessage} onClose={onCloseClerk} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
  },
  planetTitle: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 3,
    marginTop: 6,
    zIndex: 2,
  },
  bottomStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24 as any,
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 4,
    zIndex: 2,
  },
  statChip: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2 as any,
  },
  statChipLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: 'rgba(0,212,255,0.4)',
    letterSpacing: 2,
  },
  statChipValue: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.8)',
  },
});
