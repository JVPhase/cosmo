import { PLANETS, type PlanetDefinition, type PlanetId } from "./PLANETS";
import { UPGRADES, type UpgradeDefinition, type UpgradeId } from "./UPGRADES";
import type { UpgradesState } from "./types";

export type DerivedStats = {
  clickPower: number;
  passiveRate: number; // per second
  clickMultiplier: number;
  passiveMultiplier: number;
};

function getPlanetByIdLoose(id: PlanetId): PlanetDefinition {
  const p = PLANETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

export function computeStats(args: {
  upgrades: UpgradesState;
  unlockedPlanetIds: PlanetId[];
}): DerivedStats {
  const { upgrades, unlockedPlanetIds } = args;

  let baseClickPower = 1;
  let basePassiveRate = 0;

  for (const upg of UPGRADES) {
    const level = upgrades[upg.id] ?? 0;
    if ("baseClick" in upg && upg.baseClick) baseClickPower += upg.baseClick * level;
    if ("basePassive" in upg && upg.basePassive) basePassiveRate += upg.basePassive * level;
  }

  let clickMultiplier = 1;
  let passiveMultiplier = 1;
  for (const planetId of unlockedPlanetIds) {
    const planet = getPlanetByIdLoose(planetId);
    clickMultiplier *= planet.clickMultiplier;
    passiveMultiplier *= planet.passiveMultiplier;
  }

  return {
    clickPower: baseClickPower * clickMultiplier,
    passiveRate: basePassiveRate * passiveMultiplier,
    clickMultiplier,
    passiveMultiplier,
  };
}

export function computeUpgradesBought(upgrades: UpgradesState): number {
  let sum = 0;
  for (const upgId in upgrades) {
    sum += upgrades[upgId as unknown as UpgradeId] ?? 0;
  }
  return sum;
}

