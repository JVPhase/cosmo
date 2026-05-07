import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Asset } from "expo-asset";
import { formatNum } from "../game/formatNum";
import type {
  AnimatedMineEffectsProps,
  MetalFloatRenderItem,
} from "./animatedMineEffectsShared";
import { MINE_DOT_COLORS } from "./animatedMineEffectsShared";

export type { AnimatedMineEffectsProps } from "./animatedMineEffectsShared";

const PARTICLE_DURATION_MS = 700;
const PARTICLE_FADE_MS = 650;
const RIPPLE_DURATION_MS = 600;
const FLOAT_DURATION_MS = 900;
const METAL_FLOAT_DURATION_MS = 1000;
const METAL_FLOAT_RISE = 90;
const METAL_FLOAT_START_OFFSET_Y = -71;
const METAL_FLOAT_MAX_AGE_MS = 1100;
const METAL_ICON_SIZE = 16;
const METAL_TEXT_FONT_SIZE = 14;
const METAL_TEXT_GAP = 4;
const EFFECT_MAX_AGE_MS = 950;
const PARTICLE_COUNT = 10;
const RIPPLE_BASE_RADIUS = 29;
/** Pixels added on each side of bleedRoot so we can draw above/around the asteroid. */
const CANVAS_OVERFLOW = 130;

// ── Passive mining FX (orbit drone + beam + rising mineral particles) ──────
const PASSIVE_ORBIT_RADIUS = 150;
const PASSIVE_DRONE_RADIUS = 5;
const PASSIVE_FLOAT_RISE = 55;
const PASSIVE_FLOAT_DURATION_MS = 1000;
const PASSIVE_FLOAT_INTERVAL_MS = 1600;
const PASSIVE_FLOAT_RADIUS = 2.5;
const PASSIVE_FLOAT_X_JITTER = 36;
const PASSIVE_ORBIT_PERIOD_MS = 14000;
const PASSIVE_BEAM_PULSE_PERIOD_MS = 1400;
const PASSIVE_BEAM_WIDTH = 1.5;
const PASSIVE_RING_COLOR = "rgba(0,212,255,0.3)";
const PASSIVE_DRONE_COLOR = "rgba(0,212,255,0.7)";

function passiveOrbitPeriodMs(passive: number): number {
  if (passive <= 0) return PASSIVE_ORBIT_PERIOD_MS;
  return Math.max(
    PASSIVE_ORBIT_PERIOD_MS / (1 + Math.log10(Math.max(1, passive)) * 0.5),
    PASSIVE_ORBIT_PERIOD_MS / 4,
  );
}

const imageCache = new Map<string, HTMLImageElement>();

/**
 * Resolves a require()-style asset id (or a string URL / `{ uri }` object) to
 * an HTMLImageElement, cached by URI. Triggers an async load on first sight;
 * the canvas redraw loop will pick it up once `image.complete` becomes true.
 *
 * NOTE: `react-native-web` >= 0.21 removed `Image.resolveAssetSource`, so we
 * rely on `expo-asset`'s `Asset.fromModule` which works on both native and web.
 */
