import { PLANETS, type PlanetDefinition, type PlanetId } from "./PLANETS";
import { UPGRADES, type UpgradeId, type UpgradeDefinition } from "./UPGRADES";
import type { UpgradesState } from "./types";

export type DerivedStats = {
  clickPower: number; // energy per click
  passiveRate: number; // energy per second (already includes planet bonus)
  baseClickPower: number; // without planet bonus
  basePassiveRate: number; // without planet bonus
  planetBonus: number;
};

function getPlanetByIdLoose(id: PlanetId): PlanetDefinition {
  const p = PLANETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

export function computeStats(args: {
  upgrades: UpgradesState;
  selectedPlanetId: PlanetId;
}): DerivedStats {
  const { upgrades, selectedPlanetId } = args;

  let baseClickPower = 1; // clickPow starts from 1 in v2
  let basePassiveRate = 0;

  for (const upg of UPGRADES) {
    const level = upgrades[upg.id] ?? 0;
    if (upg.clickBonus) baseClickPower += upg.clickBonus * level;
    if (upg.passiveBonus) basePassiveRate += upg.passiveBonus * level;
  }

  const planet = getPlanetByIdLoose(selectedPlanetId);
  const planetBonus = planet.bonus;

  return {
    clickPower: baseClickPower * planetBonus,
    passiveRate: basePassiveRate * planetBonus,
    baseClickPower,
    basePassiveRate,
    planetBonus,
  };
}

export function computeUpgradesBought(upgrades: UpgradesState): number {
  let sum = 0;
  for (const upgId in upgrades) {
    sum += upgrades[upgId as unknown as UpgradeId] ?? 0;
  }
  return sum;
}

