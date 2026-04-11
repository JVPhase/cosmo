import type { MetalId } from './METALS';
import { getCachedRemoteConfig } from './remoteConfig';

export type ResearchId = string;

export type ResearchBranch = 'mining' | 'battle' | 'expedition' | 'metallurgy' | 'modules' | 'special';

export type ResearchEffect =
  // Mining / general
  | { type: 'clickMultiplier'; value: number }
  | { type: 'passiveMultiplier'; value: number }
  | { type: 'metalDropBonus'; value: number }
  // Battle
  | { type: 'damageMultiplier'; value: number }
  | { type: 'battleRegenBlock'; value: number }
  | { type: 'critChance'; value: number }
  | { type: 'critMultiplier'; value: number }
  // Expedition
  | { type: 'expeditionTimeReduction'; value: number }
  | { type: 'expeditionYieldBonus'; value: number }
  | { type: 'expeditionSlotBonus'; value: number }
  // Metallurgy
  | { type: 'specificMetalDropBonus'; metalId: MetalId; value: number }
  // Modules
  | { type: 'moduleChargeReduction'; value: number }
  | { type: 'moduleEffectBonus'; value: number }
  | { type: 'moduleSlotBonus'; value: number }
  // Special
  | { type: 'xpMultiplierBonus'; value: number }
  | { type: 'upgradeCostReduction'; value: number };

export type ResearchNode = {
  id: ResearchId;
  name: string;
  icon: string;
  branch: ResearchBranch;
  requiredLevel: number;
  energyCost: number;
  requires: ResearchId[];
  effect: ResearchEffect;
  lore: string;
};

export type ResearchState = Partial<Record<ResearchId, boolean>>;

export function getResearchNodes(): ResearchNode[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.research as unknown as ResearchNode[];
}

export function getResearchById(id: ResearchId): ResearchNode {
  const r = getResearchNodes().find((x) => x.id === id);
  if (!r) throw new Error(`Unknown research id: ${id}`);
  return r;
}

export type ComputedResearchEffects = {
  clickMultiplierBonus: number;
  passiveMultiplierBonus: number;
  metalDropBonus: number;
  damageMultiplierBonus: number;
  battleRegenBlockMs: number;
  critChance: number;
  critMultiplier: number;
  expeditionTimeReduction: number;
  expeditionYieldBonus: number;
  expeditionSlotBonus: number;
  specificMetalDropBonus: Partial<Record<MetalId, number>>;
  moduleChargeReduction: number;
  moduleEffectBonus: number;
  moduleSlotBonus: number;
  xpMultiplierBonus: number;
  upgradeCostReduction: number;
};

export function computeResearchEffects(research: ResearchState): ComputedResearchEffects {
  let clickMultiplierBonus = 0;
  let passiveMultiplierBonus = 0;
  let metalDropBonus = 0;
  let damageMultiplierBonus = 0;
  let battleRegenBlockMs = 0;
  let critChance = 0;
  let critMultiplier = 0;
  let expeditionTimeReduction = 0;
  let expeditionYieldBonus = 0;
  let expeditionSlotBonus = 0;
  const specificMetalDropBonus: Partial<Record<MetalId, number>> = {};
  let moduleChargeReduction = 0;
  let moduleEffectBonus = 0;
  let moduleSlotBonus = 0;
  let xpMultiplierBonus = 0;
  let upgradeCostReduction = 0;

  for (const node of getResearchNodes()) {
    if (!research[node.id]) continue;
    const effect = node.effect;
    switch (effect.type) {
      case 'clickMultiplier':         clickMultiplierBonus += effect.value; break;
      case 'passiveMultiplier':       passiveMultiplierBonus += effect.value; break;
      case 'metalDropBonus':          metalDropBonus += effect.value; break;
      case 'damageMultiplier':        damageMultiplierBonus += effect.value; break;
      case 'battleRegenBlock':        battleRegenBlockMs = Math.max(battleRegenBlockMs, effect.value); break;
      case 'critChance':              critChance += effect.value; break;
      case 'critMultiplier':          critMultiplier += effect.value; break;
      case 'expeditionTimeReduction': expeditionTimeReduction += effect.value; break;
      case 'expeditionYieldBonus':    expeditionYieldBonus += effect.value; break;
      case 'expeditionSlotBonus':     expeditionSlotBonus += effect.value; break;
      case 'specificMetalDropBonus':
        specificMetalDropBonus[effect.metalId] =
          (specificMetalDropBonus[effect.metalId] ?? 0) + effect.value;
        break;
      case 'moduleChargeReduction':   moduleChargeReduction += effect.value; break;
      case 'moduleEffectBonus':       moduleEffectBonus += effect.value; break;
      case 'moduleSlotBonus':         moduleSlotBonus += effect.value; break;
      case 'xpMultiplierBonus':       xpMultiplierBonus += effect.value; break;
      case 'upgradeCostReduction':    upgradeCostReduction += effect.value; break;
    }
  }

  return {
    clickMultiplierBonus,
    passiveMultiplierBonus,
    metalDropBonus,
    damageMultiplierBonus,
    battleRegenBlockMs,
    critChance: Math.min(critChance, 1),
    critMultiplier,
    expeditionTimeReduction: Math.min(expeditionTimeReduction, 0.9),
    expeditionYieldBonus,
    expeditionSlotBonus,
    specificMetalDropBonus,
    moduleChargeReduction: Math.min(moduleChargeReduction, 0.9),
    moduleEffectBonus,
    moduleSlotBonus,
    xpMultiplierBonus,
    upgradeCostReduction: Math.min(upgradeCostReduction, 0.75),
  };
}
