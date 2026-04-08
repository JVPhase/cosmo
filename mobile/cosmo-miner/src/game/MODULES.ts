import type { MetalsState } from "./METALS";
import { getCachedRemoteConfig, getFormulaConstants, type RemoteModuleDef } from './remoteConfig';

export const MAX_MODULE_LEVEL = 50;

/** Возвращает максимальный уровень модуля из remote-конфига (или локальное значение). */
export function getMaxModuleLevel(): number {
  return getCachedRemoteConfig()?.modules?.maxLevel ?? MAX_MODULE_LEVEL;
}

export function computeModuleUpgradeCost(currentLevel: number): Partial<MetalsState> {
  const fc = getFormulaConstants();
  const amount = Math.floor(fc.MODULE_COST_BASE * Math.pow(fc.MODULE_COST_EXP, currentLevel - 1));
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

/** Возвращает список модулей с числовыми полями из remote-конфига (или локальные значения). */
export function getModules(): ModuleDefinition[] {
  const remoteDefs = getCachedRemoteConfig()?.modules?.definitions as RemoteModuleDef[] | undefined;
  const base = MODULES as unknown as ModuleDefinition[];
  if (!remoteDefs) return base;
  return base.map((local) => {
    const r = remoteDefs.find((x) => x.id === local.id);
    if (!r) return local;
    return { ...local, cost: r.cost as Partial<MetalsState>, ultDurationMs: r.ultDurationMs, hitsToCharge: r.hitsToCharge };
  });
}

export function getModuleById(id: ModuleId): ModuleDefinition {
  const mod = getModules().find((m) => m.id === id);
  if (!mod) throw new Error(`Unknown module id: ${id}`);
  return mod;
}
