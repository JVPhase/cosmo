const H1 = 60 * 60 * 1000;
const M30 = 30 * 60 * 1000;

export const SHOP_DATA = [
  // Бустеры
  { id: 'booster_mining_1h',   category: 'boosters', creditCost: 80,  boostEffect: { stat: 'clickMultiplier',   multiplier: 2,   durationMs: H1  } },
  { id: 'booster_xp_1h',       category: 'boosters', creditCost: 60,  boostEffect: { stat: 'xpMultiplier',      multiplier: 2,   durationMs: H1  } },
  { id: 'booster_metal_1h',    category: 'boosters', creditCost: 90,  boostEffect: { stat: 'metalDropBonus',    multiplier: 1.5, durationMs: H1  } },
  { id: 'booster_battle_30m',  category: 'boosters', creditCost: 50,  boostEffect: { stat: 'damageMultiplier',  multiplier: 1.5, durationMs: M30 } },
  // Наборы металлов
  { id: 'metal_iron',    category: 'metals', creditCost: 30,  metalReward: [{ metalId: 'iron',        amount: 50 }] },
  { id: 'metal_titan',   category: 'metals', creditCost: 70,  metalReward: [{ metalId: 'titan',       amount: 20 }] },
  { id: 'metal_iridium', category: 'metals', creditCost: 140, metalReward: [{ metalId: 'iridium',     amount: 10 }] },
  { id: 'metal_void',    category: 'metals', creditCost: 250, metalReward: [{ metalId: 'voidCrystal', amount: 5  }] },
  { id: 'metal_echo',    category: 'metals', creditCost: 250, metalReward: [{ metalId: 'echoShard',   amount: 5  }] },
  // Лут-боксы
  {
    id: 'loot_box_basic',
    category: 'lootboxes',
    creditCost: 40,
    lootPool: [
      { metalId: 'iron',    min: 20, max: 50, chance: 0.8 },
      { metalId: 'titan',   min: 5,  max: 15, chance: 0.5 },
      { metalId: 'iridium', min: 2,  max: 6,  chance: 0.2 },
    ],
  },
  {
    id: 'loot_box_advanced',
    category: 'lootboxes',
    creditCost: 120,
    lootPool: [
      { metalId: 'iron',        min: 30, max: 70, chance: 1.0 },
      { metalId: 'titan',       min: 10, max: 25, chance: 0.9 },
      { metalId: 'iridium',     min: 5,  max: 12, chance: 0.8 },
      { metalId: 'voidCrystal', min: 1,  max: 4,  chance: 0.3 },
      { metalId: 'echoShard',   min: 1,  max: 4,  chance: 0.25 },
    ],
  },
  {
    id: 'loot_box_premium',
    category: 'lootboxes',
    creditCost: 350,
    lootPool: [
      { metalId: 'iron',        min: 50,  max: 100, chance: 1.0 },
      { metalId: 'titan',       min: 20,  max: 40,  chance: 1.0 },
      { metalId: 'iridium',     min: 10,  max: 20,  chance: 1.0 },
      { metalId: 'voidCrystal', min: 3,   max: 8,   chance: 0.8 },
      { metalId: 'echoShard',   min: 3,   max: 8,   chance: 0.75 },
    ],
  },
  // Конвертер
  { id: 'converter', category: 'converter', creditCost: 20 },
] as const;

export const METAL_TIER_DATA: Record<string, number> = {
  iron: 0,
  titan: 1,
  iridium: 2,
  voidCrystal: 3,
  echoShard: 3,
};
