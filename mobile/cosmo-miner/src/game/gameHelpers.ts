import { getCannons } from './CANNONS';
import { getResearchNodes } from './RESEARCH';
import { getShips } from './SHIPS';
import { computePlayerLevel } from './PLAYER';
import { getUpgrades, type UpgradeId } from './UPGRADES';
import { getPlanetIdsForSector } from './SECTORS';
import type { GameState, GameStateInit, UpgradesState } from './types';
import type { MetalId } from './METALS';

export type UnlockToast = {
  id: string;
  title: string;
  text: string;
  image?: number;
  images?: number[];
  headerEmoji?: string;
};

export const TIMELY_CLAIM_WINDOW_MS = 10 * 60 * 1000;

export function computeInitialShownSectorUnlocks(
  initial?: GameStateInit
): Set<number> {
  const shown = new Set<number>();
  const unlocked = initial?.unlockedPlanetIds ?? [];
  for (let sectorId = 2; sectorId <= 100; sectorId++) {
    if (
      getPlanetIdsForSector(sectorId - 1).every((id) => unlocked.includes(id))
    ) {
      shown.add(sectorId);
    }
  }
  return shown;
}

export function computeInitialShownUnlocks(initial?: GameStateInit): Set<string> {
  const shown = new Set<string>();
  const iron = initial?.metals?.iron ?? 0;
  const titan = initial?.metals?.titan ?? 0;
  const iridium = initial?.metals?.iridium ?? 0;
  if (iron > 0) shown.add('metal_iron');
  if (titan > 0) {
    shown.add('metal_titan');
    shown.add('ship_cruiser');
    shown.add('cannon_titan');
  }
  if (iridium > 0) {
    shown.add('metal_iridium');
    shown.add('ship_dreadnought');
    shown.add('cannon_iridium');
  }
  if (iron > 0 && titan > 0 && iridium > 0) {
    shown.add('ship_flagship');
    shown.add('cannon_alloy');
  }
  const voidCrystal = initial?.metals?.voidCrystal ?? 0;
  const echoShard = initial?.metals?.echoShard ?? 0;
  if (voidCrystal > 0 || echoShard > 0) {
    shown.add('sector3_metals');
  }
  const initialLevel = computePlayerLevel(initial?.playerXP ?? 0);
  for (const ship of getShips()) {
    if (ship.unlockLevel > 1 && initialLevel >= ship.unlockLevel) {
      shown.add(`ship_${ship.id}`);
    }
  }
  for (const node of getResearchNodes()) {
    if (initialLevel >= node.requiredLevel) {
      shown.add(`research_unlock_${node.id}`);
    }
  }
  return shown;
}

export function createDefaultUpgradesState(): UpgradesState {
  const result = {} as UpgradesState;
  for (const upg of getUpgrades()) result[upg.id as UpgradeId] = 0;
  return result;
}

export function computeBaseShipDamage(fleet: GameState['fleet']): number {
  if (!fleet.selectedShipId) return 0;
  const shipDef = getShips().find((s) => s.id === fleet.selectedShipId);
  const ownedShip = fleet.ownedShips.find(
    (s) => s.shipId === fleet.selectedShipId
  );
  if (!shipDef || !ownedShip || ownedShip.broken) return 0;
  const cannonDamage = getCannons().reduce((sum, c) => {
    const level = ownedShip.cannons[c.id] ?? 0;
    const scale = level > 0 ? Math.pow(1.6, level) : 0;
    return sum + c.damagePerLevel * scale;
  }, 0);
  return Math.floor((1 + cannonDamage) * shipDef.damageMultiplier);
}

export function mergeDiscovered(
  current: MetalId[],
  metals: Record<string, number>
): MetalId[] {
  const newOnes = (Object.keys(metals) as MetalId[]).filter(
    (k) => metals[k] > 0 && !current.includes(k)
  );
  return newOnes.length > 0 ? [...current, ...newOnes] : current;
}
