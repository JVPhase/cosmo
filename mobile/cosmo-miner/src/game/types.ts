import type { AchievementId } from "./ACHIEVEMENTS";
import type { PlanetId } from "./PLANETS";
import type { UpgradeId } from "./UPGRADES";

export type UpgradesState = Record<UpgradeId, number>;

export type AchievementsState = {
  unlockedIds: AchievementId[];
};

export type GameSettings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  language: "ru";
};

export type GameState = {
  energy: number;
  totalEarned: number;
  upgrades: UpgradesState;
  unlockedPlanetIds: PlanetId[];
  achievements: AchievementsState;
  settings: GameSettings;
};

export type GameStateInit = Partial<GameState> & {
  upgrades?: Partial<UpgradesState>;
  achievements?: Partial<AchievementsState>;
  settings?: Partial<GameSettings>;
};

