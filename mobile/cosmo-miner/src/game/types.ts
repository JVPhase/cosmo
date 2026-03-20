import type { AchievementId } from "./ACHIEVEMENTS";
import type { PlanetId } from "./PLANETS";
import type { UpgradeId } from "./UPGRADES";

export type UpgradesState = Record<UpgradeId, number>;

export type AchievementsState = {
  unlockedIds: AchievementId[];
};

export type GameState = {
  energy: number;
  totalEarned: number;
  clicks: number;
  upgrades: UpgradesState;
  unlockedPlanetIds: PlanetId[];
  selectedPlanetId: PlanetId;
  achievements: AchievementsState;
};

export type GameStateInit = Partial<GameState> & {
  upgrades?: Partial<UpgradesState>;
  achievements?: Partial<AchievementsState>;
};

