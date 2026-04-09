"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULES_DATA = exports.ULT_LEVEL_STEP = exports.MAX_ULTS_AT_MAX_LEVEL = exports.MAX_MODULE_LEVEL = void 0;
exports.MAX_MODULE_LEVEL = 50;
exports.MAX_ULTS_AT_MAX_LEVEL = 6;
exports.ULT_LEVEL_STEP = 10; // 1 ult per 10 levels
exports.MODULES_DATA = [
    {
        id: 'surge',
        name: 'Ядро Всплеска',
        icon: '⚡',
        cost: { voidCrystal: 30 },
        ultName: 'Всплеск',
        ultDurationMs: 8000,
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
        ultDurationMs: 12000,
        hitsToCharge: 25,
    },
];
