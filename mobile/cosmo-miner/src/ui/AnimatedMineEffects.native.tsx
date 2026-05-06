import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle as SvgCircle,
  Image as SvgImage,
  Line as SvgLine,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { formatNum } from "../game/formatNum";
import type { AnimatedMineEffectsProps } from "./animatedMineEffectsShared";

export type { AnimatedMineEffectsProps } from "./animatedMineEffectsShared";

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

type MineLayers = {
  ripples: BurstRipple[];
  floats: FloatRow[];
};

const MAX_MINE_RIPPLES = 6;
const MAX_MINE_FLOATS = 3;
const CANVAS_OVERFLOW = 130;
const ASTEROID_HALF = 85;
const RIPPLE_BASE_RADIUS = 29;
const FLOAT_RISE = 62;
const FLOAT_DURATION_MS = 900;
const METAL_FLOAT_DURATION_MS = 1000;
const METAL_FLOAT_RISE = 90;
const METAL_FLOAT_START_OFFSET_Y = -71;
const METAL_ICON_SIZE = 16;
const METAL_TEXT_FONT_SIZE = 14;
const METAL_TEXT_GAP = 4;
const PLANET_PULSE_SCALE_TO = 1.06;
const PLANET_PULSE_IN_MS = 120;
const PLANET_PULSE_OUT_MS = 190;

// ── Passive mining FX (orbit drone + beam + rising mineral particles) ──────
const PASSIVE_ORBIT_RADIUS = 150;
const PASSIVE_DRONE_RADIUS = 5;
const PASSIVE_RING_COLOR = "rgba(0,212,255,0.3)";
const PASSIVE_DRONE_COLOR = "rgba(0,212,255,0.7)";
const PASSIVE_BEAM_COLOR = "rgba(0,212,255,0.55)";
const PASSIVE_BEAM_WIDTH = 1.5;
const PASSIVE_FLOAT_RISE = 55;
const PASSIVE_FLOAT_DURATION_MS = 1000;
const PASSIVE_FLOAT_INTERVAL_MS = 1600;
const PASSIVE_FLOAT_SPAWN_TICK_MS = 80;
const PASSIVE_FLOAT_RADIUS = 2.5;
const PASSIVE_FLOAT_X_JITTER = 36;
const PASSIVE_ORBIT_PERIOD_MS = 14000;
const PASSIVE_MAX_FLOATS = 48;
const PASSIVE_CENTER = CANVAS_OVERFLOW + ASTEROID_HALF;

function passiveOrbitPeriodMs(passive: number): number {
  if (passive <= 0) return PASSIVE_ORBIT_PERIOD_MS;
  return Math.max(
    PASSIVE_ORBIT_PERIOD_MS / (1 + Math.log10(Math.max(1, passive)) * 0.5),
    PASSIVE_ORBIT_PERIOD_MS / 4,
  );
}

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);
const AnimatedSvgImage = Animated.createAnimatedComponent(SvgImage);
const AnimatedSvgLine = Animated.createAnimatedComponent(SvgLine);

