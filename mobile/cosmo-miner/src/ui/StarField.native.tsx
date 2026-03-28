import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';

type Props = {
  dimmed?: boolean;
};

export const StarField = React.memo(function StarField({ dimmed = false }: Props) {
  const { width, height } = useWindowDimensions();

  const stars = useMemo(() => {
    const opacityScale = dimmed ? 0.5 : 1;
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1 + 0.25,
      opacity: (Math.random() * 0.5 + 0.2) * opacityScale,
    }));
  }, [width, height, dimmed]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => (
        <Circle key={s.id} cx={s.x} cy={s.y} r={s.r} color="white" opacity={s.opacity} />
      ))}
    </Canvas>
  );
});
