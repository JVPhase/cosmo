import type { MetalsState } from './METALS';
import type { CannonId } from './CANNONS';
import type { ModuleId } from './MODULES';
import { getCachedRemoteConfig } from './remoteConfig';

export type ShipId = 'scout' | 'cruiser' | 'dreadnought' | 'flagship';

export type ShipDefinition = {
  id: ShipId;
  name: string;
  icon: string;
  image: number;
  damageMultiplier: number;
  expeditionMultiplier: number;
  unlockLevel: number;
  baseCost: Partial<MetalsState>;
  repairCost: Partial<MetalsState>;
  lore: string;
};

const IMAGE_REGISTRY: Record<string, number> = {
  scoutship: require('../../assets/scoutship.png'),
  cruisership: require('../../assets/cruisership.png'),
  dreadnoughtship: require('../../assets/dreadnoughtship.png'),
  flagship: require('../../assets/flagship.png'),
};

export function getShips(): ShipDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.ships.map((s) => ({
    ...s,
    id: s.id as ShipId,
    image: IMAGE_REGISTRY[s.imageKey] ?? 0,
    baseCost: s.baseCost as Partial<MetalsState>,
    repairCost: s.repairCost as Partial<MetalsState>,
  }));
}

export function getShipById(id: ShipId): ShipDefinition {
  const ship = getShips().find((s) => s.id === id);
  if (!ship) throw new Error(`Unknown ship id: ${id}`);
  return ship;
}

export type OwnedShip = {
  shipId: ShipId;
  broken: boolean;
  cannons: Record<CannonId, number>;
  equippedModuleId: ModuleId | null;
};

export type FleetState = {
  ownedShips: OwnedShip[];
  selectedShipId: ShipId | null;
};

export function createDefaultCannons(): Record<CannonId, number> {
  return { standard: 0, titan: 0, iridium: 0, alloy: 0 };
}

export function createDefaultFleetState(): FleetState {
  return {
    ownedShips: [],
    selectedShipId: null,
  };
}
