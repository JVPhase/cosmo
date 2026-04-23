import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export type SkillCheckRingProps = {
  active: boolean;
  speedMs: number;
  successZoneDeg: number;
  successZoneStart: number; // 0 = top, clockwise
  attempted: boolean;
  onSuccess: () => void;
  onFail: () => void;
  size?: number;
};

const DEG = Math.PI / 180;
const toCanvasRad = (deg: number) => (deg - 90) * DEG;

// Extra pixels on each side so the needle tip and glow don't get clipped
const PAD = 20;

export function SkillCheckRing({
  active,
  speedMs,
  successZoneDeg,
  successZoneStart,
  attempted,
  onSuccess,
  onFail,
  size = 240,
}: SkillCheckRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const resultRef = useRef<'success' | 'fail' | null>(null);
  const resultTimeRef = useRef<number>(0);

  useEffect(() => {
    if (active) {
      startTimeRef.current = Date.now();
      resultRef.current = null;
    }
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const canvasSize = size + PAD * 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvasSize * dpr);
    canvas.height = Math.round(canvasSize * dpr);
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;

    const cx = canvasSize / 2;
    const cy = canvasSize / 2;
    const ringRadius = size / 2;      // matches ship circle border exactly
    const ringWidth = 7;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Background ring
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = ringWidth;
      ctx.stroke();

      // Success zone arc (red)
      ctx.beginPath();
      ctx.arc(
        cx, cy, ringRadius,
        toCanvasRad(successZoneStart),
        toCanvasRad(successZoneStart + successZoneDeg)
      );
      ctx.strokeStyle = 'rgba(255,60,60,0.9)';
      ctx.lineWidth = ringWidth;
      ctx.shadowColor = '#ff3c3c';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rotating needle
      const elapsed = Date.now() - startTimeRef.current;
      const needleDeg = (elapsed / speedMs * 360) % 360;
      const needleRad = toCanvasRad(needleDeg);
      const needleInner = ringRadius - ringWidth / 2 - 3;
      const needleOuter = ringRadius + ringWidth / 2 + 6;

      ctx.beginPath();
      ctx.moveTo(cx + needleInner * Math.cos(needleRad), cy + needleInner * Math.sin(needleRad));
      ctx.lineTo(cx + needleOuter * Math.cos(needleRad), cy + needleOuter * Math.sin(needleRad));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, speedMs, successZoneDeg, successZoneStart, size]);

  const handlePress = () => {
    if (!active || attempted) return;
    const elapsed = Date.now() - startTimeRef.current;
    const angle = (elapsed / speedMs * 360) % 360;
    const relAngle = ((angle - successZoneStart) + 360) % 360;
    const hit = relAngle < successZoneDeg;
    resultRef.current = hit ? 'success' : 'fail';
    resultTimeRef.current = Date.now();
    if (hit) onSuccess(); else onFail();
  };

  if (!active) return null;

  const canvasSize = size + PAD * 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Canvas is larger than the view and centered via negative offset */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: -PAD,
          left: -PAD,
          width: canvasSize,
          height: canvasSize,
          pointerEvents: 'none',
        }}
      />
      <Pressable onPressIn={handlePress} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'visible',
  },
});
