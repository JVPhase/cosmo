import type { MetalId, MetalsState } from './METALS';
import { getCachedRemoteConfig, getFormulaConstants, type RemoteCannon } from './remoteConfig';


export type CannonId = 'standard' | 'titan' | 'iridium' | 'alloy';

export type CannonDefinition = {
  id: CannonId;
  name: string;
  icon: string;
  image: number;
  damagePerLevel: number;
  baseCost: Partial<MetalsState>;
  lore: string;
};

export const CANNONS: readonly CannonDefinition[] = [
  {
    id: 'standard',
    name: 'Стандартная пушка',
    icon: '🔫',
    image: require('../../assets/standartcanon.png'),
    damagePerLevel: 5,
    baseCost: { iron: 25 },
    lore: 'Выдаётся согласно приказу №112-В. Гарантия 3 месяца. На замену — форма ОРУ-4.'
  },
  {
    id: 'titan',
    name: 'Титановая пушка',
    icon: '⚙️',
    image: require('../../assets/titancanon.png'),
    damagePerLevel: 20,
    baseCost: { titan: 20 },
    lore: 'Усиленный корпус. Одобрена комиссией по вооружению. Комиссия не пережила испытаний.'
  },
  {
    id: 'iridium',
    name: 'Иридиевая пушка',
    icon: '🔮',
    image: require('../../assets/iridiumcanon.png'),
    damagePerLevel: 60,
    baseCost: { iridium: 15 },
    lore: 'Иридиевый сплав нестабилен при температуре ниже 4000К. Не проблема — вы летите к звезде.'
  },
  {
    id: 'alloy',
    name: 'Сплавная пушка',
    icon: '💥',
    image: require('../../assets/alloycanon.png'),
    damagePerLevel: 200,
    baseCost: { iron: 20, titan: 20, iridium: 20 },
    lore: 'Засекречена в 14 галактиках. Разработана отделом, которого официально не существует.'
  }
] as const;

export type CannonResolved = {
  id: CannonId;
  name: string;
  icon: string;
  image: number;
  damagePerLevel: number;
  baseCost: Partial<MetalsState>;
  lore: string;
};

/** Возвращает список пушек с числовыми полями из remote-конфига (или локальные значения). */
export function getCannons(): CannonResolved[] {
  const remoteCannons = getCachedRemoteConfig()?.cannons as RemoteCannon[] | undefined;
  const base = CANNONS as unknown as CannonResolved[];
  if (!remoteCannons) return base;
  return base.map((local) => {
    const r = remoteCannons.find((x) => x.id === local.id);
    if (!r) return local;
    return { ...local, damagePerLevel: r.damagePerLevel, baseCost: r.baseCost as Partial<MetalsState> };
  });
}

export function computeCannonCost(
  cannon: { baseCost: Partial<MetalsState> },
  currentLevel: number
): Partial<MetalsState> {
  const factor = Math.pow(getFormulaConstants().CANNON_COST_EXP, currentLevel);
  const result: Partial<MetalsState> = {};
  for (const [key, amount] of Object.entries(cannon.baseCost) as [
    MetalId,
    number
  ][]) {
    result[key] = Math.floor(amount * factor);
  }
  return result;
}
