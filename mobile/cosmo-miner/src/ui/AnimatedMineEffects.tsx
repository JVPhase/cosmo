import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

type Point = { x: number; y: number };

type Particle = {
  id: number;
  born: number;
  originX: number;
  originY: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  color: string;
};

type Ripple = {
  id: number;
  born: number;
  originX: number;
  originY: number;
  scale: Animated.Value;
  opacity: Animated.Value;
};

type FloatingNum = {
  id: number;
  born: number;
  value: number;
  originX: number;
  originY: number;
  translateY: Animated.Value;
  opacity: Animated.Value;
};

export type AnimatedMineEffectsProps = {
  trigger: number; // increment on each tap
  origin?: Point; // tap point in local coordinates of the asteroid container
  clickPower: number;
  mineColor: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const DOT_COLORS = ["#ffd700", "#ff6b35", "#00d4ff", "#7fff00", "#ff4da6"];

export function AnimatedMineEffects({
  trigger,
  origin,
  clickPower,
  mineColor,
  style,
  children,
}: AnimatedMineEffectsProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const particleIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const floatIdRef = useRef(0);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [floats, setFloats] = useState<FloatingNum[]>([]);

  const originMemo = useMemo(() => {
    return origin ? { x: origin.x, y: origin.y } : undefined;
  }, [origin?.x, origin?.y]);

  useEffect(() => {
    // Asteroid pulse.
    pulseScale.setValue(1);
    Animated.sequence([
      Animated.timing(pulseScale, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.timing(pulseScale, { toValue: 1, duration: 190, useNativeDriver: true }),
    ]).start();

    if (!originMemo) return;

    const now = Date.now();
    const x0 = originMemo.x;
    const y0 = originMemo.y;

    // Particles.
    const particleCount = 10;
    const dotSize = 4;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (360 / particleCount) * i + (Math.random() * 24 - 12);
      const rad = (angle * Math.PI) / 180;
      const dist = Math.random() * 70 + 25;
      const color = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];

      const x = new Animated.Value(0);
      const y = new Animated.Value(0);
      const opacity = new Animated.Value(1);

      newParticles.push({
        id: ++particleIdRef.current,
        born: now,
        originX: x0,
        originY: y0,
        x,
        y,
        opacity,
        color,
      });

      Animated.parallel([
        Animated.timing(x, { toValue: Math.cos(rad) * dist, duration: 700, useNativeDriver: true }),
        Animated.timing(y, { toValue: Math.sin(rad) * dist, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 650, useNativeDriver: true }),
      ]).start();
    }

    setParticles((prev) => [...prev, ...newParticles]);

    // Ripple.
    const rippleSize = 58;
    const rippleBorn: Ripple[] = [];
    for (let k = 0; k < 2; k++) {
      const scale = new Animated.Value(0);
      const opacity = new Animated.Value(1);
      rippleBorn.push({
        id: ++rippleIdRef.current,
        born: now,
        originX: x0,
        originY: y0,
        scale,
        opacity,
      });
      Animated.parallel([
        Animated.timing(scale, { toValue: 3.2 + k * 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
    setRipples((prev) => [...prev, ...rippleBorn]);

    // Floating +numbers.
    const floatTranslate = new Animated.Value(0);
    const floatOpacity = new Animated.Value(1);
    const float: FloatingNum = {
      id: ++floatIdRef.current,
      born: now,
      value: clickPower,
      originX: x0,
      originY: y0,
      translateY: floatTranslate,
      opacity: floatOpacity,
    };

    Animated.parallel([
      Animated.timing(floatTranslate, { toValue: -62, duration: 900, useNativeDriver: true }),
      Animated.timing(floatOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
    setFloats((prev) => [...prev, float]);

    // Cleanup.
    const cleanupAt = 950;
    setTimeout(() => {
      const t = Date.now();
      setParticles((prev) => prev.filter((p) => t - p.born < cleanupAt));
      setRipples((prev) => prev.filter((r) => t - r.born < cleanupAt));
      setFloats((prev) => prev.filter((f) => t - f.born < cleanupAt));
    }, cleanupAt);

    void rippleSize;
  }, [trigger, originMemo, pulseScale]);

  return (
    <Animated.View style={[styles.root, style, { transform: [{ scale: pulseScale }] }]}>
      {children}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {particles.map((p) => (
          <Animated.View
            key={p.id}
            style={{
              position: "absolute",
              left: p.originX - 2,
              top: p.originY - 2,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [{ translateX: p.x }, { translateY: p.y }],
              shadowColor: p.color,
              shadowOpacity: 0.35,
              shadowRadius: 8,
            }}
          />
        ))}

        {ripples.map((r) => (
          <Animated.View
            key={r.id}
            style={{
              position: "absolute",
              width: 58,
              height: 58,
              borderRadius: 29,
              borderWidth: 2,
              borderColor: mineColor,
              opacity: r.opacity,
              left: r.originX - 29,
              top: r.originY - 29,
              transform: [{ scale: r.scale }],
            }}
          />
        ))}

        {floats.map((f) => (
          <Animated.View
            key={f.id}
            style={[
              styles.floatNum,
              {
                opacity: f.opacity,
                left: f.originX - 20,
                top: f.originY - 12,
                transform: [{ translateY: f.translateY }],
              },
            ]}
          >
            <Text style={styles.floatText}>+{f.value.toFixed(2)}</Text>
          </Animated.View>
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

