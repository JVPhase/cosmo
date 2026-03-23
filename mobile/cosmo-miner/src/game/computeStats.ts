import { BATTLE_DURATION_MS } from "./ALIENS";
import { PLANETS, type PlanetDefinition, type PlanetId } from "./PLANETS";
import { computeResearchEffects, type ResearchState } from "./RESEARCH";
import { UPGRADES, type UpgradeId } from "./UPGRADES";
import type { UpgradesState } from "./types";

export type DerivedStats = {
  clickPower: number;         // energy per click (with all bonuses)
  passiveRate: number;        // energy per second (with all bonuses)
  baseClickPower: number;     // without planet bonus or research
  basePassiveRate: number;    // without planet bonus or research
  planetBonus: number;
  metalDropBonus: number;     // flat bonus added to each metal drop roll
  battleTimerMs: number;      // total battle duration in ms
  damageResearchMultiplier: number; // 1.0 + research damage bonuses
};

function getPlanetByIdLoose(id: PlanetId): PlanetDefinition {
  const p = PLANETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

export function computeStats(args: {
  upgrades: UpgradesState;
  selectedPlanetId: PlanetId;
  research: ResearchState;
}): DerivedStats {
  const { upgrades, selectedPlanetId, research } = args;

  let baseClickPower = 1;
  let basePassiveRate = 0;

  for (const upg of UPGRADES) {
    const level = upgrades[upg.id] ?? 0;
    if (upg.clickBonus) baseClickPower += upg.clickBonus * level;
    if (upg.passiveBonus) basePassiveRate += upg.passiveBonus * level;
  }

  const planet = getPlanetByIdLoose(selectedPlanetId);
  const planetBonus = planet.bonus;

  const fx = computeResearchEffects(research);

  return {
    clickPower: baseClickPower * planetBonus * (1 + fx.clickMultiplierBonus),
    passiveRate: basePassiveRate * planetBonus * (1 + fx.passiveMultiplierBonus),
    baseClickPower,
    basePassiveRate,
    planetBonus,
    metalDropBonus: fx.metalDropBonus,
    battleTimerMs: BATTLE_DURATION_MS + fx.battleTimerBonus,
    damageResearchMultiplier: 1 + fx.damageMultiplierBonus,
  };
}

export function computeUpgradesBought(upgrades: UpgradesState): number {
  let sum = 0;
  for (const upgId in upgrades) {
    sum += upgrades[upgId as unknown as UpgradeId] ?? 0;
  }
  return sum;
}

