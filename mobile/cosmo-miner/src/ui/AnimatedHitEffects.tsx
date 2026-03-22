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

export type AnimatedHitEffectsProps = {
  trigger: number;
  origin?: Point;
  damage: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const SPARK_COLORS = [
  "#ff3300", "#ff6600", "#ff9900", "#ffcc00",
  "#ff4444", "#ff8800", "#ffdd00", "#ff2255",
];

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

  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [floats, setFloats] = useState<FloatingDmg[]>([]);

  const originMemo = useMemo(
    () => (origin ? { x: origin.x, y: origin.y } : undefined),
    [origin?.x, origin?.y]
  );

  useEffect(() => {
    if (trigger === 0) return;

    // Pulse the container
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

    // Sparks — burst outward in all directions
    const sparkCount = 14;
    const newParticles: Particle[] = [];
    for (let i = 0; i < sparkCount; i++) {
      const angle = (360 / sparkCount) * i + (Math.random() * 30 - 15);
      const rad = (angle * Math.PI) / 180;
      const dist = Math.random() * 90 + 30;
      const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
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
        x, y, opacity, scale,
        color, size,
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
    setParticles((prev) => [...prev, ...newParticles]);

    // Ripples — 3 expanding rings in red/orange
    const rippleColors = ["#ff4400", "#ff8800", "#ffcc00"];
    const newRipples: Ripple[] = [];
    for (let k = 0; k < 3; k++) {
      const scale = new Animated.Value(0.2);
      const opacity = new Animated.Value(0.9);
      const color = rippleColors[k];
      const delay = k * 60;

      newRipples.push({
        id: ++rippleIdRef.current,
        born: now,
        originX: x0, originY: y0,
        scale, opacity, color,
      });

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(scale, { toValue: 3.5 + k * 0.4, duration: 550, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 550, useNativeDriver: true }),
        ]).start();
      }, delay);
    }
    setRipples((prev) => [...prev, ...newRipples]);

    // Floating damage number
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
      translateY, translateX, opacity, scale,
    };

    Animated.sequence([
      // Pop in
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 120, useNativeDriver: true }),
      ]),
      // Float up and fade
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -80, duration: 700, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: (Math.random() - 0.5) * 30, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();

    setFloats((prev) => [...prev, float]);

    // Cleanup
    const ttl = 900;
    setTimeout(() => {
      const t = Date.now();
      setParticles((prev) => prev.filter((p) => t - p.born < ttl));
      setRipples((prev) => prev.filter((r) => t - r.born < ttl));
      setFloats((prev) => prev.filter((f) => t - f.born < ttl));
    }, ttl);
  }, [trigger]);

  return (
    <Animated.View style={[style, { transform: [{ scale: pulseScale }] }]}>
      {children}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Sparks */}
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
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { scale: p.scale },
              ],
              shadowColor: p.color,
              shadowOpacity: 0.8,
              shadowRadius: 6,
            }}
          />
        ))}

        {/* Ripple rings */}
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

        {/* Damage numbers */}
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
