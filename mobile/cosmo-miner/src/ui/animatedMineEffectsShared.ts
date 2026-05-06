import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type MineTapPoint = { x: number; y: number };

/**
 * Metal "+amount" float passed in from the parent; rendered inside
 * AnimatedMineEffects' SVG (native) / canvas (web). Animation timing is driven
 * internally based on `born`.
 */
export type MetalFloatRenderItem = {
  id: number;
  /** Date.now() when the float should start animating. */
  born: number;
  amount: number;
  /** Horizontal offset from the asteroid center, in px. */
  offsetX: number;
  /** require()-style asset id for the metal icon. */
  image: number;
};

export type AnimatedMineEffectsProps = {
  trigger: number;
  origin?: MineTapPoint;
  clickPower: number;
  mineColor: string;
  /**
   * Passive mining rate. Drives the orbit drone speed, beam visibility and the
   * frequency of rising mineral particles.
   */
  passiveRate?: number;
  /**
   * Planet/asteroid image asset (require()-style id). Rendered inside the SVG
   * (native) / canvas (web) between the passive FX and the click effects so it
   * sits behind ripples/click-floats but in front of the orbit drone & beam.
   */
  planetImage?: number;
  metalFloats?: readonly MetalFloatRenderItem[];
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