function resolveAssetUri(
  source: number | string | { uri?: string } | null | undefined,
): string | null {
  if (source == null) return null;
  if (typeof source === "string") return source;
  if (typeof source === "object") {
    return typeof source.uri === "string" ? source.uri : null;
  }
  if (typeof source === "number") {
    try {
      const asset = Asset.fromModule(source);
      return asset?.localUri ?? asset?.uri ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

function getCachedAssetImage(source: number): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const uri = resolveAssetUri(source);
  if (!uri) return null;
  let img = imageCache.get(uri);
  if (img) return img;
  img = new window.Image();
  img.decoding = "async";
  img.src = uri;
  imageCache.set(uri, img);
  return img;
}

const ASTEROID_SIZE = 170;
const PLANET_PULSE_SCALE_TO = 1.06;
const PLANET_PULSE_IN_MS = 120;
const PLANET_PULSE_OUT_MS = 190;

/**
 * Draws an image into a square box centered at (cx, cy), preserving its aspect
 * ratio (equivalent to RN's `resizeMode: 'contain'`).
 */
function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  box: number,
): void {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (nw <= 0 || nh <= 0) return;
  const aspect = nw / nh;
  let dw: number;
  let dh: number;
  if (aspect >= 1) {
    dw = box;
    dh = box / aspect;
  } else {
    dh = box;
    dw = box * aspect;
  }
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

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

type MetalFloatFx = {
  id: number;
  born: number;
  amount: number;
  offsetX: number;
  image: HTMLImageElement | null;
};

type PassiveFloatFx = {
  born: number;
  x: number;
};

function clamp01(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t;
}

/** Web: pulse через RN Animated; частицы, рябы, числа, металлические floats, passive‑FX и сама планета — один canvas + rAF. */
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
  const pulseScale = useRef(new Animated.Value(1)).current;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ParticleFx[]>([]);
  const ripplesRef = useRef<RippleFx[]>([]);
  const floatsRef = useRef<FloatFx[]>([]);
  const metalFloatsRef = useRef<MetalFloatFx[]>([]);
  const seenMetalIdsRef = useRef<Set<number>>(new Set());
  const passiveFloatsRef = useRef<PassiveFloatFx[]>([]);
  const passiveLastSpawnRef = useRef(0);
  const passiveStartRef = useRef(0);
  const passiveRateRef = useRef(passiveRate);
  passiveRateRef.current = passiveRate;
  const planetPulseStartRef = useRef<number | null>(null);

  const planetImageEl = useMemo(
    () => (planetImage !== undefined ? getCachedAssetImage(planetImage) : null),
    [planetImage],
  );
  const planetImageRef = useRef(planetImageEl);
  planetImageRef.current = planetImageEl;
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
    const dateNow = Date.now();

    particlesRef.current = particlesRef.current.filter(
      (p) => now - p.born < EFFECT_MAX_AGE_MS,
    );
    ripplesRef.current = ripplesRef.current.filter(
      (r) => now - r.born < EFFECT_MAX_AGE_MS,
    );
    floatsRef.current = floatsRef.current.filter(
      (f) => now - f.born < EFFECT_MAX_AGE_MS,
    );
    metalFloatsRef.current = metalFloatsRef.current.filter(
      (m) => dateNow - m.born < METAL_FLOAT_MAX_AGE_MS,
    );

    ctx.clearRect(0, 0, lw, lh);

    // ── Passive mining FX ───────────────────────────────────────────────────
    {
      const passive = passiveRateRef.current;
      const orbitCenterX = lw / 2;
      const orbitCenterY = lh / 2;

      // Drone angle — derived from a stable "passive start" timestamp so the
      // orbit phase is continuous across rerenders.
      const orbitPeriod = passiveOrbitPeriodMs(passive);
      const elapsed = (now - passiveStartRef.current) % orbitPeriod;
      const angle = (elapsed / orbitPeriod) * Math.PI * 2 - Math.PI / 2;
      const dx = orbitCenterX + PASSIVE_ORBIT_RADIUS * Math.cos(angle);
      const dy = orbitCenterY + PASSIVE_ORBIT_RADIUS * Math.sin(angle);

      // Spawn new mineral particles based on passive rate.
      if (passive > 0) {
        const spawnInterval = Math.max(
          200,
          PASSIVE_FLOAT_INTERVAL_MS / (1 + Math.log10(passive)),
        );
        if (now - passiveLastSpawnRef.current >= spawnInterval) {
          passiveLastSpawnRef.current = now;
          const burst = passive >= 100 ? 2 : 1;
          for (let i = 0; i < burst; i++) {
            passiveFloatsRef.current.push({
              born: now + i,
              x:
                orbitCenterX +
                (Math.random() * PASSIVE_FLOAT_X_JITTER -
                  PASSIVE_FLOAT_X_JITTER / 2),
            });
          }
        }
      }
      passiveFloatsRef.current = passiveFloatsRef.current.filter(
        (f) => now - f.born < PASSIVE_FLOAT_DURATION_MS,
      );

      // Orbit ring (always drawn).
      ctx.save();
      ctx.strokeStyle = PASSIVE_RING_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(orbitCenterX, orbitCenterY, PASSIVE_ORBIT_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Beam (drone → center) with pulsing gradient — only when passive > 0.
      if (passive > 0) {
        const beamOpacity =
          0.1 +
          0.2 *
            Math.abs(
              Math.sin((now / PASSIVE_BEAM_PULSE_PERIOD_MS) * Math.PI),
            );
        const grad = ctx.createLinearGradient(dx, dy, orbitCenterX, orbitCenterY);
        grad.addColorStop(0, `rgba(0,212,255,${beamOpacity.toFixed(3)})`);
        grad.addColorStop(
          0.6,
          `rgba(0,212,255,${(beamOpacity * 0.4).toFixed(3)})`,
        );
        grad.addColorStop(1, "rgba(0,212,255,0)");
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = PASSIVE_BEAM_WIDTH;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(orbitCenterX, orbitCenterY);
        ctx.stroke();
        ctx.restore();
      }

      // Drone dot.
      ctx.save();
      ctx.fillStyle = PASSIVE_DRONE_COLOR;
      ctx.beginPath();
      ctx.arc(dx, dy, PASSIVE_DRONE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Rising mineral particles.
      if (passiveFloatsRef.current.length > 0) {
        for (const f of passiveFloatsRef.current) {
          const t = (now - f.born) / PASSIVE_FLOAT_DURATION_MS;
          if (t < 0 || t >= 1) continue;
          const fy = orbitCenterY - PASSIVE_FLOAT_RISE * t;
          const opacity = (1 - t) * 0.85;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.fillStyle = mc;
          ctx.beginPath();
          ctx.arc(f.x, fy, PASSIVE_FLOAT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // ── Planet image ────────────────────────────────────────────────────────
    {
      const planet = planetImageRef.current;
      if (planet && planet.complete && planet.naturalWidth > 0) {
        const pulseStart = planetPulseStartRef.current;
        let planetScale = 1;
        if (pulseStart != null) {
          const elapsed = now - pulseStart;
          const total = PLANET_PULSE_IN_MS + PLANET_PULSE_OUT_MS;
          if (elapsed >= total) {
            planetPulseStartRef.current = null;
          } else if (elapsed <= PLANET_PULSE_IN_MS) {
            const t = elapsed / PLANET_PULSE_IN_MS;
            planetScale = 1 + (PLANET_PULSE_SCALE_TO - 1) * t;
          } else {
            const t = (elapsed - PLANET_PULSE_IN_MS) / PLANET_PULSE_OUT_MS;
            planetScale = PLANET_PULSE_SCALE_TO - (PLANET_PULSE_SCALE_TO - 1) * t;
          }
        }
        drawImageContain(ctx, planet, lw / 2, lh / 2, ASTEROID_SIZE * planetScale);
      }
    }

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
      ctx.arc(
        r.originX + CANVAS_OVERFLOW,
        r.originY + CANVAS_OVERFLOW,
        RIPPLE_BASE_RADIUS * scale,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }

    for (const p of particlesRef.current) {
      const age = now - p.born;
      if (age < 0 || age >= PARTICLE_DURATION_MS) continue;
      const tMove = age / PARTICLE_DURATION_MS;
      const dist = p.dist * tMove;
      const x = p.originX + CANVAS_OVERFLOW + Math.cos(p.angle) * dist;
      const y = p.originY + CANVAS_OVERFLOW + Math.sin(p.angle) * dist;
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
      ctx.strokeText(
        text,
        f.originX + CANVAS_OVERFLOW,
        f.originY + CANVAS_OVERFLOW + ty,
      );
      ctx.fillStyle = "#ffd700";
      ctx.fillText(
        text,
        f.originX + CANVAS_OVERFLOW,
        f.originY + CANVAS_OVERFLOW + ty,
      );
      ctx.restore();
    }

    if (metalFloatsRef.current.length > 0) {
      // Asteroid is centered in bleedRoot, which is centered in the canvas
      // (canvasLayer extends bleedRoot symmetrically by CANVAS_OVERFLOW on all sides).
      const centerX = lw / 2;
      const centerY = lh / 2;
      const baseY = centerY + METAL_FLOAT_START_OFFSET_Y;

      for (const m of metalFloatsRef.current) {
        const age = dateNow - m.born;
        if (age < 0 || age >= METAL_FLOAT_DURATION_MS) continue;
        const t = age / METAL_FLOAT_DURATION_MS;
        const ty = -METAL_FLOAT_RISE * t;
        const opacity = 1 - t;
        const text = `+${formatNum(m.amount)}`;
        const x = centerX + m.offsetX;
        const y = baseY + ty;

        ctx.save();
        ctx.globalAlpha = opacity;

        if (m.image && m.image.complete && m.image.naturalWidth > 0) {
          ctx.drawImage(
            m.image,
            x - METAL_ICON_SIZE - METAL_TEXT_GAP,
            y - METAL_ICON_SIZE / 2,
            METAL_ICON_SIZE,
            METAL_ICON_SIZE,
          );
        }

        ctx.font = `900 ${METAL_TEXT_FONT_SIZE}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(120,60,0,0.85)";
        ctx.lineWidth = 3;
        ctx.strokeText(text, x - METAL_TEXT_GAP / 2, y);
        ctx.fillStyle = "#ffd700";
        ctx.fillText(text, x - METAL_TEXT_GAP / 2, y);

        ctx.restore();
      }
    }
  };

  // The rAF loop is always-on: passive orbit/drone keep animating regardless
  // of click activity, so it's simpler (and consistent with the standalone
  // PassiveMiningFx) to just keep drawing every frame.
  const startLoop = () => {
    if (rafRef.current != null) return;
    const step = (t: number) => {
      drawFrame(t);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
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
    planetPulseStartRef.current = performance.now();

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
  }, [trigger, originMemo, pulseScale, clickPower]);

  useEffect(() => {
    if (!metalFloats || metalFloats.length === 0) return;
    for (const mf of metalFloats) {
      if (seenMetalIdsRef.current.has(mf.id)) continue;
      seenMetalIdsRef.current.add(mf.id);
      metalFloatsRef.current.push({
        id: mf.id,
        born: mf.born,
        amount: mf.amount,
        offsetX: mf.offsetX,
        image: getCachedAssetImage(mf.image),
      });
    }
    // Drop any seen ids that are no longer present so the set doesn't grow forever.
    if (metalFloats.length < seenMetalIdsRef.current.size) {
      const stillPresent = new Set<number>();
      for (const mf of metalFloats) stillPresent.add(mf.id);
      for (const id of seenMetalIdsRef.current) {
        if (!stillPresent.has(id)) seenMetalIdsRef.current.delete(id);
      }
    }
  }, [metalFloats]);

  // Mount: anchor passive orbit phase and start the always-on rAF loop.
  useEffect(() => {
    passiveStartRef.current = Date.now();
    startLoop();
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      particlesRef.current = [];
      ripplesRef.current = [];
      floatsRef.current = [];
      metalFloatsRef.current = [];
      passiveFloatsRef.current = [];
      seenMetalIdsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        style={styles.canvasLayer}
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
    position: "absolute",
    top: -CANVAS_OVERFLOW,
    left: -CANVAS_OVERFLOW,
    right: -CANVAS_OVERFLOW,
    bottom: -CANVAS_OVERFLOW,
    zIndex: 1,
  },
});
