import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Circle, Line, vec } from "@shopify/react-native-skia";
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PADDING = 8;
const ORBIT_RADIUS = 150;
const CENTER = 150 + PADDING;
const CONTAINER = 300 + PADDING * 2;
const ORBIT_PERIOD_MS = 14000;
const FLOAT_DURATION_MS = 1000;
const FLOAT_INTERVAL_MS = 1600;

type Props = {
  passiveRate: number;
  mineColor: string;
};

type FloatRow = { id: number; x: number };

function orbitPeriodMs(passive: number): number {
  return passive <= 0
    ? ORBIT_PERIOD_MS
    : Math.max(
        ORBIT_PERIOD_MS / (1 + Math.log10(Math.max(1, passive)) * 0.5),
        ORBIT_PERIOD_MS / 4
      );
}

function PassiveFloatParticle({
  floatId,
  ox,
  mineColor,
  onDone,
}: {
  floatId: number;
  ox: number;
  mineColor: string;
  onDone: (id: number) => void;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: FLOAT_DURATION_MS,
      easing: Easing.linear,
    });
    const t = setTimeout(() => onDone(floatId), FLOAT_DURATION_MS + 24);
    return () => clearTimeout(t);
  }, [floatId, onDone, progress]);

  const cy = useDerivedValue(() => CENTER - 55 * progress.value);
  const opacity = useDerivedValue(() => (1 - progress.value) * 0.85);

  return (
    <Circle cx={ox} cy={cy} r={2.5} color={mineColor} opacity={opacity} />
  );
}

export function PassiveMiningFx({ passiveRate, mineColor }: Props) {
  const angle = useSharedValue(0);
  const passiveSv = useSharedValue(passiveRate);
  const floatIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const passiveRef = useRef(passiveRate);
  const [floats, setFloats] = useState<FloatRow[]>([]);

  passiveRef.current = passiveRate;

  useEffect(() => {
    passiveSv.value = passiveRate;
  }, [passiveRate, passiveSv]);

  useEffect(() => {
    cancelAnimation(angle);
    angle.value = 0;
    const period = orbitPeriodMs(passiveRate);
    angle.value = withRepeat(
      withTiming(2 * Math.PI, { duration: period, easing: Easing.linear }),
      -1,
      false
    );
  }, [angle, passiveRate]);

  const theta = useDerivedValue(() => angle.value - Math.PI / 2);
  const dx = useDerivedValue(() => CENTER + ORBIT_RADIUS * Math.cos(theta.value));
  const dy = useDerivedValue(() => CENTER + ORBIT_RADIUS * Math.sin(theta.value));

  const p1 = useDerivedValue(() => vec(dx.value, dy.value));
  const p2 = useDerivedValue(() => vec(CENTER, CENTER));

  const beamOpacity = useDerivedValue(() => {
    if (passiveSv.value <= 0) return 0;
    return 0.1 + 0.2 * Math.abs(Math.sin(angle.value * 4));
  });

  useEffect(() => {
    const tick = () => {
      const passive = passiveRef.current;
      if (passive <= 0) return;
      const now = Date.now();
      const spawnInterval = Math.max(
        200,
        FLOAT_INTERVAL_MS / (1 + Math.log10(passive))
      );
      if (now - lastSpawnRef.current < spawnInterval) return;
      lastSpawnRef.current = now;
      const burst = passive >= 100 ? 2 : 1;
      setFloats((prev) => {
        const next = [...prev];
        for (let i = 0; i < burst; i++) {
          next.push({
            id: ++floatIdRef.current,
            x: CENTER + (Math.random() * 36 - 18),
          });
        }
        return next.slice(-48);
      });
    };
    const iv = setInterval(tick, 80);
    return () => clearInterval(iv);
  }, []);

  const removeFloat = useCallback((id: number) => {
    setFloats((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={ORBIT_RADIUS}
          color="rgba(0,212,255,0.3)"
          style="stroke"
          strokeWidth={1}
        />
        <Circle cx={dx} cy={dy} r={5} color="rgba(0,212,255,0.7)" />
        <Line
          p1={p1}
          p2={p2}
          color="rgba(0,212,255,0.55)"
          strokeWidth={1.5}
          opacity={beamOpacity}
        />
        {floats.map((f) => (
          <PassiveFloatParticle
            key={f.id}
            floatId={f.id}
            ox={f.x}
            mineColor={mineColor}
            onDone={removeFloat}
          />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: CONTAINER,
    height: CONTAINER,
    left: -PADDING,
    top: -PADDING,
    pointerEvents: "none",
  },
});
