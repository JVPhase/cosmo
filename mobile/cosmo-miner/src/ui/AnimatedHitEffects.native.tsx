import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Canvas, Circle } from "@shopify/react-native-skia";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";
import { SPARK_COLORS } from "./animatedHitEffectsShared";

export type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";

type Spark = {
  id: number;
  born: number;
  ox: number;
  oy: number;
  angleRad: number;
  dist: number;
  r: number;
  color: string;
  duration: number;
};

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
  sparks: Spark[];
  ripples: Ripple[];
  floats: FloatDmg[];
};

const MAX_SPARKS = 42;
const MAX_RIPPLES = 9;
const MAX_FLOATS = 3;
const RIPPLE_COLORS = ["#ff4400", "#ff8800", "#ffcc00"];

function SkiaSpark({
  ox,
  oy,
  angleRad,
  dist,
  r,
  color,
  duration,
}: Pick<Spark, "ox" | "oy" | "angleRad" | "dist" | "r" | "color" | "duration">) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.quad) });
  }, [progress, duration]);

  const cx = useDerivedValue(() => ox + Math.cos(angleRad) * dist * progress.value);
  const cy = useDerivedValue(() => oy + Math.sin(angleRad) * dist * progress.value);
  const opacity = useDerivedValue(() =>
    progress.value < 0.1 ? progress.value * 10 : 1 - (progress.value - 0.1) / 0.9,
  );

  return <Circle cx={cx} cy={cy} r={r} color={color} opacity={opacity} />;
}

function SkiaRipple({
  ox,
  oy,
  scaleTo,
  delay,
  color,
}: Pick<Ripple, "ox" | "oy" | "scaleTo" | "delay" | "color">) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) }));
  }, [progress, delay]);

  const r = useDerivedValue(() => 26 * scaleTo * progress.value);
  const opacity = useDerivedValue(() => 0.9 * (1 - progress.value));

  return (
    <Circle
      cx={ox}
      cy={oy}
      r={r}
      color={color}
      opacity={opacity}
      style="stroke"
      strokeWidth={2}
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
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    translateY.value = 0;
    translateX.value = 0;
    opacity.value = 0;
    scale.value = 0.5;

    translateY.value = withSequence(
      withTiming(-20, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(-80, { duration: 700, easing: Easing.out(Easing.quad) }),
    );
    translateX.value = withDelay(120, withTiming(driftX, { duration: 700 }));
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 700 }),
    );
    scale.value = withSequence(
      withTiming(1.3, { duration: 120 }),
      withTiming(0.9, { duration: 700 }),
    );
  }, [floatId, translateY, translateX, opacity, scale, driftX]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[styles.floatNum, { left: ox - 30, top: oy - 16 }, anim]}
      pointerEvents="none"
    >
      <Text style={styles.dmgText}>⚔️ {value}</Text>
    </Animated.View>
  );
}

export function AnimatedHitEffects({
  trigger,
  origin,
  damage,
  style,
  children,
}: AnimatedHitEffectsProps) {
  const pulseScale = useSharedValue(1);
  const sparkIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const floatIdRef = useRef(0);

  const [layers, setLayers] = useState<HitLayers>({ sparks: [], ripples: [], floats: [] });
  const { sparks, ripples, floats } = layers;

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

    const sparkCount = 14;
    const newSparks: Spark[] = [];
    for (let i = 0; i < sparkCount; i++) {
      const angle = (360 / sparkCount) * i + (Math.random() * 30 - 15);
      const angleRad = (angle * Math.PI) / 180;
      const dist = Math.random() * 90 + 30;
      const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]!;
      const r = Math.random() * 2 + 1.5;
      const duration = Math.random() * 200 + 500;
      newSparks.push({
        id: ++sparkIdRef.current,
        born: now,
        ox: x0,
        oy: y0,
        angleRad,
        dist,
        r,
        color,
        duration,
      });
    }

    const newRipples: Ripple[] = [
      { id: ++rippleIdRef.current, born: now, ox: x0, oy: y0, scaleTo: 3.5, delay: 0, color: RIPPLE_COLORS[0]! },
      { id: ++rippleIdRef.current, born: now, ox: x0, oy: y0, scaleTo: 3.9, delay: 60, color: RIPPLE_COLORS[1]! },
      { id: ++rippleIdRef.current, born: now, ox: x0, oy: y0, scaleTo: 4.3, delay: 120, color: RIPPLE_COLORS[2]! },
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
      sparks: [...prev.sparks, ...newSparks].slice(-MAX_SPARKS),
      ripples: [...prev.ripples, ...newRipples].slice(-MAX_RIPPLES),
      floats: [...prev.floats, newFloat].slice(-MAX_FLOATS),
    }));

    const ttl = 900;
    const t = setTimeout(() => {
      const cutoff = Date.now();
      setLayers((prev) => ({
        sparks: prev.sparks.filter((p) => cutoff - p.born < ttl),
        ripples: prev.ripples.filter((r) => cutoff - r.born < ttl),
        floats: prev.floats.filter((f) => cutoff - f.born < ttl),
      }));
    }, ttl);
    return () => clearTimeout(t);
  }, [trigger, originMemo, damage]);

  return (
    <Animated.View style={[style, pulseStyle]}>
      {children}

      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {ripples.map((r) => (
          <SkiaRipple
            key={r.id}
            ox={r.ox}
            oy={r.oy}
            scaleTo={r.scaleTo}
            delay={r.delay}
            color={r.color}
          />
        ))}
        {sparks.map((s) => (
          <SkiaSpark
            key={s.id}
            ox={s.ox}
            oy={s.oy}
            angleRad={s.angleRad}
            dist={s.dist}
            r={s.r}
            color={s.color}
            duration={s.duration}
          />
        ))}
      </Canvas>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {floats.map((f) => (
          <FloatDmgLabel
            key={f.id}
            floatId={f.id}
            ox={f.ox}
            oy={f.oy}
            value={f.value}
            driftX={f.driftX}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatNum: {
    position: "absolute",
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  dmgText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ff4400",
    textShadowColor: "rgba(255,100,0,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
