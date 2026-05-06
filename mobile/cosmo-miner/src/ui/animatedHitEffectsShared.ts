import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type HitEffectPoint = { x: number; y: number };

export type SkillRingConfig = {
  active: boolean;
  speedMs: number;
  successZoneDeg: number;
  successZoneStart: number;
  attempted: boolean;
  onSuccess: () => void;
  onFail: () => void;
  size?: number;
};

export type HealEffectState = {
  count: number;
  origin?: HitEffectPoint;
  label?: string;
};

export type AnimatedHitEffectsProps = {
  trigger: number;
  origin?: HitEffectPoint;
  damage: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  skillRing?: SkillRingConfig;
  healEffect?: HealEffectState;
};
