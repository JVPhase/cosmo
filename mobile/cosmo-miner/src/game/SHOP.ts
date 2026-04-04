import type { MetalId } from "./METALS";
import { FORMULA_CONSTANTS } from '@cosmo/game-config';

export type BoostStat =
  | "clickMultiplier"
  | "passiveMultiplier"
  | "metalDropBonus"
  | "xpMultiplier"
  | "damageMultiplier";

export type BoostEffect = {
  stat: BoostStat;
  multiplier: number;
  durationMs: number;
};

export type ShopCategory = "boosters" | "metals" | "lootboxes" | "converter";

export type LootEntry = {
  metalId: MetalId;
  min: number;
  max: number;
  chance: number;
};

export type ShopItem = {
  id: ShopItemId;
  name: string;
  icon: string;
  category: ShopCategory;
  creditCost: number;
  lore: string;
  boostEffect?: BoostEffect;
  metalReward?: { metalId: MetalId; amount: number }[];
  lootPool?: LootEntry[];
};

export type ShopItemId =
  | "booster_mining_1h"
  | "booster_xp_1h"
  | "booster_metal_1h"
  | "booster_battle_30m"
  | "loot_box_basic"
  | "loot_box_advanced"
  | "loot_box_premium"
  | "metal_iron"
  | "metal_titan"
  | "metal_iridium"
  | "metal_void"
  | "metal_echo"
  | "converter";

const H1 = 60 * 60 * 1000;
const M30 = 30 * 60 * 1000;

export const SHOP: readonly ShopItem[] = [
  // ── Бустеры ──────────────────────────────────────────────────────
  {
    id: "booster_mining_1h",
    name: "Сверхурочная смена",
    icon: "⚡",
    category: "boosters",
    creditCost: 80,
    lore: "Добыча ×2 на 1 час. Отдел труда не в курсе. Они никогда не узнают.",
    boostEffect: { stat: "clickMultiplier", multiplier: 2, durationMs: H1 },
  },
  {
    id: "booster_xp_1h",
    name: "Ускоренный курс",
    icon: "🎓",
    category: "boosters",
    creditCost: 60,
    lore: "Опыт ×2 на 1 час. Академия Галактики выдала сертификат задним числом.",
    boostEffect: { stat: "xpMultiplier", multiplier: 2, durationMs: H1 },
  },
  {
    id: "booster_metal_1h",
    name: "Геологический бум",
    icon: "🔍",
    category: "boosters",
    creditCost: 90,
    lore: "Шанс металлов +50% на 1 час. Планеты стали сговорчивее.",
    boostEffect: { stat: "metalDropBonus", multiplier: 1.5, durationMs: H1 },
  },
  {
    id: "booster_battle_30m",
    name: "Боевой стимулятор",
    icon: "⚔️",
    category: "boosters",
    creditCost: 50,
    lore: "Урон ×1.5 на 30 минут. Медицинский отдел рекомендует не злоупотреблять.",
    boostEffect: { stat: "damageMultiplier", multiplier: 1.5, durationMs: M30 },
  },

  // ── Наборы металлов ───────────────────────────────────────────────
  {
    id: "metal_iron",
    name: "Железный запас",
    icon: "🔩",
    category: "metals",
    creditCost: 30,
    lore: "50 единиц Железа. Стандартная поставка по контракту № Ж-14. Железо прибыло.",
    metalReward: [{ metalId: "iron", amount: 50 }],
  },
  {
    id: "metal_titan",
    name: "Титановая партия",
    icon: "🔷",
    category: "metals",
    creditCost: 70,
    lore: "20 единиц Титана. Ввезено контрабандой через астероидный пояс. Таможня смолчала.",
    metalReward: [{ metalId: "titan", amount: 20 }],
  },
  {
    id: "metal_iridium",
    name: "Иридиевый резерв",
    icon: "💜",
    category: "metals",
    creditCost: 140,
    lore: "10 единиц Иридия. Редкость сертифицирована. Документы в трёх экземплярах.",
    metalReward: [{ metalId: "iridium", amount: 10 }],
  },
  {
    id: "metal_void",
    name: "Кристаллы Пустоты",
    icon: "✨",
    category: "metals",
    creditCost: 250,
    lore: "5 Кристаллов Пустоты. Хранить вдали от реальности. Инструкция по применению отсутствует.",
    metalReward: [{ metalId: "voidCrystal", amount: 5 }],
  },
  {
    id: "metal_echo",
    name: "Осколки Эха",
    icon: "🔊",
    category: "metals",
    creditCost: 250,
    lore: "5 Осколков Эха. Резонируют с вашим кошельком. Кошелёк не возражает.",
    metalReward: [{ metalId: "echoShard", amount: 5 }],
  },

  // ── Лут-боксы ────────────────────────────────────────────────────
  {
    id: "loot_box_basic",
    name: "Стандартный контейнер",
    icon: "📦",
    category: "lootboxes",
    creditCost: 40,
    lore: "Случайный набор базовых металлов. Что внутри — тайна за семью пломбами.",
    lootPool: [
      { metalId: "iron", min: 20, max: 50, chance: 0.8 },
      { metalId: "titan", min: 5, max: 15, chance: 0.5 },
      { metalId: "iridium", min: 2, max: 6, chance: 0.2 },
    ],
  },
  {
    id: "loot_box_advanced",
    name: "Расширенный контейнер",
    icon: "🗃️",
    category: "lootboxes",
    creditCost: 120,
    lore: "Все три базовых металла и шанс редких. Пломб больше, сюрпризов — тоже.",
    lootPool: [
      { metalId: "iron", min: 30, max: 70, chance: 1.0 },
      { metalId: "titan", min: 10, max: 25, chance: 0.9 },
      { metalId: "iridium", min: 5, max: 12, chance: 0.8 },
      { metalId: "voidCrystal", min: 1, max: 4, chance: 0.3 },
      { metalId: "echoShard", min: 1, max: 4, chance: 0.25 },
    ],
  },
  {
    id: "loot_box_premium",
    name: "Премиум контейнер",
    icon: "🏆",
    category: "lootboxes",
    creditCost: 350,
    lore: "Гарантированные редкие металлы. Подписан лично директором. Директор не в курсе.",
    lootPool: [
      { metalId: "iron", min: 50, max: 100, chance: 1.0 },
      { metalId: "titan", min: 20, max: 40, chance: 1.0 },
      { metalId: "iridium", min: 10, max: 20, chance: 1.0 },
      { metalId: "voidCrystal", min: 3, max: 8, chance: 0.8 },
      { metalId: "echoShard", min: 3, max: 8, chance: 0.75 },
    ],
  },

  // ── Конвертер ────────────────────────────────────────────────────
  {
    id: "converter",
    name: "Конвертер ресурсов",
    icon: "🔄",
    category: "converter",
    creditCost: 20,
    lore: "Обмен металлов по курсу 3:1. Курс установлен биржей МММРДР. Курс невыгодный, но официальный.",
  },
] as const;

