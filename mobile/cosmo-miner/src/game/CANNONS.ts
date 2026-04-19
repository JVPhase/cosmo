import type { MetalId, MetalsState } from './METALS';
import { getCachedRemoteConfig, getFormulaConstants } from './remoteConfig';

export type CannonId = 'standard' | 'titan' | 'iridium' | 'alloy';

export type CannonDefinition = {
  id: CannonId;
  nameKey: string;
  icon: string;
  image: number;
  damagePerLevel: number;
  baseCost: Partial<MetalsState>;
  loreKey: string;
};

const IMAGE_REGISTRY: Record<string, number> = {
  standartcanon: require('../../assets/standartcanon.png'),
  titancanon: require('../../assets/titancanon.png'),
  iridiumcanon: require('../../assets/iridiumcanon.png'),
  alloycanon: require('../../assets/alloycanon.png'),
};

export function getCannons(): CannonDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.cannons.map((c) => ({
    ...c,
    id: c.id as CannonId,
    image: IMAGE_REGISTRY[c.imageKey] ?? 0,
    baseCost: c.baseCost as Partial<MetalsState>,
  }));
}

export function computeCannonCost(
  cannon: { baseCost: Partial<MetalsState> },
  currentLevel: number,
): Partial<MetalsState> {
  const factor = Math.pow(getFormulaConstants().CANNON_COST_EXP, currentLevel);
  const result: Partial<MetalsState> = {};
  for (const [key, amount] of Object.entries(cannon.baseCost) as [MetalId, number][]) {
    result[key] = Math.floor(amount * factor);
  }
  return result;
}
