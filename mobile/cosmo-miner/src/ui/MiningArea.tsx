import React from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { AnimatedMineEffects } from './AnimatedMineEffects';
import { PassiveMiningFx } from './PassiveMiningFx';
import { t } from '../game/i18n';
import type { MetalId } from '../game/METALS';
import type { PlanetDefinition } from '../game/PLANETS';

type MetalDefinition = {
  id: MetalId;
  image: any;
};

export type MetalFloat = {
  id: number;
  born: number;
  metalId: MetalId;
  amount: number;
  offsetX: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
};

export type TapState = { count: number; origin?: { x: number; y: number } };

export type MiningAreaProps = {
  planet: PlanetDefinition;
  passiveRate: number;
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
  tapState,
  handlePressIn,
  showClickHint,
  miningPlayAreaRef,
  metalFloats,
  glowScale,
  METALS,
}: MiningAreaProps) {
  return (
    <View style={styles.main}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.asteroidPulseGlow,
          { transform: [{ scale: glowScale }] },
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
          clickPower={1}
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
                <Text style={styles.clickHint}>
                  {t('ui.mining.click_hint')}
                </Text>
              </View>
            )}
          </Pressable>
        </AnimatedMineEffects>
      </View>

      <Text style={styles.hint}>
        {t('ui.mining.hint')}
      </Text>

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
                  { translateY: f.translateY },
                ],
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
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
  asteroidOrbitContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
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
  asteroidImage: {
    ...StyleSheet.absoluteFill,
    width: 170,
    height: 170,
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