export function getShopItemById(id: ShopItemId): ShopItem {
  const item = SHOP.find((x) => x.id === id);
  if (!item) throw new Error(`Unknown shop item id: ${id}`);
  return item;
}

/** Conversion chain: iron → titan → iridium → voidCrystal / echoShard */
export const METAL_TIER: Record<MetalId, number> = {
  iron: 0,
  titan: 1,
  iridium: 2,
  voidCrystal: 3,
  echoShard: 3,
};

/** How many of `from` you need to get 1 of `to` (tier must be higher) */
export function getConversionRate(from: MetalId, to: MetalId): number {
  const diff = METAL_TIER[to] - METAL_TIER[from];
  if (diff <= 0) return 0; // invalid direction
  return Math.pow(FORMULA_CONSTANTS.METAL_CONVERSION_RATE, diff);
}

/** Credit cost for a converter operation (scales by tier jump) */
export function getConverterCreditCost(from: MetalId, to: MetalId): number {
  const diff = METAL_TIER[to] - METAL_TIER[from];
  if (diff <= 0) return 0;
  return FORMULA_CONSTANTS.CONVERTER_FEE_PER_TIER * diff;
}

/** Roll loot box rewards, returns metals to add */
export function rollLootBox(pool: LootEntry[]): Partial<Record<MetalId, number>> {
  const result: Partial<Record<MetalId, number>> = {};
  for (const entry of pool) {
    if (Math.random() < entry.chance) {
      const amount = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
      result[entry.metalId] = (result[entry.metalId] ?? 0) + amount;
    }
  }
  return result;
}
