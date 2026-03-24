import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Canvas, Circle } from "@shopify/react-native-skia";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { AnimatedMineEffectsProps } from "./animatedMineEffectsShared";
import { MINE_DOT_COLORS } from "./animatedMineEffectsShared";

export type { AnimatedMineEffectsProps } from "./animatedMineEffectsShared";

type BurstParticle = {
  id: number;
  born: number;
  ox: number;
  oy: number;
  angleRad: number;
  dist: number;
  color: string;
};

type BurstRipple = {
  id: number;
  born: number;
  ox: number;
  oy: number;
  scaleTo: number;
};

type FloatRow = {
  id: number;
  born: number;
  value: number;
  ox: number;
  oy: number;
};

function SkiaBurstParticle({
  ox,
  oy,
  angleRad,
  dist,
  color,
}: Pick<BurstParticle, "ox" | "oy" | "angleRad" | "dist" | "color">) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const cx = useDerivedValue(() => ox + Math.cos(angleRad) * dist * progress.value);
  const cy = useDerivedValue(() => oy + Math.sin(angleRad) * dist * progress.value);
  const opacity = useDerivedValue(() => 1 - progress.value * 0.97);

  return <Circle cx={cx} cy={cy} r={2} color={color} opacity={opacity} />;
}

function SkiaRippleRing({
  ox,
  oy,
  mineColor,
  scaleTo,
}: Pick<BurstRipple, "ox" | "oy" | "scaleTo"> & { mineColor: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const r = useDerivedValue(() => 29 * progress.value * scaleTo);
  const opacity = useDerivedValue(() => 1 - progress.value);

  return (
    <Circle
      cx={ox}
      cy={oy}
      r={r}
      color={mineColor}
      opacity={opacity}
      style="stroke"
      strokeWidth={2}
    />
  );
}

function FloatLabelRow({
  floatId,
  ox,
  oy,
  value,
}: {
  floatId: number;
  ox: number;
  oy: number;
  value: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  useEffect(() => {
    translateY.value = 0;
    opacity.value = 1;
    translateY.value = withTiming(-62, { duration: 900, easing: Easing.out(Easing.quad) });
    opacity.value = withTiming(0, { duration: 900 });
  }, [floatId, opacity, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.floatNum, { left: ox - 20, top: oy - 12 }, anim]} pointerEvents="none">
      <Text style={styles.floatText}>+{value.toFixed(2)}</Text>
    </Animated.View>
  );
}

export function AnimatedMineEffects({
  trigger,
  origin,
  clickPower,
  mineColor,
  style,
  children,
}: AnimatedMineEffectsProps) {
  const pulseScale = useSharedValue(1);
  const particleIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const floatIdRef = useRef(0);

  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const [ripples, setRipples] = useState<BurstRipple[]>([]);
  const [floats, setFloats] = useState<FloatRow[]>([]);

  const originMemo = useMemo(
    () => (origin ? { x: origin.x, y: origin.y } : undefined),
    [origin?.x, origin?.y],
  );

  useEffect(() => {
    pulseScale.value = 1;
    pulseScale.value = withSequence(
      withTiming(1.08, { duration: 120, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 190, easing: Easing.out(Easing.quad) }),
    );
  }, [trigger, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    if (!originMemo) return;

    const now = Date.now();
    const x0 = originMemo.x;
    const y0 = originMemo.y;

    const particleCount = 10;
    const newParticles: BurstParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angleDeg = (360 / particleCount) * i + (Math.random() * 24 - 12);
      const angleRad = (angleDeg * Math.PI) / 180;
      const dist = Math.random() * 70 + 25;
      const color = MINE_DOT_COLORS[Math.floor(Math.random() * MINE_DOT_COLORS.length)]!;
      newParticles.push({
        id: ++particleIdRef.current,
        born: now,
        ox: x0,
        oy: y0,
        angleRad,
        dist,
        color,
      });
    }

    const newRipples: BurstRipple[] = [
      {
        id: ++rippleIdRef.current,
        born: now,
        ox: x0,
        oy: y0,
        scaleTo: 3.2,
      },
      {
        id: ++rippleIdRef.current,
        born: now,
        ox: x0,
        oy: y0,
        scaleTo: 3.5,
      },
    ];

    setParticles((prev) => [...prev, ...newParticles]);
    setRipples((prev) => [...prev, ...newRipples]);
    setFloats((prev) => [
      ...prev,
      {
        id: ++floatIdRef.current,
        born: now,
        value: clickPower,
        ox: x0,
        oy: y0,
      },
    ]);

    const cleanupAt = 950;
    const t = setTimeout(() => {
      const cutoff = Date.now();
      setParticles((prev) => prev.filter((p) => cutoff - p.born < cleanupAt));
      setRipples((prev) => prev.filter((r) => cutoff - r.born < cleanupAt));
      setFloats((prev) => prev.filter((f) => cutoff - f.born < cleanupAt));
    }, cleanupAt);
    return () => clearTimeout(t);
  }, [trigger, originMemo, clickPower]);

  return (
    <Animated.View style={[styles.root, style, pulseStyle]}>
      {children}

      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {ripples.map((r) => (
          <SkiaRippleRing
            key={r.id}
            ox={r.ox}
            oy={r.oy}
            mineColor={mineColor}
            scaleTo={r.scaleTo}
          />
        ))}
        {particles.map((p) => (
          <SkiaBurstParticle
            key={p.id}
            ox={p.ox}
            oy={p.oy}
            angleRad={p.angleRad}
            dist={p.dist}
            color={p.color}
          />
        ))}
      </Canvas>

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {floats.map((f) => (
          <FloatLabelRow key={f.id} floatId={f.id} ox={f.ox} oy={f.oy} value={f.value} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  floatNum: {
    position: "absolute",
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  floatText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ffd700",
    textShadowColor: "rgba(255,200,0,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
