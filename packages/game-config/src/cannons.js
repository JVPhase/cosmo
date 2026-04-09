"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANNONS_DATA = void 0;
exports.CANNONS_DATA = [
    { id: 'standard', name: 'Стандартная пушка', icon: '🔫', damagePerLevel: 5, baseCost: { iron: 25 } },
    { id: 'titan', name: 'Титановая пушка', icon: '⚙️', damagePerLevel: 20, baseCost: { titan: 20 } },
    { id: 'iridium', name: 'Иридиевая пушка', icon: '🔮', damagePerLevel: 60, baseCost: { iridium: 15 } },
    { id: 'alloy', name: 'Сплавная пушка', icon: '💥', damagePerLevel: 200, baseCost: { iron: 20, titan: 20, iridium: 20 } },
];
