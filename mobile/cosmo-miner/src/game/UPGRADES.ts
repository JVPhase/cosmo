export const UPGRADES = [
  { id: 1, name: "Лазерный бур", desc: "+1 к клику", icon: "⚡", baseCost: 50, baseClick: 1 },
  { id: 2, name: "Дрон-шахтёр", desc: "+2/сек", icon: "🤖", baseCost: 120, basePassive: 2 },
  { id: 3, name: "Орбитальная пушка", desc: "+5 к клику", icon: "🛸", baseCost: 500, baseClick: 5 },
  { id: 4, name: "Автономная станция", desc: "+10/сек", icon: "🏗️", baseCost: 1200, basePassive: 10 },
  { id: 5, name: "Варп-экстрактор", desc: "+25 к клику", icon: "🌀", baseCost: 5000, baseClick: 25 },
] as const;

export type UpgradeDefinition = (typeof UPGRADES)[number];
export type UpgradeId = UpgradeDefinition["id"];

export function getUpgradeById(id: UpgradeId): UpgradeDefinition {
  const upg = UPGRADES.find((u) => u.id === id);
  if (!upg) throw new Error(`Unknown upgrade id: ${id}`);
  return upg;
}

export function computeUpgradeCost(upg: UpgradeDefinition, level: number): number {
  return Math.floor(upg.baseCost * Math.pow(1.5, level));
}

