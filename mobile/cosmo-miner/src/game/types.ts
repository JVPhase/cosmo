import type { AchievementId } from "./ACHIEVEMENTS";
import type { BattleState } from "./ALIENS";
import type { CannonId } from "./CANNONS";
import type { ActiveExpedition, ExpeditionId } from "./EXPEDITIONS";
import type { MetalId, MetalsState } from "./METALS";
import type { PlanetId } from "./PLANETS";
import type { ResearchId, ResearchState } from "./RESEARCH";
import type { FleetState, OwnedShip, ShipId } from "./SHIPS";
import type { UpgradeId } from "./UPGRADES";

export type UpgradesState = Record<UpgradeId, number>;

export type AchievementsState = {
  unlockedIds: AchievementId[];
  claimedIds: AchievementId[];
};

export type GameState = {
  energy: number;
  totalEarned: number;
  clicks: number;
  upgrades: UpgradesState;
  unlockedPlanetIds: PlanetId[];
  selectedPlanetId: PlanetId;
  achievements: AchievementsState;
  metals: MetalsState;
  discoveredMetals: MetalId[];
  fleet: FleetState;
  battle: BattleState | null;
  playerXP: number;
  research: ResearchState;
  expeditions: ActiveExpedition[];
};

export type GameStateInit = {
  energy?: number;
  totalEarned?: number;
  clicks?: number;
  upgrades?: Partial<UpgradesState>;
  unlockedPlanetIds?: PlanetId[];
  selectedPlanetId?: PlanetId;
  achievements?: { unlockedIds?: AchievementId[]; claimedIds?: AchievementId[] };
  metals?: Partial<Record<MetalId, number>>;
  discoveredMetals?: MetalId[];
  fleet?: {
    ownedShips?: Array<{
      shipId: ShipId;
      broken?: boolean;
      cannons?: Partial<Record<CannonId, number>>;
    }>;
    selectedShipId?: ShipId | null;
  };
  battle?: BattleState | null;
  playerXP?: number;
  research?: ResearchState;
  expeditions?: ActiveExpedition[];
};

export type { ActiveExpedition, BattleState, FleetState, MetalsState, OwnedShip, ResearchId, ResearchState };
