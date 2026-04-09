"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACHIEVEMENTS_DATA = exports.ACHIEVEMENT_CLAIM_CREDITS = void 0;
exports.ACHIEVEMENT_CLAIM_CREDITS = 5;
exports.ACHIEVEMENTS_DATA = [
    // ── Добыча ──────────────────────────────────────────────────────────
    { id: 1, target: { type: 'totalAtLeast', value: 10 } },
    { id: 2, target: { type: 'totalAtLeast', value: 1000 } },
    { id: 3, target: { type: 'totalAtLeast', value: 10000 } },
    { id: 4, target: { type: 'passiveAtLeast', value: 10 } },
    { id: 5, target: { type: 'planetsAtLeast', value: 3 } },
    { id: 6, target: { type: 'clicksAtLeast', value: 500 } },
    { id: 7, target: { type: 'totalAtLeast', value: 100000 } },
    { id: 8, target: { type: 'upgCountAtLeast', value: 5 } },
    { id: 9, target: { type: 'clicksAtLeast', value: 100 } },
    { id: 10, target: { type: 'clicksAtLeast', value: 2000 } },
    { id: 11, target: { type: 'clicksAtLeast', value: 10000 } },
    { id: 12, target: { type: 'totalAtLeast', value: 500000 } },
    { id: 13, target: { type: 'totalAtLeast', value: 1000000 } },
    { id: 14, target: { type: 'totalAtLeast', value: 10000000 } },
    { id: 15, target: { type: 'upgCountAtLeast', value: 7 } },
    { id: 16, target: { type: 'passiveAtLeast', value: 50 } },
    { id: 17, target: { type: 'passiveAtLeast', value: 200 } },
    { id: 18, target: { type: 'planetsAtLeast', value: 5 } },
    // ── Ресурсы: расширение ─────────────────────────────────────────────
    { id: 19, target: { type: 'totalAtLeast', value: 1e9 } },
    { id: 20, target: { type: 'totalAtLeast', value: 1e12 } },
    { id: 21, target: { type: 'totalAtLeast', value: 1e15 } },
    { id: 22, target: { type: 'totalAtLeast', value: 1e18 } },
    // ── Клики: расширение ───────────────────────────────────────────────
    { id: 23, target: { type: 'clicksAtLeast', value: 50000 } },
    { id: 24, target: { type: 'clicksAtLeast', value: 100000 } },
    { id: 25, target: { type: 'clicksAtLeast', value: 500000 } },
    { id: 26, target: { type: 'clicksAtLeast', value: 1000000 } },
    // ── Планеты: расширение ─────────────────────────────────────────────
    { id: 27, target: { type: 'planetsAtLeast', value: 10 } },
    { id: 28, target: { type: 'planetsAtLeast', value: 25 } },
    { id: 29, target: { type: 'planetsAtLeast', value: 50 } },
    { id: 30, target: { type: 'planetsAtLeast', value: 100 } },
    { id: 31, target: { type: 'planetsAtLeast', value: 250 } },
    { id: 32, target: { type: 'planetsAtLeast', value: 500 } },
    // ── Пассивный доход: расширение ─────────────────────────────────────
    { id: 33, target: { type: 'passiveAtLeast', value: 1000 } },
    { id: 34, target: { type: 'passiveAtLeast', value: 10000 } },
    { id: 35, target: { type: 'passiveAtLeast', value: 100000 } },
    { id: 36, target: { type: 'passiveAtLeast', value: 1000000 } },
    // ── Улучшения: расширение ───────────────────────────────────────────
    { id: 37, target: { type: 'upgCountAtLeast', value: 10 } },
    { id: 38, target: { type: 'upgCountAtLeast', value: 14 } },
    // ── Боёвка ──────────────────────────────────────────────────────────
    { id: 39, target: { type: 'battlesWonAtLeast', value: 1 } },
    { id: 40, target: { type: 'battlesWonAtLeast', value: 10 } },
    { id: 41, target: { type: 'battlesWonAtLeast', value: 50 } },
    { id: 42, target: { type: 'battlesWonAtLeast', value: 200 } },
    { id: 43, target: { type: 'battlesWonAtLeast', value: 1000 } },
    { id: 44, target: { type: 'battleCondition', conditionKey: 'winWithHighTimer' } },
    { id: 45, target: { type: 'battleCondition', conditionKey: 'winInLastSeconds' } },
    { id: 46, target: { type: 'battleCondition', conditionKey: 'fiveUltsInBattle' } },
    { id: 47, target: { type: 'battleWinStreakAtLeast', value: 10 } },
    { id: 48, target: { type: 'battleWinStreakAtLeast', value: 50 } },
    // ── Исследования ────────────────────────────────────────────────────
    { id: 49, target: { type: 'researchCountAtLeast', value: 1 } },
    { id: 50, target: { type: 'researchCountAtLeast', value: 5 } },
    { id: 51, target: { type: 'researchCountAtLeast', value: 15 } },
    { id: 52, target: { type: 'researchCountAtLeast', value: 30 } },
    { id: 53, target: { type: 'researchCountAtLeast', value: 50 } },
    { id: 54, target: { type: 'researchCountAtLeast', value: 60 } },
    // ── Уровень игрока ──────────────────────────────────────────────────
    { id: 55, target: { type: 'playerLevelAtLeast', value: 5 } },
    { id: 56, target: { type: 'playerLevelAtLeast', value: 10 } },
    { id: 57, target: { type: 'playerLevelAtLeast', value: 20 } },
    { id: 58, target: { type: 'playerLevelAtLeast', value: 40 } },
    { id: 59, target: { type: 'playerLevelAtLeast', value: 60 } },
    { id: 60, target: { type: 'playerLevelAtLeast', value: 100 } },
    // ── Металлы ─────────────────────────────────────────────────────────
    { id: 61, target: { type: 'metalAtLeast', metalId: 'voidCrystal', value: 1 } },
    { id: 62, target: { type: 'metalAtLeast', metalId: 'voidCrystal', value: 100 } },
    { id: 63, target: { type: 'metalAtLeast', metalId: 'echoShard', value: 100 } },
    { id: 64, target: { type: 'metalAtLeast', metalId: 'iridium', value: 500 } },
    { id: 65, target: { type: 'allMetalsAtLeast', value: 500 } },
    // ── Секторы / Зоны ──────────────────────────────────────────────────
    { id: 66, target: { type: 'planetsAtLeast', value: 50 } },
    { id: 67, target: { type: 'planetsAtLeast', value: 100 } },
    { id: 68, target: { type: 'planetsAtLeast', value: 150 } },
    { id: 69, target: { type: 'planetsAtLeast', value: 500 } },
];
