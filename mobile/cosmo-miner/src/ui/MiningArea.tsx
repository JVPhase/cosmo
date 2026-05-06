import React, { useMemo } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  StyleSheet,
} from 'react-native';
import { AnimatedMineEffects } from './AnimatedMineEffects';
import type { MetalFloatRenderItem } from './animatedMineEffectsShared';
import { t } from '../game/i18n';
import type { MetalId } from '../game/METALS';
import type { PlanetDefinition } from '../game/PLANETS';

type MetalDefinition = {
  id: MetalId;
  image: number;
};

export type MetalFloat = {
  id: number;
  born: number;
  metalId: MetalId;
  amount: number;
  offsetX: number;
};

export type TapState = { count: number; origin?: { x: number; y: number } };

export type MiningAreaProps = {
  planet: PlanetDefinition;
  passiveRate: number;
  clickPower: number;
  tapState: TapState;
  handlePressIn: (e: GestureResponderEvent) => void;
  showClickHint: boolean;
  miningPlayAreaRef: React.RefObject<View | null>;
  metalFloats: MetalFloat[];
  glowScale: Animated.Value;
  METALS: readonly MetalDefinition[];
};

export function MiningArea({
  planet,
  passiveRate,
  clickPower,
  tapState,
  handlePressIn,
  showClickHint,
  miningPlayAreaRef,
  metalFloats,
  glowScale,
  METALS,
}: MiningAreaProps) {
  const metalImageById = useMemo(() => {
    const map: Partial<Record<MetalId, number>> = {};
    for (const m of METALS) map[m.id] = m.image;
    return map;
  }, [METALS]);

  const metalFloatsForFx = useMemo<MetalFloatRenderItem[]>(() => {
    const fallbackImage = METALS[0]?.image ?? 0;
    return metalFloats.map((f) => ({
      id: f.id,
      born: f.born,
      amount: f.amount,
      offsetX: f.offsetX,
      image: metalImageById[f.metalId] ?? fallbackImage,
    }));
  }, [metalFloats, metalImageById, METALS]);

  return (
    <View style={styles.main}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.asteroidPulseGlow,
          { transform: [{ scale: glowScale }] },
        ]}
      />
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
          passiveRate={passiveRate}
          planetImage={planet.image}
          metalFloats={metalFloatsForFx}
          style={styles.asteroidWrap}
        >
          <Pressable
            onPressIn={handlePressIn}
            style={({ pressed }) => [
              styles.asteroid,
              pressed ? { opacity: 0.92 } : null,
            ]}
          >
            {showClickHint && (
              <View style={styles.asteroidCenter}>
                <Text style={styles.asteroidIcon}>⛏️</Text>
                <Text style={styles.clickHint}>
                  {t('ui.mining.click_hint')}
                </Text>
              </View>
            )}
          </Pressable>
        </AnimatedMineEffects>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  asteroidPulseGlow: {
    width: 80,
    height: 80,
    borderRadius: 80,
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
  asteroidCenter: {
    width: 90,
    height: 90,
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
  hint: {
    position: 'absolute',
    bottom: 20,
    fontSize: 10,
    color: 'rgba(0,212,255,0.28)',
    letterSpacing: 3,
    fontWeight: '700',
  },
});
