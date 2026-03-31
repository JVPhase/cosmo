import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { formatNum } from "../game/formatNum";
import type { AnimatedMineEffectsProps } from "./animatedMineEffectsShared";
import { MINE_DOT_COLORS } from "./animatedMineEffectsShared";

export type { AnimatedMineEffectsProps } from "./animatedMineEffectsShared";

const PARTICLE_DURATION_MS = 700;
const PARTICLE_FADE_MS = 650;
const RIPPLE_DURATION_MS = 600;
const FLOAT_DURATION_MS = 900;
const EFFECT_MAX_AGE_MS = 950;
const PARTICLE_COUNT = 10;
const RIPPLE_BASE_RADIUS = 29;

type ParticleFx = {
  born: number;
  originX: number;
  originY: number;
  angle: number;
  dist: number;
  color: string;
};

type RippleFx = {
  born: number;
  originX: number;
  originY: number;
  scaleMax: number;
};

type FloatFx = {
  born: number;
  originX: number;
  originY: number;
  value: number;
};

function clamp01(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
}

/** Web: pulse через RN Animated; частицы, рябы и числа — один canvas + rAF. */
export function AnimatedMineEffects({
  trigger,
  origin,
  clickPower,
  mineColor,
  style,
  children,
}: AnimatedMineEffectsProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ParticleFx[]>([]);
  const ripplesRef = useRef<RippleFx[]>([]);
  const floatsRef = useRef<FloatFx[]>([]);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const mineColorRef = useRef(mineColor);
  mineColorRef.current = mineColor;

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
      ctxRef.current = ctx;
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
    const { w: lw, h: lh } = layoutRef.current;
    if (lw <= 0 || lh <= 0) return;

    const ctx = ctxRef.current;
    if (!ctx) return;

    const mc = mineColorRef.current;

    particlesRef.current = particlesRef.current.filter(
      (p) => now - p.born < EFFECT_MAX_AGE_MS,
    );
    ripplesRef.current = ripplesRef.current.filter(
      (r) => now - r.born < EFFECT_MAX_AGE_MS,
    );
    floatsRef.current = floatsRef.current.filter(
      (f) => now - f.born < EFFECT_MAX_AGE_MS,
    );

    ctx.clearRect(0, 0, lw, lh);

    for (const r of ripplesRef.current) {
      const age = now - r.born;
      if (age < 0 || age >= RIPPLE_DURATION_MS) continue;
      const t = age / RIPPLE_DURATION_MS;
      const scale = t * r.scaleMax;
      const opacity = 1 - t;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = mc;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.originX, r.originY, RIPPLE_BASE_RADIUS * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of particlesRef.current) {
      const age = now - p.born;
      if (age < 0 || age >= PARTICLE_DURATION_MS) continue;
      const tMove = age / PARTICLE_DURATION_MS;
      const dist = p.dist * tMove;
      const x = p.originX + Math.cos(p.angle) * dist;
      const y = p.originY + Math.sin(p.angle) * dist;
      const opacity = 1 - clamp01(age / PARTICLE_FADE_MS);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const f of floatsRef.current) {
      const age = now - f.born;
      if (age < 0 || age >= FLOAT_DURATION_MS) continue;
      const t = age / FLOAT_DURATION_MS;
      const ty = -62 * t;
      const opacity = 1 - t;
      const text = `+${formatNum(f.value)}`;
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.font = '900 16px system-ui, -apple-system, sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(120,60,0,0.85)";
      ctx.lineWidth = 3;
      ctx.strokeText(text, f.originX, f.originY + ty);
      ctx.fillStyle = "#ffd700";
      ctx.fillText(text, f.originX, f.originY + ty);
      ctx.restore();
    }
  };

  const runLoop = () => {
    const step = (t: number) => {
      drawFrame(t);
      const alive =
        particlesRef.current.length +
          ripplesRef.current.length +
          floatsRef.current.length >
        0;
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
    pulseScale.setValue(1);
    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.08,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulseScale, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start();

    if (!originMemo) return;

    const born = performance.now();
    const x0 = originMemo.x;
    const y0 = originMemo.y;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angleDeg = (360 / PARTICLE_COUNT) * i + (Math.random() * 24 - 12);
      const angle = (angleDeg * Math.PI) / 180;
      const dist = Math.random() * 70 + 25;
      const color =
        MINE_DOT_COLORS[Math.floor(Math.random() * MINE_DOT_COLORS.length)]!;
      particlesRef.current.push({
        born,
        originX: x0,
        originY: y0,
        angle,
        dist,
        color,
      });
    }

    for (let k = 0; k < 2; k++) {
      ripplesRef.current.push({
        born,
        originX: x0,
        originY: y0,
        scaleMax: 3.2 + k * 0.3,
      });
    }

    floatsRef.current.push({
      born,
      originX: x0,
      originY: y0,
      value: clickPower,
    });

    runLoop();
  }, [trigger, originMemo, pulseScale, clickPower]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      particlesRef.current = [];
      ripplesRef.current = [];
      floatsRef.current = [];
    };
  }, []);

  return (
    <View style={styles.bleedRoot}>
      <Animated.View
        style={[styles.root, style, { transform: [{ scale: pulseScale }] }]}
      >
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
  root: {
    position: "relative",
    zIndex: 0,
  },
  canvasLayer: {
    zIndex: 1,
  },
});
