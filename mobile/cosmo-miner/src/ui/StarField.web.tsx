import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  dimmed?: boolean;
};

export const StarField = React.memo(function StarField({ dimmed = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const opacityScale = dimmed ? 0.5 : 1;
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1 + 0.25;
      const opacity = (Math.random() * 0.5 + 0.2) * opacityScale;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
      ctx.fill();
    }
  }, [dimmed]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
});
