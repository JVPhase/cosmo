/**
 * Canonical XP / level calculators.
 *
 * These are the single source of truth for level computation.
 * Both server (/telegram/me) and mobile should use these instead of
 * local approximations.
 *
 * No remoteConfig dependency — overlay is the caller's responsibility.
 * Pass custom thresholds/maxLevel if the remote config overrides them.
 */
import { XP_THRESHOLDS, MAX_LEVEL } from './player';

/**
 * Computes the player's level from total XP.
 * Optionally accepts remote-config overrides for thresholds and maxLevel.
 */
export function computePlayerLevel(
  xp: number,
  thresholds: readonly number[] = XP_THRESHOLDS,
  maxLevel: number = MAX_LEVEL,
): number {
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  return Math.min(level, maxLevel);
}

/** Total XP needed to enter this level (index = level - 1). */
export function xpAtLevelStart(
  level: number,
  thresholds: readonly number[] = XP_THRESHOLDS,
): number {
  return thresholds[Math.max(0, level - 1)] ?? 0;
}

/** Total XP needed to reach the next level, or null if already at max. */
export function xpForNextLevel(
  level: number,
  thresholds: readonly number[] = XP_THRESHOLDS,
  maxLevel: number = MAX_LEVEL,
): number | null {
  if (level >= maxLevel) return null;
  return thresholds[level] ?? null;
}

/** XP progress within the current level as a value in [0, 1]. */
export function xpProgressFraction(
  xp: number,
  thresholds: readonly number[] = XP_THRESHOLDS,
  maxLevel: number = MAX_LEVEL,
): number {
  const level = computePlayerLevel(xp, thresholds, maxLevel);
  if (level >= maxLevel) return 1;
  const start = xpAtLevelStart(level, thresholds);
  const next = xpForNextLevel(level, thresholds, maxLevel);
  if (next === null || next <= start) return 1;
  return Math.min(1, (xp - start) / (next - start));
}
