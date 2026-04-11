import type { MetalsState } from './METALS';
import { getCachedRemoteConfig, getFormulaConstants } from './remoteConfig';

export type ModuleId = 'surge' | 'warp' | 'dispel';

export type ModuleDefinition = {
  id: ModuleId;
  name: string;
  icon: string;
  lore: string;
  cost: Partial<MetalsState>;
  ultName: string;
  ultDescription: string;
  ultDurationMs: number;
  hitsToCharge: number;
};

export function getMaxModuleLevel(): number {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.modules.maxLevel;
}

export function getModules(): ModuleDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.modules.definitions.map((m) => ({
    ...m,
    id: m.id as ModuleId,
    cost: m.cost as Partial<MetalsState>,
  }));
}

export function getModuleById(id: ModuleId): ModuleDefinition {
  const mod = getModules().find((m) => m.id === id);
  if (!mod) throw new Error(`Unknown module id: ${id}`);
  return mod;
}

export function computeModuleUpgradeCost(currentLevel: number): Partial<MetalsState> {
  const fc = getFormulaConstants();
  const amount = Math.floor(fc.MODULE_COST_BASE * Math.pow(fc.MODULE_COST_EXP, currentLevel - 1));
  return currentLevel % 2 === 1 ? { voidCrystal: amount } : { echoShard: amount };
}

export function getMaxUltsPerBattle(level: number): number {
  if (level <= 0) return 0;
  if (level >= getMaxModuleLevel()) return 6;
  return Math.ceil(level / 10);
}