function SvgRippleRing({
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

  const animatedProps = useAnimatedProps(() => ({
    r: RIPPLE_BASE_RADIUS * scaleTo * progress.value,
    opacity: 1 - progress.value,
  }));

  return (
    <AnimatedSvgCircle
      cx={ox}
      cy={oy}
      stroke={mineColor}
      strokeWidth={2}
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

function SvgFloatNumber({
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
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: FLOAT_DURATION_MS, easing: Easing.out(Easing.quad) });
  }, [floatId, progress]);

  const animatedProps = useAnimatedProps(() => ({
    y: oy - FLOAT_RISE * progress.value,
    opacity: 1 - progress.value,
  }));

  const text = `+${formatNum(value)}`;
  return (
    <>
      <AnimatedSvgText
        x={ox}
        fill="none"
        stroke="rgba(120,60,0,0.85)"
        strokeWidth={3}
        fontSize={16}
        fontWeight="900"
        textAnchor="middle"
        alignmentBaseline="middle"
        animatedProps={animatedProps}
      >
        {text}
      </AnimatedSvgText>
      <AnimatedSvgText
        x={ox}
        fill="#ffd700"
        fontSize={16}
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

function SvgMetalFloat({
  floatId,
  ox,
  baseY,
  amount,
  image,
}: {
  floatId: number;
  ox: number;
  baseY: number;
  amount: number;
  image: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: METAL_FLOAT_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [floatId, progress]);

  // SVG group transform shorthands (translateY) are not reliably reactive via
  // useAnimatedProps, so animate `y` on each child directly.
  const iconAnimatedProps = useAnimatedProps(() => ({
    y: baseY - METAL_ICON_SIZE / 2 - METAL_FLOAT_RISE * progress.value,
    opacity: 1 - progress.value,
  }));

  const textAnimatedProps = useAnimatedProps(() => ({
    y: baseY - METAL_FLOAT_RISE * progress.value,
    opacity: 1 - progress.value,
  }));

  const text = `+${formatNum(amount)}`;
  const iconLeft = ox - METAL_ICON_SIZE - METAL_TEXT_GAP;
  const textX = ox - METAL_TEXT_GAP / 2;

  return (
    <>
      <AnimatedSvgImage
        href={image}
        x={iconLeft}
        width={METAL_ICON_SIZE}
        height={METAL_ICON_SIZE}
        preserveAspectRatio="xMidYMid meet"
        animatedProps={iconAnimatedProps}
      />
      <AnimatedSvgText
        x={textX}
        fill="none"
        stroke="rgba(120,60,0,0.85)"
        strokeWidth={3}
        fontSize={METAL_TEXT_FONT_SIZE}
        fontWeight="900"
        textAnchor="start"
        alignmentBaseline="middle"
        animatedProps={textAnimatedProps}
      >
        {text}
      </AnimatedSvgText>
      <AnimatedSvgText
        x={textX}
        fill="#ffd700"
        fontSize={METAL_TEXT_FONT_SIZE}
        fontWeight="900"
        textAnchor="start"
        alignmentBaseline="middle"
        animatedProps={textAnimatedProps}
      >
        {text}
      </AnimatedSvgText>
    </>
  );
}

function PassiveOrbit({ passiveRate }: { passiveRate: number }) {
  const angle = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(angle);
    angle.value = 0;
    const period = passiveOrbitPeriodMs(passiveRate);
    angle.value = withRepeat(
      withTiming(2 * Math.PI, { duration: period, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(angle);
    };
  }, [angle, passiveRate]);

  const droneAnimatedProps = useAnimatedProps(() => {
    const theta = angle.value - Math.PI / 2;
    return {
      cx: PASSIVE_CENTER + PASSIVE_ORBIT_RADIUS * Math.cos(theta),
      cy: PASSIVE_CENTER + PASSIVE_ORBIT_RADIUS * Math.sin(theta),
    };
  });

  const beamAnimatedProps = useAnimatedProps(() => {
    const theta = angle.value - Math.PI / 2;
    return {
      x1: PASSIVE_CENTER + PASSIVE_ORBIT_RADIUS * Math.cos(theta),
      y1: PASSIVE_CENTER + PASSIVE_ORBIT_RADIUS * Math.sin(theta),
      opacity:
        passiveRate <= 0
          ? 0
          : 0.1 + 0.2 * Math.abs(Math.sin(angle.value * 4)),
    };
  });

  return (
    <>
      <SvgCircle
        cx={PASSIVE_CENTER}
        cy={PASSIVE_CENTER}
        r={PASSIVE_ORBIT_RADIUS}
        stroke={PASSIVE_RING_COLOR}
        strokeWidth={1}
        fill="none"
      />
      <AnimatedSvgLine
        x2={PASSIVE_CENTER}
        y2={PASSIVE_CENTER}
        stroke={PASSIVE_BEAM_COLOR}
        strokeWidth={PASSIVE_BEAM_WIDTH}
        animatedProps={beamAnimatedProps}
      />
      <AnimatedSvgCircle
        r={PASSIVE_DRONE_RADIUS}
        fill={PASSIVE_DRONE_COLOR}
        animatedProps={droneAnimatedProps}
      />
    </>
  );
}

function SvgPassiveFloat({
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
      duration: PASSIVE_FLOAT_DURATION_MS,
      easing: Easing.linear,
    });
    const t = setTimeout(() => onDone(floatId), PASSIVE_FLOAT_DURATION_MS + 24);
    return () => clearTimeout(t);
  }, [floatId, onDone, progress]);

  const animatedProps = useAnimatedProps(() => ({
    cy: PASSIVE_CENTER - PASSIVE_FLOAT_RISE * progress.value,
    opacity: (1 - progress.value) * 0.85,
  }));

  return (
    <AnimatedSvgCircle
      cx={ox}
      r={PASSIVE_FLOAT_RADIUS}
      fill={mineColor}
      animatedProps={animatedProps}
    />
  );
}

