/**
 * Pure prestige helpers — no React imports, safe to use in tests.
 */
import type { GameState, PrestigeState } from './types';

export const PRESTIGE_ENERGY_BONUS_PER = 0.10;  // +10% energy per prestige
export const PRESTIGE_METAL_BONUS_PER  = 0.02;  // +2pp metal drop per prestige
export const PRESTIGE_ATTACK_BONUS_PER = 0.08;  // +8% attack per prestige
export const PRESTIGE_LEVEL_THRESHOLD  = 30;

export const DEFAULT_PRESTIGE_STATE: PrestigeState = {
  count: 0,
  energyBonus: 0,
  metalDropBonus: 0,
  attackBonus: 0,
};

/** Compute cumulative prestige bonuses for a given prestige count. */
export function computePrestigeState(count: number): PrestigeState {
  return {
    count,
    energyBonus:    count * PRESTIGE_ENERGY_BONUS_PER,
    metalDropBonus: count * PRESTIGE_METAL_BONUS_PER,
    attackBonus:    count * PRESTIGE_ATTACK_BONUS_PER,
  };
}

export type PrestigeBlockedReason =
  | 'level_too_low'
  | 'active_battle'
  | 'active_expeditions';

/** Returns null when prestige is fully available, or the blocking reason. */
export function getPrestigeBlockedReason(
  playerLevel: number,
  hasBattle: boolean,
  hasActiveExpeditions: boolean,
): PrestigeBlockedReason | null {
  if (playerLevel < PRESTIGE_LEVEL_THRESHOLD) return 'level_too_low';
  if (hasBattle) return 'active_battle';
  if (hasActiveExpeditions) return 'active_expeditions';
  return null;
}

/**
 * Apply prestige reset:
 *   - increments prestige count and recalculates bonuses
 *   - spreads defaultRunState to reset all run-progress fields
 *   - restores meta-progress: achievements, credits, activeBoosts
 *
 * `defaultRunState` must have `prestige` set to DEFAULT_PRESTIGE_STATE
 * (as produced by the initial defaultState in useGame).
 */
export function applyPrestigeReset(
  prev: GameState,
  defaultRunState: GameState,
): GameState {
  const newCount = prev.prestige.count + 1;
  return {
    ...defaultRunState,
    prestige:     computePrestigeState(newCount),
    achievements: prev.achievements,
    credits:      prev.credits,
    activeBoosts: prev.activeBoosts,
  };
}
