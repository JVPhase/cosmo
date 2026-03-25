import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

const PADDING = 8;
const ORBIT_RADIUS = 150;
const CENTER = 150 + PADDING;
const CONTAINER = 300 + PADDING * 2;
const ORBIT_PERIOD_MS = 14000;
const BEAM_PULSE_PERIOD_MS = 1400;
const FLOAT_DURATION_MS = 1000;
const FLOAT_INTERVAL_MS = 1600;

type FloatParticle = { born: number; x: number };

type Props = {
  passiveRate: number;
  mineColor: string;
};

export function PassiveMiningFx({ passiveRate, mineColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const floatsRef = useRef<FloatParticle[]>([]);
  const lastSpawnRef = useRef<number>(0);

  const passiveRef = useRef(passiveRate);
  passiveRef.current = passiveRate;
  const mineColorRef = useRef(mineColor);
  mineColorRef.current = mineColor;

  // Setup canvas once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CONTAINER * dpr);
    canvas.height = Math.round(CONTAINER * dpr);
    canvas.style.width = `${CONTAINER}px`;
    canvas.style.height = `${CONTAINER}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxRef.current = ctx;
    }
  }, []);

  // rAF loop — always running to draw orbit ring + drone
  useEffect(() => {
    const step = (now: number) => {
      const ctx = ctxRef.current;
      if (!ctx) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      const passive = passiveRef.current;
      const color = mineColorRef.current;

      // Drone angle — both ring and beam use this same value
      const elapsed = (now - startTimeRef.current) % ORBIT_PERIOD_MS;
      const angle = (elapsed / ORBIT_PERIOD_MS) * Math.PI * 2 - Math.PI / 2;
      const dx = CENTER + ORBIT_RADIUS * Math.cos(angle);
      const dy = CENTER + ORBIT_RADIUS * Math.sin(angle);

      // Spawn float particles when passive > 0
      if (passive > 0 && now - lastSpawnRef.current >= FLOAT_INTERVAL_MS) {
        lastSpawnRef.current = now;
        floatsRef.current.push({ born: now, x: CENTER + (Math.random() * 36 - 18) });
      }

      // Expire old floats
      floatsRef.current = floatsRef.current.filter(
        (f) => now - f.born < FLOAT_DURATION_MS
      );

      ctx.clearRect(0, 0, CONTAINER, CONTAINER);

      // Orbit ring
      ctx.save();
      ctx.strokeStyle = 'rgba(0,212,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, ORBIT_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Drone dot
      ctx.save();
      ctx.fillStyle = 'rgba(0,212,255,0.7)';
      ctx.beginPath();
      ctx.arc(dx, dy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (passive > 0) {
        // Beam: drone → center with pulsing opacity gradient
        const beamOpacity =
          0.1 + 0.2 * Math.abs(Math.sin((now / BEAM_PULSE_PERIOD_MS) * Math.PI));
        const grad = ctx.createLinearGradient(dx, dy, CENTER, CENTER);
        grad.addColorStop(0, `rgba(0,212,255,${beamOpacity.toFixed(3)})`);
        grad.addColorStop(0.6, `rgba(0,212,255,${(beamOpacity * 0.4).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(0,212,255,0)');
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(CENTER, CENTER);
        ctx.stroke();
        ctx.restore();
      }

      // Floating particles
      for (const f of floatsRef.current) {
        const t = (now - f.born) / FLOAT_DURATION_MS;
        const y = CENTER - 55 * t;
        const opacity = (1 - t) * 0.85;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(f.x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      floatsRef.current = [];
      ctxRef.current?.clearRect(0, 0, CONTAINER, CONTAINER);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container} pointerEvents="none">
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', left: 0, top: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: CONTAINER,
    height: CONTAINER,
    left: -PADDING,
    top: -PADDING,
    pointerEvents: 'none'
  }
});
