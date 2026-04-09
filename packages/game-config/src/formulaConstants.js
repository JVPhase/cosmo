"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORMULA_CONSTANTS = void 0;
exports.FORMULA_CONSTANTS = {
    // Upgrade cost: baseCost × (level + 1)² × UPGRADE_COST_EXP^level
    UPGRADE_COST_EXP: 1.7,
    // Upgrade power: bonus × UPGRADE_POWER_EXP^level
    UPGRADE_POWER_EXP: 1.6,
    // Cannon cost: baseCost × CANNON_COST_EXP^currentLevel
    CANNON_COST_EXP: 1.2,
    // Module upgrade cost: floor(MODULE_COST_BASE × MODULE_COST_EXP^(currentLevel - 1))
    MODULE_COST_BASE: 5,
    MODULE_COST_EXP: 1.15,
    // Planet/enemy bonus: bonusBase × sectorScale^(sectorId - zoneStart) × ZONE_PLANET_SCALE^planetIndex
    ZONE_PLANET_SCALE: 4,
    // Attack energy cost: maxHP × (ENERGY_BASE + zoneIndex × ENERGY_STEP)
    ENERGY_BASE: 10,
    ENERGY_STEP: 5,
    // Metal conversion: METAL_CONVERSION_RATE^tierDiff units of source per 1 target
    METAL_CONVERSION_RATE: 3,
    // Converter credit fee: CONVERTER_FEE_PER_TIER × tierDiff
    CONVERTER_FEE_PER_TIER: 20,
};
