import { getBattleDurationMs } from "./ALIENS";
import { getFormulaConstants } from './remoteConfig';
import { getPlanetById, type PlanetDefinition, type PlanetId } from "./PLANETS";
import { computeResearchEffects, type ResearchState } from "./RESEARCH";
import { getUpgrades, type UpgradeId } from "./UPGRADES";
import type { MetalId } from "./METALS";
import type { ActiveBoost, UpgradesState } from "./types";

function getBoostMultiplier(boosts: ActiveBoost[], stat: ActiveBoost["effect"]["stat"]): number {
  const now = Date.now();
  let multiplier = 1;
  for (const b of boosts) {
    if (b.effect.stat === stat && b.expiresAt > now) {
      multiplier *= b.effect.multiplier;
    }
  }
  return multiplier;
}

function getBoostAdditive(boosts: ActiveBoost[], stat: ActiveBoost["effect"]["stat"]): number {
  const now = Date.now();
  let bonus = 0;
  for (const b of boosts) {
    if (b.effect.stat === stat && b.expiresAt > now) {
      bonus += b.effect.multiplier - 1;
    }
  }
  return bonus;
}

export type DerivedStats = {
  // ── Mining ──
  clickPower: number;                  // energy per click (with all bonuses)
  passiveRate: number;                 // energy per second (with all bonuses)
  baseClickPower: number;              // without planet bonus or research
  basePassiveRate: number;             // without planet bonus or research
  planetBonus: number;
  metalDropBonus: number;              // flat bonus added to each metal drop roll
  specificMetalDropBonus: Partial<Record<MetalId, number>>;
  // ── Battle ──
  battleTimerMs: number;               // total battle duration in ms
  damageResearchMultiplier: number;    // 1.0 + research damage bonuses
  battleRegenBlockMs: number;          // ms enemy regen blocked after each hit
  critChance: number;                  // fraction, 0–1
  critMultiplier: number;              // bonus multiplier on crit (additive to base ×1)
  // ── Expedition ──
  expeditionTimeReduction: number;     // fraction, e.g. 0.5 = half duration
  expeditionYieldBonus: number;        // additive multiplier on metal rewards
  expeditionSlotBonus: number;         // extra concurrent expedition slots
  // ── Modules ──
  moduleChargeReduction: number;       // fraction reduction of hits to charge
  moduleEffectBonus: number;           // additive bonus to module duration/effect
  moduleSlotBonus: number;             // extra equippable module slots
  // ── Special ──
  xpMultiplierBonus: number;           // additive XP multiplier
  upgradeCostReduction: number;        // fraction reduction of upgrade/planet costs
};

function getPlanetByIdLoose(id: PlanetId): PlanetDefinition {
  const p = getPlanetById(id);
  return p;
}

export function computeStats(args: {
  upgrades: UpgradesState;
  selectedPlanetId: PlanetId;
  research: ResearchState;
  activeBoosts?: ActiveBoost[];
}): DerivedStats {
  const { upgrades, selectedPlanetId, research, activeBoosts = [] } = args;

  let baseClickPower = 1;
  let basePassiveRate = 0;

  const fc = getFormulaConstants();
  for (const upg of getUpgrades()) {
    const level = upgrades[upg.id as UpgradeId] ?? 0;
    // Экспоненциальная прогрессия: каждый уровень в 1.6× сильнее предыдущего
    // level 1 = 1.6×, level 2 = 2.56×, level 5 = 10.5×, level 10 = 109×
    const scale = level > 0 ? Math.pow(fc.UPGRADE_POWER_EXP, level) : 0;
    if (upg.clickBonus) baseClickPower += upg.clickBonus * scale;
    if (upg.passiveBonus) basePassiveRate += upg.passiveBonus * scale;
  }

  const planet = getPlanetByIdLoose(selectedPlanetId);
  const planetBonus = planet.bonus;

  const fx = computeResearchEffects(research);

  return {
    clickPower: baseClickPower * (1 + fx.clickMultiplierBonus) * getBoostMultiplier(activeBoosts, "clickMultiplier"),
    passiveRate: basePassiveRate * (1 + fx.passiveMultiplierBonus) * getBoostMultiplier(activeBoosts, "passiveMultiplier"),
    baseClickPower,
    basePassiveRate,
    planetBonus,
    metalDropBonus: fx.metalDropBonus + getBoostAdditive(activeBoosts, "metalDropBonus"),
    specificMetalDropBonus: fx.specificMetalDropBonus,
    battleTimerMs: getBattleDurationMs(),
    damageResearchMultiplier: (1 + fx.damageMultiplierBonus) * getBoostMultiplier(activeBoosts, "damageMultiplier"),
    battleRegenBlockMs: fx.battleRegenBlockMs,
    critChance: fx.critChance,
    critMultiplier: fx.critMultiplier,
    expeditionTimeReduction: fx.expeditionTimeReduction,
    expeditionYieldBonus: fx.expeditionYieldBonus,
    expeditionSlotBonus: fx.expeditionSlotBonus,
    moduleChargeReduction: fx.moduleChargeReduction,
    moduleEffectBonus: fx.moduleEffectBonus,
    moduleSlotBonus: fx.moduleSlotBonus,
    xpMultiplierBonus: fx.xpMultiplierBonus,
    upgradeCostReduction: fx.upgradeCostReduction,
  };
}

export function computeUpgradesBought(upgrades: UpgradesState): number {
  let sum = 0;
  for (const upgId in upgrades) {
    sum += upgrades[upgId as unknown as UpgradeId] ?? 0;
  }
  return sum;
}
