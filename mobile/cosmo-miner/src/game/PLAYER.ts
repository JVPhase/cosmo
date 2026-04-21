import {
  computePlayerLevel as _canonicalComputeLevel,
  xpAtLevelStart as _canonicalXpAtLevelStart,
  xpForNextLevel as _canonicalXpForNextLevel,
} from '@cosmo/game-config';
import { getCachedRemoteConfig } from './remoteConfig';
import { t } from './i18n';

export function getXpThresholds(): readonly number[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.player.xpThresholds;
}

export function getMaxLevel(): number {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.player.maxLevel;
}

export function computePlayerLevel(xp: number): number {
  return _canonicalComputeLevel(xp, getXpThresholds(), getMaxLevel());
}

export function getPlayerTitle(level: number): string {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  const titles: string[] = config.player.titles;
  const maxLevel = config.player.maxLevel;
  const key = titles[Math.min(level, maxLevel) - 1] ?? titles[titles.length - 1]!;
  return t('config.' + key);
}

/** Total XP needed to reach the START of this level. */
export function xpAtLevelStart(level: number): number {
  return _canonicalXpAtLevelStart(level, getXpThresholds());
}

/** Total XP needed to reach the NEXT level, or null if already at max. */
export function xpForNextLevel(level: number): number | null {
  return _canonicalXpForNextLevel(level, getXpThresholds(), getMaxLevel());
}
