import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";
import { SPARK_COLORS } from "./animatedHitEffectsShared";

export type { AnimatedHitEffectsProps } from "./animatedHitEffectsShared";

const SPARK_COUNT = 14;
const RIPPLE_COUNT = 3;
const RIPPLE_DELAY_MS = 60;
const RIPPLE_DURATION_MS = 550;
const RIPPLE_BASE_RADIUS = 26;
const FLOAT_PHASE1_MS = 120;
const FLOAT_PHASE2_MS = 700;
const EFFECT_MAX_AGE_MS = 900;

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

/** Web: pulse на ракете; искры, кольца и урон — canvas поверх (pointerEvents: none). */
export function AnimatedHitEffects({
  trigger,
  origin,
  damage,
  style,
  children,
}: AnimatedHitEffectsProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<SparkFx[]>([]);
  const ripplesRef = useRef<RippleFx[]>([]);
  const floatsRef = useRef<FloatFx[]>([]);
  const rafRef = useRef<number | null>(null);

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

    ctx.clearRect(0, 0, lw, lh);

    for (const p of sparksRef.current) {
      const age = now - p.born;
      if (age < 0 || age >= p.duration) continue;
      const t = age / p.duration;
      const dist = p.dist * t;
      const x = p.originX + Math.cos(p.angle) * dist;
      const y = p.originY + Math.sin(p.angle) * dist;
      const scaleSpark = 1 - t;
      let opacity: number;
      if (age < 80) {
        opacity = 1;
      } else {
        opacity = 1 - (age - 80) / (p.duration - 80);
      }
      opacity = Math.max(0, opacity);
      const r = (p.size / 2) * scaleSpark;
      if (r <= 0.05) continue;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const r of ripplesRef.current) {
      const age = now - r.born - r.delayMs;
      if (age < 0 || age >= RIPPLE_DURATION_MS) continue;
      const t = age / RIPPLE_DURATION_MS;
      const k = r.rippleIndex;
      const scale = 0.2 + t * (3.5 + k * 0.4 - 0.2);
      const opacity = 0.9 * (1 - t);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = r.strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.originX, r.originY, RIPPLE_BASE_RADIUS * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const floatTotalMs = FLOAT_PHASE1_MS + FLOAT_PHASE2_MS;
    for (const f of floatsRef.current) {
      const age = now - f.born;
      if (age < 0 || age > floatTotalMs) continue;

      let scale: number;
      let opacity: number;
      let ty: number;
      let tx: number;

      if (age < FLOAT_PHASE1_MS) {
        const t1 = age / FLOAT_PHASE1_MS;
        scale = 0.5 + 0.8 * t1;
        opacity = clamp01(age / 100);
        ty = -20 * t1;
        tx = 0;
      } else {
        const t2 = clamp01((age - FLOAT_PHASE1_MS) / FLOAT_PHASE2_MS);
        scale = 1.3 - 0.4 * t2;
        opacity = 1 - t2;
        ty = -20 - 60 * t2;
        tx = f.driftX * t2;
      }

      const text = `⚔️ ${f.value}`;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = '900 17px system-ui, -apple-system, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(255,100,0,0.9)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ff4400";
      ctx.fillText(text, f.originX + tx, f.originY + ty);
      ctx.restore();
    }
  };

  const runLoop = () => {
    const step = (t: number) => {
      drawFrame(t);
      const alive =
        sparksRef.current.length + ripplesRef.current.length + floatsRef.current.length > 0;
      if (alive) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(step);
    }
  };

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
      sparksRef.current.push({
        born,
        originX: x0,
        originY: y0,
        angle,
        dist,
        color,
        size,
        duration,
      });
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
  }, [trigger, originMemo, damage]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      sparksRef.current = [];
      ripplesRef.current = [];
      floatsRef.current = [];
    };
  }, []);

  return (
    <View style={styles.bleedRoot}>
      <Animated.View style={[styles.hittable, style, { transform: [{ scale: pulseScale }] }]}>
        {children}
      </Animated.View>
      <View
        pointerEvents="none"
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
          }}
        />
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
});
