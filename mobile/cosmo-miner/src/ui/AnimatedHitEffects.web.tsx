import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { formatNum } from "../game/formatNum";
import type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";
import { SPARK_COLORS } from "./animatedHitEffectsShared";

type HealFloatFx = {
  born: number;
  originX: number;
  originY: number;
  label: string;
  driftX: number;
};

export type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";

const SPARK_COUNT = 14;
const RIPPLE_COUNT = 3;
const RIPPLE_DELAY_MS = 60;
const RIPPLE_DURATION_MS = 550;
const RIPPLE_BASE_RADIUS = 26;
const FLOAT_PHASE1_MS = 120;
const FLOAT_PHASE2_MS = 700;
const EFFECT_MAX_AGE_MS = 900;

// Skill ring constants (same as SkillCheckRing)
const DEG = Math.PI / 180;
const toCanvasRad = (deg: number) => (deg - 90) * DEG;
const RING_WIDTH = 7;

type SparkFx = {
  born: number;
  originX: number;
  originY: number;
  angle: number;
  dist: number;
  color: string;
  size: number;
  duration: number;
};

type RippleFx = {
  born: number;
  delayMs: number;
  originX: number;
  originY: number;
  rippleIndex: number;
  strokeColor: string;
};

type FloatFx = {
  born: number;
  originX: number;
  originY: number;
  value: number;
  driftX: number;
};

function clamp01(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
}

