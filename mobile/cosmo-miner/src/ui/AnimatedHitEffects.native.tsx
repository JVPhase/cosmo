import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";
import { SPARK_COLORS } from "./animatedHitEffectsShared";

export type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";

type Particle = {
  id: number;
  born: number;
  originX: number;
  originY: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
};

type Ripple = {
  id: number;
  born: number;
  originX: number;
  originY: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
};

type FloatingDmg = {
  id: number;
  born: number;
  value: number;
  originX: number;
  originY: number;
  translateY: Animated.Value;
  translateX: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
};

type HitEffectLayers = {
  particles: Particle[];
  ripples: Ripple[];
  floats: FloatingDmg[];
};

export function AnimatedHitEffects({
  trigger,
  origin,
  damage,
  style,
  children,
}: AnimatedHitEffectsProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const particleIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const floatIdRef = useRef(0);

  const [layers, setLayers] = useState<HitEffectLayers>({
    particles: [],
    ripples: [],
    floats: [],
  });
  const { particles, ripples, floats } = layers;

  const originMemo = useMemo(
    () => (origin ? { x: origin.x, y: origin.y } : undefined),
    [origin?.x, origin?.y],
  );

  useEffect(() => {
    if (trigger === 0) return;

    pulseScale.setValue(1);
    Animated.sequence([
      Animated.timing(pulseScale, { toValue: 1.06, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseScale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();

    if (!originMemo) return;

    const now = Date.now();
    const x0 = originMemo.x;
    const y0 = originMemo.y;

    const sparkCount = 14;
    const newParticles: Particle[] = [];
    for (let i = 0; i < sparkCount; i++) {
      const angle = (360 / sparkCount) * i + (Math.random() * 30 - 15);
      const rad = (angle * Math.PI) / 180;
      const dist = Math.random() * 90 + 30;
      const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]!;
      const size = Math.random() * 4 + 3;
      const duration = Math.random() * 200 + 500;

      const x = new Animated.Value(0);
      const y = new Animated.Value(0);
      const opacity = new Animated.Value(1);
      const scale = new Animated.Value(1);

      newParticles.push({
        id: ++particleIdRef.current,
        born: now,
        originX: x0,
        originY: y0,
        x,
        y,
        opacity,
        scale,
        color,
        size,
      });

      Animated.parallel([
        Animated.timing(x, { toValue: Math.cos(rad) * dist, duration, useNativeDriver: true }),
        Animated.timing(y, { toValue: Math.sin(rad) * dist, duration, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: duration - 80, useNativeDriver: true }),
        ]),
      ]).start();
    }

    const rippleColors = ["#ff4400", "#ff8800", "#ffcc00"];
    const newRipples: Ripple[] = [];
    for (let k = 0; k < 3; k++) {
      const scale = new Animated.Value(0.2);
      const opacity = new Animated.Value(0.9);
      const color = rippleColors[k]!;
      const delay = k * 60;

      newRipples.push({
        id: ++rippleIdRef.current,
        born: now,
        originX: x0,
        originY: y0,
        scale,
        opacity,
        color,
      });

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(scale, { toValue: 3.5 + k * 0.4, duration: 550, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 550, useNativeDriver: true }),
        ]).start();
      }, delay);
    }

    const translateY = new Animated.Value(0);
    const translateX = new Animated.Value(0);
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0.5);
    const float: FloatingDmg = {
      id: ++floatIdRef.current,
      born: now,
      value: damage,
      originX: x0,
      originY: y0,
      translateY,
      translateX,
      opacity,
      scale,
    };

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 120, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -80, duration: 700, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: (Math.random() - 0.5) * 30, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();

    setLayers((prev) => ({
      particles: [...prev.particles, ...newParticles],
      ripples: [...prev.ripples, ...newRipples],
      floats: [...prev.floats, float],
    }));

    const ttl = 900;
    const t = setTimeout(() => {
      const cutoff = Date.now();
      setLayers((prev) => ({
        particles: prev.particles.filter((p) => cutoff - p.born < ttl),
        ripples: prev.ripples.filter((r) => cutoff - r.born < ttl),
        floats: prev.floats.filter((f) => cutoff - f.born < ttl),
      }));
    }, ttl);
    return () => clearTimeout(t);
  }, [trigger, originMemo, damage]);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulseScale }] }]}>
      {children}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {particles.map((p) => (
          <Animated.View
            key={p.id}
            style={{
              position: "absolute",
              left: p.originX - p.size / 2,
              top: p.originY - p.size / 2,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
              shadowColor: p.color,
              shadowOpacity: 0.8,
              shadowRadius: 6,
            }}
          />
        ))}

        {ripples.map((r) => (
          <Animated.View
            key={r.id}
            style={{
              position: "absolute",
              width: 52,
              height: 52,
              borderRadius: 26,
              borderWidth: 2,
              borderColor: r.color,
              opacity: r.opacity,
              left: r.originX - 26,
              top: r.originY - 26,
              transform: [{ scale: r.scale }],
              shadowColor: r.color,
              shadowOpacity: 0.6,
              shadowRadius: 8,
            }}
          />
        ))}

        {floats.map((f) => (
          <Animated.View
            key={f.id}
            style={{
              position: "absolute",
              left: f.originX - 30,
              top: f.originY - 16,
              width: 60,
              alignItems: "center",
              opacity: f.opacity,
              transform: [
                { translateY: f.translateY },
                { translateX: f.translateX },
                { scale: f.scale },
              ],
            }}
          >
            <Text style={styles.dmgText}>⚔️ {f.value}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dmgText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ff4400",
    textShadowColor: "rgba(255,100,0,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
