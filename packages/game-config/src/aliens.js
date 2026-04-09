"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZONE_ALIEN_DATA = exports.BATTLE_DURATION_MS = void 0;
const formatNum_1 = require("./formatNum");
exports.BATTLE_DURATION_MS = 60000;
exports.ZONE_ALIEN_DATA = [
    // zone 0 — Внутренний Кластер (sectors 1–10)
    { baseHP: 250, baseXP: 200, zoneStart: 1, sectorScale: 5 },
    // zone 1 — Дальний Кластер (sectors 11–20)
    { baseHP: (0, formatNum_1.bn)('500M'), baseXP: 8000, zoneStart: 11, sectorScale: 4 },
    // zone 2 — Зона Иллюзий (sectors 21–30)
    { baseHP: (0, formatNum_1.bn)('150KB'), baseXP: (0, formatNum_1.bn)('110M'), zoneStart: 21, sectorScale: 4 },
    // zone 3 — Разлом Пустоты (sectors 31–40)
    { baseHP: (0, formatNum_1.bn)('40BB'), baseXP: (0, formatNum_1.bn)('2KB'), zoneStart: 31, sectorScale: 4 },
    // zone 4 — Временная Аномалия (sectors 41–50)
    { baseHP: (0, formatNum_1.bn)('12QB'), baseXP: (0, formatNum_1.bn)('48MB'), zoneStart: 41, sectorScale: 4 },
    // zone 5 — Квантовый Разрыв (sectors 51–60)
    { baseHP: (0, formatNum_1.bn)('4XB'), baseXP: (0, formatNum_1.bn)('4TB'), zoneStart: 51, sectorScale: 4 },
    // zone 6 — Поле Тёмной Материи (sectors 61–70)
    { baseHP: (0, formatNum_1.bn)('1.2ZB'), baseXP: (0, formatNum_1.bn)('300QB'), zoneStart: 61, sectorScale: 4 },
    // zone 7 — Сингулярная Бездна (sectors 71–80)
    { baseHP: (0, formatNum_1.bn)('400AB'), baseXP: (0, formatNum_1.bn)('16XB'), zoneStart: 71, sectorScale: 4 },
    // zone 8 — Нулевое Измерение (sectors 81–90)
    { baseHP: (0, formatNum_1.bn)('110FB'), baseXP: (0, formatNum_1.bn)('1.1ZB'), zoneStart: 81, sectorScale: 4 },
    // zone 9 — Абсолют (sectors 91–100)
    { baseHP: (0, formatNum_1.bn)('30HB'), baseXP: (0, formatNum_1.bn)('75AB'), zoneStart: 91, sectorScale: 5 },
];
