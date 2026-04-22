import { getCachedRemoteConfig } from './remoteConfig';
import type { AchievementTargetConfig } from './remoteConfig';

export type AchievementId = number;

export type AchievementTarget = AchievementTargetConfig;

export type AchievementDefinition = {
  id: AchievementId;
  nameKey: string;
  icon: string;
  target: AchievementTarget;
  loreKey: string;
};

export function getAchievementClaimCredits(): number {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.achievements.claimCredits;
}

export function getAchievements(): AchievementDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.achievements.data as AchievementDefinition[];
}

export function getAchievementById(id: AchievementId): AchievementDefinition {
  const a = getAchievements().find((x) => x.id === id);
  if (!a) throw new Error(`Unknown achievement id: ${id}`);
  return a;
}