export function AnimatedMineEffects({
  trigger,
  origin,
  clickPower,
  mineColor,
  passiveRate = 0,
  planetImage,
  metalFloats,
  style,
  children,
}: AnimatedMineEffectsProps) {
  const rippleIdRef = useRef(0);
  const floatIdRef = useRef(0);

  const [layers, setLayers] = useState<MineLayers>({ ripples: [], floats: [] });
  const { ripples, floats } = layers;

  const [passiveFloats, setPassiveFloats] = useState<{ id: number; x: number }[]>([]);
  const passiveFloatIdRef = useRef(0);
  const passiveLastSpawnRef = useRef(0);
  const passiveRateRef = useRef(passiveRate);
  passiveRateRef.current = passiveRate;
  const planetScale = useSharedValue(1);

  useEffect(() => {
    const tick = () => {
      const passive = passiveRateRef.current;
      if (passive <= 0) return;
      const now = Date.now();
      const spawnInterval = Math.max(
        200,
        PASSIVE_FLOAT_INTERVAL_MS / (1 + Math.log10(passive)),
      );
      if (now - passiveLastSpawnRef.current < spawnInterval) return;
      passiveLastSpawnRef.current = now;
      const burst = passive >= 100 ? 2 : 1;
      setPassiveFloats((prev) => {
        const next = [...prev];
        for (let i = 0; i < burst; i++) {
          next.push({
            id: ++passiveFloatIdRef.current,
            x:
              PASSIVE_CENTER +
              (Math.random() * PASSIVE_FLOAT_X_JITTER -
                PASSIVE_FLOAT_X_JITTER / 2),
          });
        }
        return next.slice(-PASSIVE_MAX_FLOATS);
      });
    };
    const iv = setInterval(tick, PASSIVE_FLOAT_SPAWN_TICK_MS);
    return () => clearInterval(iv);
  }, []);

  const removePassiveFloat = useCallback((id: number) => {
    setPassiveFloats((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const originMemo = useMemo(
    () => (origin ? { x: origin.x, y: origin.y } : undefined),
    [origin?.x, origin?.y],
  );

  useEffect(() => {
    if (!originMemo) return;

    const now = Date.now();
    const x0 = originMemo.x;
    const y0 = originMemo.y;

    const newRipples: BurstRipple[] = [
      { id: ++rippleIdRef.current, born: now, ox: x0, oy: y0, scaleTo: 3.2 },
      { id: ++rippleIdRef.current, born: now, ox: x0, oy: y0, scaleTo: 3.5 },
    ];

    const newFloat: FloatRow = {
      id: ++floatIdRef.current,
      born: now,
      value: clickPower,
      ox: x0,
      oy: y0,
    };

    setLayers((prev) => ({
      ripples: [...prev.ripples, ...newRipples].slice(-MAX_MINE_RIPPLES),
      floats: [...prev.floats, newFloat].slice(-MAX_MINE_FLOATS),
    }));

    const cleanupAt = Math.max(950, FLOAT_DURATION_MS + 50);
    const t = setTimeout(() => {
      const cutoff = Date.now();
      setLayers((prev) => ({
        ripples: prev.ripples.filter((r) => cutoff - r.born < cleanupAt),
        floats: prev.floats.filter((f) => cutoff - f.born < cleanupAt),
      }));
    }, cleanupAt);
    return () => clearTimeout(t);
  }, [trigger, originMemo, clickPower]);

  useEffect(() => {
    planetScale.value = 1;
    planetScale.value = withSequence(
      withTiming(PLANET_PULSE_SCALE_TO, {
        duration: PLANET_PULSE_IN_MS,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(1, {
        duration: PLANET_PULSE_OUT_MS,
        easing: Easing.out(Easing.quad),
      }),
    );
  }, [trigger, planetScale]);

  const planetImageAnimatedProps = useAnimatedProps(() => {
    const size = ASTEROID_HALF * 2 * planetScale.value;
    return {
      x: PASSIVE_CENTER - size / 2,
      y: PASSIVE_CENTER - size / 2,
      width: size,
      height: size,
    };
  });

  return (
    <View style={[styles.root, style]}>
      {children}

      <View pointerEvents="none" style={styles.overflowCanvas}>
        <Svg
          style={[StyleSheet.absoluteFill, { overflow: 'visible' }]}
          width="100%"
          height="100%"
        >
          <PassiveOrbit passiveRate={passiveRate} />
          {passiveFloats.map((f) => (
            <SvgPassiveFloat
              key={f.id}
              floatId={f.id}
              ox={f.x}
              mineColor={mineColor}
              onDone={removePassiveFloat}
            />
          ))}
          {planetImage !== undefined && (
            <AnimatedSvgImage
              href={planetImage}
              preserveAspectRatio="xMidYMid meet"
              animatedProps={planetImageAnimatedProps}
            />
          )}
          {ripples.map((r) => (
            <SvgRippleRing
              key={r.id}
              ox={r.ox + CANVAS_OVERFLOW}
              oy={r.oy + CANVAS_OVERFLOW}
              mineColor={mineColor}
              scaleTo={r.scaleTo}
            />
          ))}
          {floats.map((f) => (
            <SvgFloatNumber
              key={f.id}
              floatId={f.id}
              ox={f.ox + CANVAS_OVERFLOW}
              oy={f.oy + CANVAS_OVERFLOW}
              value={f.value}
            />
          ))}
          {metalFloats?.map((mf) => (
            <SvgMetalFloat
              key={mf.id}
              floatId={mf.id}
              ox={CANVAS_OVERFLOW + ASTEROID_HALF + mf.offsetX}
              baseY={CANVAS_OVERFLOW + ASTEROID_HALF + METAL_FLOAT_START_OFFSET_Y}
              amount={mf.amount}
              image={mf.image}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "visible",
  },
  overflowCanvas: {
    position: "absolute",
    top: -CANVAS_OVERFLOW,
    left: -CANVAS_OVERFLOW,
    right: -CANVAS_OVERFLOW,
    bottom: -CANVAS_OVERFLOW,
  },
});
