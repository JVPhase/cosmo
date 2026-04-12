import type { AchievementId } from "./ACHIEVEMENTS";
import type { CharacterId } from "./CHARACTERS";
import type { BattleState } from "./ALIENS";
import type { CannonId } from "./CANNONS";
import type { ActiveExpedition, ExpeditionId } from "./EXPEDITIONS";
import type { MetalId, MetalsState } from "./METALS";
import type { ModuleId } from "./MODULES";
import type { PlanetId } from "./PLANETS";
import type { ResearchId, ResearchState } from "./RESEARCH";
import type { FleetState, OwnedShip, ShipId } from "./SHIPS";
import type { UpgradeId } from "./UPGRADES";
import type { BoostEffect, ShopItemId } from "./SHOP";

export type ActiveBoost = {
  instanceId: string;
  shopItemId: ShopItemId;
  effect: BoostEffect;
  expiresAt: number;
};

export type UpgradesState = Record<UpgradeId, number>;

export type TabsUnlockedState = {
  shipyard: boolean;
  upgrades: boolean;
  planets: boolean;
};

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
  tabsUnlocked: TabsUnlockedState;
  moduleLevels: Partial<Record<ModuleId, number>>;
  chosenCharacterId: CharacterId | null;
  battlesWon: number;
  battleWinStreak: number;
  credits: number;
  activeBoosts: ActiveBoost[];
  characterMessageHistory: string[];
  greetingShown: boolean;
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
      equippedModuleId?: ModuleId | null;
    }>;
    selectedShipId?: ShipId | null;
  };
  battle?: BattleState | null;
  playerXP?: number;
  research?: ResearchState;
  expeditions?: ActiveExpedition[];
  tabsUnlocked?: Partial<TabsUnlockedState>;
  moduleLevels?: Partial<Record<ModuleId, number>>;
  chosenCharacterId?: CharacterId | null;
  battlesWon?: number;
  battleWinStreak?: number;
  credits?: number;
  activeBoosts?: ActiveBoost[];
  characterMessageHistory?: string[];
  greetingShown?: boolean;
};

/**
 * Canonical save envelope — V2.
 * mobile is the sole writer; server stores and returns this blob as-is.
 *   version:          2 (contract version, for server validation)
 *   savedAt:          timestamp of last local snapshot (ms since epoch)
 *   appliedGrantSeq:  last Grant seq mobile has applied (used as sync cursor)
 *   state:            full gameplay snapshot
 */
export type GameplaySaveEnvelopeV2 = {
  version: 2;
  savedAt: number;
  appliedGrantSeq: number;
  state: GameStateInit;
};

export type { ActiveExpedition, BattleState, CharacterId, FleetState, MetalsState, ModuleId, OwnedShip, ResearchId, ResearchState };
