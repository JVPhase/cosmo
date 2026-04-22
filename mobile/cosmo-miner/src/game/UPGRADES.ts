import { getCachedRemoteConfig, getFormulaConstants } from './remoteConfig';

export type UpgradeId = number;

export type UpgradeResolved = {
  id: number;
  nameKey: string;
  icon: string;
  baseCost: number;
  clickBonus: number;
  passiveBonus: number;
  loreKey: string;
};

export type UpgradeDefinition = UpgradeResolved;

export function getUpgrades(): UpgradeResolved[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.upgrades;
}

export function getUpgradeById(id: UpgradeId): UpgradeResolved {
  const upg = getUpgrades().find((u) => u.id === id);
  if (!upg) throw new Error(`Unknown upgrade id: ${id}`);
  return upg;
}

export function computeUpgradeCost(upg: { baseCost: number }, level: number): number {
  return Math.floor(
    upg.baseCost * Math.pow(level + 1, 2) * Math.pow(getFormulaConstants().UPGRADE_COST_EXP, level),
  );
}
