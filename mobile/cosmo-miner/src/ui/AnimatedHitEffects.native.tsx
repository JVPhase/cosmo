import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { formatNum } from '../game/formatNum';
import type { AnimatedHitEffectsProps } from './animatedHitEffectsShared';

export type { AnimatedHitEffectsProps } from './animatedHitEffectsShared';

type Ripple = {
  id: number;
  born: number;
  ox: number;
  oy: number;
  scaleTo: number;
  delay: number;
  color: string;
};

type FloatDmg = {
  id: number;
  born: number;
  value: number;
  ox: number;
  oy: number;
  driftX: number;
};

type HitLayers = {
  ripples: Ripple[];
  floats: FloatDmg[];
};

const MAX_RIPPLES = 3;
const MAX_FLOATS = 3;
const RIPPLE_COLOR = '#ff4400';
const CANVAS_OVERFLOW = 150;
const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

function SvgRipple({
  ox,
  oy,
  scaleTo,
  delay,
  color,
}: Pick<Ripple, 'ox' | 'oy' | 'scaleTo' | 'delay' | 'color'>) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) }),
    );
  }, [progress, delay]);

  const animatedProps = useAnimatedProps(() => ({
    r: 26 * scaleTo * progress.value,
    opacity: 0.9 * (1 - progress.value),
  }));

  return (
    <AnimatedSvgCircle
      cx={ox}
      cy={oy}
      stroke={color}
      strokeWidth={2}
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

function FloatDmgLabel({
  floatId,
  ox,
  oy,
  value,
  driftX,
}: {
  floatId: number;
  ox: number;
  oy: number;
  value: number;
  driftX: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 820,
      easing: Easing.out(Easing.quad),
    });
  }, [floatId, progress]);

  const text = `⚔️ ${formatNum(value)}`;
  const animatedProps = useAnimatedProps(() => {
    const p = progress.value;
    const yOffset =
      p < 0.15 ? -20 * (p / 0.15) : -20 - 60 * ((p - 0.15) / 0.85);
    const xOffset = p < 0.15 ? 0 : driftX * ((p - 0.15) / 0.85);
    const opacity = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88;
    const scale =
      p < 0.15 ? 0.5 + 0.8 * (p / 0.15) : 1.3 - 0.4 * ((p - 0.15) / 0.85);
    return {
      x: ox + xOffset,
      y: oy + yOffset,
      opacity: Math.max(0, Math.min(1, opacity)),
      fontSize: 17 * scale,
    };
  });

  return (
    <>
      <AnimatedSvgText
        fill="none"
        stroke="rgba(255,100,0,0.9)"
        strokeWidth={1.8}
        fontWeight="900"
        textAnchor="middle"
        alignmentBaseline="middle"
        animatedProps={animatedProps}
      >
        {text}
      </AnimatedSvgText>
      <AnimatedSvgText
        fill="#ff4400"
        fontWeight="900"
        textAnchor="middle"
        alignmentBaseline="middle"
        animatedProps={animatedProps}
      >
        {text}
      </AnimatedSvgText>
    </>
  );
}

function AnimatedHitLayers({
  ripples,
  floats,
}: {
  ripples: Ripple[];
  floats: FloatDmg[];
}) {
  return (
    <Svg width="100%" height="100%">
      {ripples.map((r) => (
        <SvgRipple
          key={r.id}
          ox={r.ox + CANVAS_OVERFLOW}
          oy={r.oy + CANVAS_OVERFLOW}
          scaleTo={r.scaleTo}
          delay={r.delay}
          color={r.color}
        />
      ))}
      {floats.map((f) => (
        <FloatDmgLabel
          key={f.id}
          floatId={f.id}
          ox={f.ox + CANVAS_OVERFLOW}
          oy={f.oy + CANVAS_OVERFLOW}
          value={f.value}
          driftX={f.driftX}
        />
      ))}
    </Svg>
  );
}

export function AnimatedHitEffects({
  trigger,
  origin,
  damage,
  style,
  children,
  skillRing: _skillRing,
  healEffect: _healEffect,
}: AnimatedHitEffectsProps) {
  const pulseScale = useSharedValue(1);
  const rippleIdRef = useRef(0);
  const floatIdRef = useRef(0);

  const [layers, setLayers] = useState<HitLayers>({ ripples: [], floats: [] });
  const { ripples, floats } = layers;

  const originMemo = useMemo(
    () => (origin ? { x: origin.x, y: origin.y } : undefined),
    [origin?.x, origin?.y],
  );

  useEffect(() => {
    pulseScale.value = 1;
    pulseScale.value = withSequence(
      withTiming(1.06, { duration: 80 }),
      withTiming(0.97, { duration: 80 }),
      withTiming(1, { duration: 140 }),
    );
  }, [trigger, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    if (trigger === 0 || !originMemo) return;

    const now = Date.now();
    const x0 = originMemo.x;
    const y0 = originMemo.y;

    const newRipples: Ripple[] = [
      {
        id: ++rippleIdRef.current,
        born: now,
        ox: x0,
        oy: y0,
        scaleTo: 3.7,
        delay: 0,
        color: RIPPLE_COLOR,
      },
    ];

    const driftX = (Math.random() - 0.5) * 30;
    const newFloat: FloatDmg = {
      id: ++floatIdRef.current,
      born: now,
      value: damage,
      ox: x0,
      oy: y0,
      driftX,
    };

    setLayers((prev) => ({
      ripples: [...prev.ripples, ...newRipples].slice(-MAX_RIPPLES),
      floats: [...prev.floats, newFloat].slice(-MAX_FLOATS),
    }));

    const ttl = 900;
    const t = setTimeout(() => {
      const cutoff = Date.now();
      setLayers((prev) => ({
        ripples: prev.ripples.filter((r) => cutoff - r.born < ttl),
        floats: prev.floats.filter((f) => cutoff - f.born < ttl),
      }));
    }, ttl);
    return () => clearTimeout(t);
  }, [trigger, originMemo, damage]);

  return (
    <Animated.View style={[style, pulseStyle, styles.root]}>
      {children}

      <View pointerEvents="none" style={styles.overflowCanvas}>
        <AnimatedHitLayers ripples={ripples} floats={floats} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'visible',
  },
  overflowCanvas: {
    position: 'absolute',
    top: -CANVAS_OVERFLOW,
    left: -CANVAS_OVERFLOW,
    right: -CANVAS_OVERFLOW,
    bottom: -CANVAS_OVERFLOW,
  },
});
