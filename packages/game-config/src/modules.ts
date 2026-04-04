export const MAX_MODULE_LEVEL = 50;
export const MAX_ULTS_AT_MAX_LEVEL = 6;
export const ULT_LEVEL_STEP = 10; // 1 ult per 10 levels

export const MODULES_DATA = [
  {
    id: 'surge',
    name: 'Ядро Всплеска',
    icon: '⚡',
    cost: { voidCrystal: 30 },
    ultName: 'Всплеск',
    ultDurationMs: 8_000,
    hitsToCharge: 35,
  },
  {
    id: 'warp',
    name: 'Варп-Привод',
    icon: '⏱️',
    cost: { echoShard: 30 },
    ultName: 'Варп',
    ultDurationMs: 0,
    hitsToCharge: 40,
  },
  {
    id: 'dispel',
    name: 'Глаз Фантома',
    icon: '👁️',
    cost: { voidCrystal: 20, echoShard: 20 },
    ultName: 'Рассеять',
    ultDurationMs: 12_000,
    hitsToCharge: 25,
  },
] as const;
