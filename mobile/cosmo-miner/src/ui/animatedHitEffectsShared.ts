import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type HitEffectPoint = { x: number; y: number };

export type AnimatedHitEffectsProps = {
  trigger: number;
  origin?: HitEffectPoint;
  damage: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export const SPARK_COLORS = [
  "#ff3300",
  "#ff6600",
  "#ff9900",
  "#ffcc00",
  "#ff4444",
  "#ff8800",
  "#ffdd00",
  "#ff2255",
] as const;
