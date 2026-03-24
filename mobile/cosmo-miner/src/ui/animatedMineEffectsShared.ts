import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type MineTapPoint = { x: number; y: number };

export type AnimatedMineEffectsProps = {
  trigger: number;
  origin?: MineTapPoint;
  clickPower: number;
  mineColor: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export const MINE_DOT_COLORS = [
  "#ffd700",
  "#ff6b35",
  "#00d4ff",
  "#7fff00",
  "#ff4da6",
] as const;
