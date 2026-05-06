'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.METAL_TIER_DATA = exports.SHOP_DATA = void 0;
const H1 = 60 * 60 * 1000;
const M30 = 30 * 60 * 1000;
exports.SHOP_DATA = [
  // Бустеры
  {
    id: 'booster_mining_1h',
    category: 'boosters',
    creditCost: 80,
    boostEffect: { stat: 'clickMultiplier', multiplier: 2, durationMs: H1 },
  },
  {
    id: 'booster_xp_1h',
    category: 'boosters',
    creditCost: 60,
    boostEffect: { stat: 'xpMultiplier', multiplier: 2, durationMs: H1 },
  },
  {
    id: 'booster_metal_1h',
    category: 'boosters',
    creditCost: 90,
    boostEffect: { stat: 'metalDropBonus', multiplier: 1.5, durationMs: H1 },
  },
  {
    id: 'booster_battle_30m',
    category: 'boosters',
    creditCost: 50,
    boostEffect: { stat: 'damageMultiplier', multiplier: 1.5, durationMs: M30 },
  },
  // Наборы металлов
  {
    id: 'metal_iron',
    category: 'metals',
    creditCost: 30,
    metalReward: [{ metalId: 'iron', amount: 50 }],
  },
  {
    id: 'metal_titan',
    category: 'metals',
    creditCost: 70,
    metalReward: [{ metalId: 'titan', amount: 20 }],
  },
  {
    id: 'metal_iridium',
    category: 'metals',
    creditCost: 140,
    metalReward: [{ metalId: 'iridium', amount: 10 }],
  },
  {
    id: 'metal_void',
    category: 'metals',
    creditCost: 250,
    metalReward: [{ metalId: 'voidCrystal', amount: 5 }],
  },
  {
    id: 'metal_echo',
    category: 'metals',
    creditCost: 250,
    metalReward: [{ metalId: 'echoShard', amount: 5 }],
  },
  // Конвертер
  { id: 'converter', category: 'converter', creditCost: 20 },
];
exports.METAL_TIER_DATA = {
  iron: 0,
  titan: 1,
  iridium: 2,
  voidCrystal: 3,
  echoShard: 3,
};
