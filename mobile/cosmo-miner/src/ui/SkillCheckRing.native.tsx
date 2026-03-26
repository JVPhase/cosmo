import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

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
const toSkiaDeg = (deg: number) => deg - 90;

// Extra pixels on each side so the needle tip doesn't get clipped
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
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [needleDeg, setNeedleDeg] = useState(0);

  const canvasSize = size + PAD * 2;
  const cx = canvasSize / 2;
  const cy = canvasSize / 2;
  const ringRadius = size / 2;   // matches ship circle border exactly
  const ringWidth = 7;

  const ringRect = useMemo(() => ({
    x: cx - ringRadius,
    y: cy - ringRadius,
    width: ringRadius * 2,
    height: ringRadius * 2,
  }), [cx, cy, ringRadius]);

  useEffect(() => {
    if (active) {
      startTimeRef.current = Date.now();
      setNeedleDeg(0);
    }
  }, [active]);

  // rAF loop for needle rotation
  useEffect(() => {
    if (!active) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      setNeedleDeg((elapsed / speedMs * 360) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, speedMs]);

  const bgRingPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(ringRect, 0, 360);
    return p;
  }, [ringRect]);

  const successArcPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc(ringRect, toSkiaDeg(successZoneStart), successZoneDeg);
    return p;
  }, [ringRect, successZoneStart, successZoneDeg]);

  const needlePath = useMemo(() => {
    const rad = toSkiaDeg(needleDeg) * DEG;
    const inner = ringRadius - ringWidth / 2 - 3;
    const outer = ringRadius + ringWidth / 2 + 6;
    const p = Skia.Path.Make();
    p.moveTo(cx + inner * Math.cos(rad), cy + inner * Math.sin(rad));
    p.lineTo(cx + outer * Math.cos(rad), cy + outer * Math.sin(rad));
    return p;
  }, [needleDeg, cx, cy, ringRadius, ringWidth]);

  const handlePress = () => {
    if (!active || attempted) return;
    const elapsed = Date.now() - startTimeRef.current;
    const angle = (elapsed / speedMs * 360) % 360;
    const relAngle = ((angle - successZoneStart) + 360) % 360;
    const hit = relAngle < successZoneDeg;
    if (hit) onSuccess(); else onFail();
  };

  if (!active) return null;

  return (
    // Touch area matches the ship circle (size × size), canvas extends via absolute positioning
    <View style={[styles.container, { width: size, height: size }]}>
      <Canvas style={{
        width: canvasSize,
        height: canvasSize,
        position: 'absolute',
        top: -PAD,
        left: -PAD,
      }}>
        {/* Background ring */}
        <Path
          path={bgRingPath}
          style="stroke"
          strokeWidth={ringWidth}
          color="rgba(255,255,255,0.1)"
        />
        {/* Success zone (red) */}
        <Path
          path={successArcPath}
          style="stroke"
          strokeWidth={ringWidth}
          color="rgba(255,60,60,0.9)"
        />
        {/* Needle */}
        <Path
          path={needlePath}
          style="stroke"
          strokeWidth={3}
          strokeCap="round"
          color="rgba(255,255,255,1)"
        />
      </Canvas>
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
