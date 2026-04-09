"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANET_ZONE_THEMES_DATA = exports.HARDCODED_PLANETS_DATA = void 0;
exports.HARDCODED_PLANETS_DATA = [
    // sector 1
    { id: 1, cost: 0, bonus: 1 },
    { id: 2, cost: 500, bonus: 2.5 },
    { id: 3, cost: 3000, bonus: 6 },
    { id: 4, cost: 15000, bonus: 15 },
    { id: 5, cost: 80000, bonus: 50 },
    // sector 2
    { id: 6, cost: 0, bonus: 120 },
    { id: 7, cost: 0, bonus: 350 },
    { id: 8, cost: 0, bonus: 1000 },
    { id: 9, cost: 0, bonus: 3000 },
    { id: 10, cost: 0, bonus: 10000 },
    // sector 3
    { id: 11, cost: 50000000, bonus: 30000 },
    { id: 12, cost: 500000000, bonus: 100000 },
    { id: 13, cost: 5000000000, bonus: 300000 },
    { id: 14, cost: 50000000000, bonus: 1000000 },
    { id: 15, cost: 500000000000, bonus: 3000000 },
];
exports.PLANET_ZONE_THEMES_DATA = [
    { zoneIndex: 0, bonusBase: 4e8, bonusSectorScale: 5 }, // bn('400M')
    { zoneIndex: 1, bonusBase: 3e15, bonusSectorScale: 4 }, // bn('3MB')
    { zoneIndex: 2, bonusBase: 3e18, bonusSectorScale: 4 }, // bn('3BB')
    { zoneIndex: 3, bonusBase: 3e21, bonusSectorScale: 4 }, // bn('3TB')
    { zoneIndex: 4, bonusBase: 3e24, bonusSectorScale: 4 }, // bn('3QB')
    { zoneIndex: 5, bonusBase: 3e27, bonusSectorScale: 4 }, // bn('3PB')
    { zoneIndex: 6, bonusBase: 3e30, bonusSectorScale: 4 }, // bn('3XB')
    { zoneIndex: 7, bonusBase: 3e33, bonusSectorScale: 4 }, // bn('3YB')
    { zoneIndex: 8, bonusBase: 3e36, bonusSectorScale: 4 }, // bn('3ZB')
    { zoneIndex: 9, bonusBase: 3e39, bonusSectorScale: 5 }, // bn('3AB')
];
