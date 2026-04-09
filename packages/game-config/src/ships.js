"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIPS_DATA = void 0;
exports.SHIPS_DATA = [
    {
        id: 'scout',
        name: 'Разведчик «Нулевой»',
        icon: '🚀',
        damageMultiplier: 1,
        expeditionMultiplier: 1,
        unlockLevel: 1,
        baseCost: { iron: 30 },
        repairCost: { iron: 10 },
    },
    {
        id: 'cruiser',
        name: 'Крейсер «Гамма»',
        icon: '🛸',
        damageMultiplier: 2.5,
        expeditionMultiplier: 1.5,
        unlockLevel: 6,
        baseCost: { titan: 25 },
        repairCost: { titan: 8 },
    },
    {
        id: 'dreadnought',
        name: 'Дредноут «Отдел Б»',
        icon: '🛡️',
        damageMultiplier: 5,
        expeditionMultiplier: 2.5,
        unlockLevel: 8,
        baseCost: { iridium: 20 },
        repairCost: { iridium: 7 },
    },
    {
        id: 'flagship',
        name: 'Флагман «Абсолют-77»',
        icon: '💫',
        damageMultiplier: 12,
        expeditionMultiplier: 4,
        unlockLevel: 11,
        baseCost: { iron: 28, titan: 28, iridium: 29 },
        repairCost: { iron: 10, titan: 10, iridium: 10 },
    },
];