/** Web: искры, кольца, урон, хил и QTE-ring — всё на одном canvas поверх (pointerEvents: none). */
export function AnimatedHitEffects({
  trigger,
  origin,
  damage,
  style,
  children,
  skillRing,
  healEffect,
}: AnimatedHitEffectsProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<SparkFx[]>([]);
  const ripplesRef = useRef<RippleFx[]>([]);
  const floatsRef = useRef<FloatFx[]>([]);
  const rafRef = useRef<number | null>(null);
  const healFloatsRef = useRef<HealFloatFx[]>([]);

  // Skill ring state
  const skillRingRef = useRef(skillRing);
  skillRingRef.current = skillRing;
  const ringStartRef = useRef(0);

  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const originMemo = useMemo(
    () => (origin ? { x: origin.x, y: origin.y } : undefined),
    [origin?.x, origin?.y],
  );

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || layout.w <= 0 || layout.h <= 0) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(layout.w * dpr);
    canvas.height = Math.round(layout.h * dpr);
    canvas.style.width = `${layout.w}px`;
    canvas.style.height = `${layout.h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  };

  useEffect(() => {
    resizeCanvas();
  }, [layout.w, layout.h]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout((prev) =>
      prev.w === width && prev.h === height ? prev : { w: width, h: height },
    );
  };

  const drawFrame = (now: number) => {
    const canvas = canvasRef.current;
    const { w: lw, h: lh } = layoutRef.current;
    if (!canvas || lw <= 0 || lh <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    sparksRef.current = sparksRef.current.filter((p) => now - p.born < EFFECT_MAX_AGE_MS);
    ripplesRef.current = ripplesRef.current.filter((r) => now - r.born < EFFECT_MAX_AGE_MS);
    floatsRef.current = floatsRef.current.filter((f) => now - f.born < EFFECT_MAX_AGE_MS);
    healFloatsRef.current = healFloatsRef.current.filter((h) => now - h.born < EFFECT_MAX_AGE_MS);

    ctx.clearRect(0, 0, lw, lh);

    // --- Skill ring (drawn first, below hit effects) ---
    const ring = skillRingRef.current;
    if (ring?.active && !ring.attempted) {
      const { speedMs, successZoneDeg, successZoneStart, size = 220 } = ring;
      const ringRadius = size / 2;
      const cx = lw / 2;
      const cy = lh / 2;

      // Background ring
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = RING_WIDTH;
      ctx.stroke();

      // Success zone arc (red)
      ctx.beginPath();
      ctx.arc(
        cx, cy, ringRadius,
        toCanvasRad(successZoneStart),
        toCanvasRad(successZoneStart + successZoneDeg),
      );
      ctx.strokeStyle = "rgba(255,60,60,0.9)";
      ctx.lineWidth = RING_WIDTH;
      ctx.stroke();

      // Rotating needle
      const elapsed = now - ringStartRef.current;
      const needleDeg = ((elapsed / speedMs) * 360) % 360;
      const needleRad = toCanvasRad(needleDeg);
      const needleInner = ringRadius - RING_WIDTH / 2 - 3;
      const needleOuter = ringRadius + RING_WIDTH / 2 + 6;

      ctx.beginPath();
      ctx.moveTo(cx + needleInner * Math.cos(needleRad), cy + needleInner * Math.sin(needleRad));
      ctx.lineTo(cx + needleOuter * Math.cos(needleRad), cy + needleOuter * Math.sin(needleRad));
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.lineCap = "butt";
    }

    // --- Sparks (no shadowBlur — use globalAlpha + solid color) ---
    for (const p of sparksRef.current) {
      const age = now - p.born;
      if (age < 0 || age >= p.duration) continue;
      const t = age / p.duration;
      const dist = p.dist * t;
      const x = p.originX + Math.cos(p.angle) * dist;
      const y = p.originY + Math.sin(p.angle) * dist;
      const scaleSpark = 1 - t;
      const opacity = age < 80
        ? 1
        : Math.max(0, 1 - (age - 80) / (p.duration - 80));
      const r = (p.size / 2) * scaleSpark;
      if (r <= 0.05) continue;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- Ripples (no shadowBlur) ---
    for (const r of ripplesRef.current) {
      const age = now - r.born - r.delayMs;
      if (age < 0 || age >= RIPPLE_DURATION_MS) continue;
      const t = age / RIPPLE_DURATION_MS;
      const k = r.rippleIndex;
      const scale = 0.2 + t * (3.5 + k * 0.4 - 0.2);
      const opacity = 0.9 * (1 - t);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = r.strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.originX, r.originY, RIPPLE_BASE_RADIUS * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // --- Floating damage numbers (no shadowBlur) ---
    const floatTotalMs = FLOAT_PHASE1_MS + FLOAT_PHASE2_MS;
    ctx.font = "900 17px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of floatsRef.current) {
      const age = now - f.born;
      if (age < 0 || age > floatTotalMs) continue;

      let opacity: number;
      let ty: number;
      let tx: number;

      if (age < FLOAT_PHASE1_MS) {
        const t1 = age / FLOAT_PHASE1_MS;
        opacity = clamp01(age / 100);
        ty = -20 * t1;
        tx = 0;
      } else {
        const t2 = clamp01((age - FLOAT_PHASE1_MS) / FLOAT_PHASE2_MS);
        opacity = 1 - t2;
        ty = -20 - 60 * t2;
        tx = f.driftX * t2;
      }

      ctx.globalAlpha = opacity;
      ctx.fillStyle = "#ff6622";
      ctx.fillText(`⚔️ ${formatNum(f.value)}`, f.originX + tx, f.originY + ty);
    }
    ctx.globalAlpha = 1;

    // --- Heal floats (green, same rise animation) ---
    ctx.font = "900 17px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const h of healFloatsRef.current) {
      const age = now - h.born;
      if (age < 0 || age > floatTotalMs) continue;

      let opacity: number;
      let ty: number;
      let tx: number;

      if (age < FLOAT_PHASE1_MS) {
        const t1 = age / FLOAT_PHASE1_MS;
        opacity = clamp01(age / 100);
        ty = -20 * t1;
        tx = 0;
      } else {
        const t2 = clamp01((age - FLOAT_PHASE1_MS) / FLOAT_PHASE2_MS);
        opacity = 1 - t2;
        ty = -20 - 60 * t2;
        tx = h.driftX * t2;
      }

      ctx.globalAlpha = opacity;
      ctx.fillStyle = "#44ff88";
      ctx.fillText(h.label, h.originX + tx, h.originY + ty);
    }
    ctx.globalAlpha = 1;
  };

  const runLoop = useCallback(() => {
    const step = (t: number) => {
      drawFrame(t);
      const ring = skillRingRef.current;
      const ringAlive = !!ring?.active && !ring.attempted;
      const alive =
        sparksRef.current.length + ripplesRef.current.length + floatsRef.current.length > 0
        || healFloatsRef.current.length > 0
        || ringAlive;
      if (alive) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(step);
    }
  }, []);

  // Hit effect trigger
  useEffect(() => {
    if (trigger === 0) return;

    pulseScale.setValue(1);
    Animated.sequence([
      Animated.timing(pulseScale, { toValue: 1.06, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseScale, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();

    if (!originMemo) return;

    const born = performance.now();
    const x0 = originMemo.x;
    const y0 = originMemo.y;

    for (let i = 0; i < SPARK_COUNT; i++) {
      const angleDeg = (360 / SPARK_COUNT) * i + (Math.random() * 30 - 15);
      const angle = (angleDeg * Math.PI) / 180;
      const dist = Math.random() * 90 + 30;
      const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]!;
      const size = Math.random() * 4 + 3;
      const duration = Math.random() * 200 + 500;
      sparksRef.current.push({ born, originX: x0, originY: y0, angle, dist, color, size, duration });
    }

    const rippleColors = ["#ff4400", "#ff8800", "#ffcc00"];
    for (let k = 0; k < RIPPLE_COUNT; k++) {
      ripplesRef.current.push({
        born,
        delayMs: k * RIPPLE_DELAY_MS,
        originX: x0,
        originY: y0,
        rippleIndex: k,
        strokeColor: rippleColors[k]!,
      });
    }

    floatsRef.current.push({
      born,
      originX: x0,
      originY: y0,
      value: damage,
      driftX: (Math.random() - 0.5) * 30,
    });

    runLoop();
  }, [trigger, originMemo, damage, runLoop]);

  // Heal float trigger
  const healEffectRef = useRef(healEffect);
  healEffectRef.current = healEffect;
  useEffect(() => {
    const h = healEffect;
    if (!h || h.count === 0 || !h.origin) return;
    healFloatsRef.current.push({
      born: performance.now(),
      originX: h.origin.x,
      originY: h.origin.y,
      label: h.label ?? '+HP',
      driftX: (Math.random() - 0.5) * 30,
    });
    runLoop();
  }, [healEffect?.count, runLoop]);

  // Skill ring activation — record start time and kick rAF
  useEffect(() => {
    if (skillRing?.active) {
      ringStartRef.current = performance.now();
      runLoop();
    }
  }, [skillRing?.active, runLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      sparksRef.current = [];
      ripplesRef.current = [];
      floatsRef.current = [];
      healFloatsRef.current = [];
    };
  }, []);

  const handleRingPress = useCallback(() => {
    const ring = skillRingRef.current;
    if (!ring?.active || ring.attempted) return;
    const elapsed = performance.now() - ringStartRef.current;
    const angle = ((elapsed / ring.speedMs) * 360) % 360;
    const relAngle = ((angle - ring.successZoneStart) + 360) % 360;
    const hit = relAngle < ring.successZoneDeg;
    if (hit) ring.onSuccess(); else ring.onFail();
  }, []);

  const ringInteractive = !!skillRing?.active && !skillRing.attempted;
  const ringSize = skillRing?.size ?? 220;

  return (
    <View style={styles.bleedRoot}>
      <Animated.View style={[styles.hittable, style, { transform: [{ scale: pulseScale }] }]}>
        {children}
      </Animated.View>
      <View
        pointerEvents={ringInteractive ? "box-none" : "none"}
        style={[StyleSheet.absoluteFill, styles.canvasLayer]}
        onLayout={onLayout}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: layout.w || undefined,
            height: layout.h || undefined,
            pointerEvents: "none",
          }}
        />
        {ringInteractive && (
          <View style={[StyleSheet.absoluteFill, styles.ringPressLayer]} pointerEvents="box-none">
            <Pressable
              onPressIn={handleRingPress}
              style={{ width: ringSize, height: ringSize }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bleedRoot: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
    minHeight: 0,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  hittable: {
    position: "relative",
    zIndex: 0,
  },
  canvasLayer: {
    zIndex: 1,
  },
  ringPressLayer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
