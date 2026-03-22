import type { MetalId, MetalsState } from "./METALS";

export type CannonId = "standard" | "titan" | "iridium" | "alloy";

export type CannonDefinition = {
  id: CannonId;
  name: string;
  icon: string;
  damagePerLevel: number;
  baseCost: Partial<MetalsState>;
  lore: string;
};

export const CANNONS: readonly CannonDefinition[] = [
  {
    id: "standard",
    name: "Стандартная пушка",
    icon: "🔫",
    damagePerLevel: 5,
    baseCost: { iron: 25 },
    lore: "Выдаётся согласно приказу №112-В. Гарантия 3 месяца. На замену — форма ОРУ-4.",
  },
  {
    id: "titan",
    name: "Титановая пушка",
    icon: "⚙️",
    damagePerLevel: 20,
    baseCost: { titan: 20 },
    lore: "Усиленный корпус. Одобрена комиссией по вооружению. Комиссия не пережила испытаний.",
  },
  {
    id: "iridium",
    name: "Иридиевая пушка",
    icon: "🔮",
    damagePerLevel: 60,
    baseCost: { iridium: 15 },
    lore: "Иридиевый сплав нестабилен при температуре ниже 4000К. Не проблема — вы летите к звезде.",
  },
  {
    id: "alloy",
    name: "Сплавная пушка",
    icon: "💥",
    damagePerLevel: 200,
    baseCost: { iron: 30, titan: 20, iridium: 10 },
    lore: "Засекречена в 14 галактиках. Разработана отделом, которого официально не существует.",
  },
] as const;

export function computeCannonCost(cannon: CannonDefinition, currentLevel: number): Partial<MetalsState> {
  const factor = Math.pow(1.4, currentLevel);
  const result: Partial<MetalsState> = {};
  for (const [key, amount] of Object.entries(cannon.baseCost) as [MetalId, number][]) {
    result[key] = Math.floor(amount * factor);
  }
  return result;
}
