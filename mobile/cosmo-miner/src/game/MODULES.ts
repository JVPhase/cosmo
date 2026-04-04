import type { MetalsState } from "./METALS";
import { FORMULA_CONSTANTS } from '@cosmo/game-config';

export const MAX_MODULE_LEVEL = 50;

export function computeModuleUpgradeCost(currentLevel: number): Partial<MetalsState> {
  const amount = Math.floor(FORMULA_CONSTANTS.MODULE_COST_BASE * Math.pow(FORMULA_CONSTANTS.MODULE_COST_EXP, currentLevel - 1));
  return currentLevel % 2 === 1
    ? { voidCrystal: amount }
    : { echoShard: amount };
}

export function getMaxUltsPerBattle(level: number): number {
  if (level <= 0) return 0;
  if (level >= MAX_MODULE_LEVEL) return 6;
  return Math.ceil(level / 10);
}

export type ModuleId = "surge" | "warp" | "dispel";

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

export const MODULES: readonly ModuleDefinition[] = [
  {
    id: "surge",
    name: "Ядро Всплеска",
    icon: "⚡",
    lore: "Кристаллы Пустоты нестабильны. Учёные назвали это «особенностью». Министерство — «документацией к проекту».",
    cost: { voidCrystal: 30 },
    ultName: "Всплеск",
    ultDescription: "×5 к урону на 8 сек",
    ultDurationMs: 8_000,
    hitsToCharge: 35,
  },
  {
    id: "warp",
    name: "Варп-Привод",
    icon: "⏱️",
    lore: "Осколки Эха искажают локальное время. Форма согласования с хронобюро заняла 3 года. Иронично.",
    cost: { echoShard: 30 },
    ultName: "Варп",
    ultDescription: "+20 сек к таймеру боя",
    ultDurationMs: 0,
    hitsToCharge: 40,
  },
  {
    id: "dispel",
    name: "Глаз Фантома",
    icon: "👁️",
    lore: "Рассеивает иллюзии. Разработан после третьей жалобы от экипажа, лечившего противника вместо атаки.",
    cost: { voidCrystal: 20, echoShard: 20 },
    ultName: "Рассеять",
    ultDescription: "Разрушить иллюзию + иммунитет 12 сек",
    ultDurationMs: 12_000,
    hitsToCharge: 25,
  },
] as const;

export function getModuleById(id: ModuleId): ModuleDefinition {
  const mod = MODULES.find((m) => m.id === id);
  if (!mod) throw new Error(`Unknown module id: ${id}`);
  return mod;
}
