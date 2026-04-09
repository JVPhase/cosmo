"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESEARCH_DATA = void 0;
const formatNum_1 = require("./formatNum");
exports.RESEARCH_DATA = [
    // Mining
    { id: 'mining_click_1', branch: 'mining', requiredLevel: 1, energyCost: 300, effect: { type: 'clickMultiplier', value: 0.3 } },
    { id: 'mining_passive_1', branch: 'mining', requiredLevel: 3, energyCost: 2000, effect: { type: 'passiveMultiplier', value: 0.4 } },
    { id: 'mining_metal_1', branch: 'mining', requiredLevel: 5, energyCost: 6000, effect: { type: 'metalDropBonus', value: 0.08 } },
    { id: 'mining_click_2', branch: 'mining', requiredLevel: 8, energyCost: 25000, effect: { type: 'clickMultiplier', value: 0.6 } },
    { id: 'mining_passive_2', branch: 'mining', requiredLevel: 12, energyCost: 100000, effect: { type: 'passiveMultiplier', value: 0.8 } },
    { id: 'mining_click_3', branch: 'mining', requiredLevel: 20, energyCost: (0, formatNum_1.bn)('5M'), effect: { type: 'clickMultiplier', value: 1.2 } },
    { id: 'mining_passive_3', branch: 'mining', requiredLevel: 25, energyCost: (0, formatNum_1.bn)('50M'), effect: { type: 'passiveMultiplier', value: 1.5 } },
    { id: 'mining_metal_2', branch: 'mining', requiredLevel: 30, energyCost: (0, formatNum_1.bn)('500M'), effect: { type: 'metalDropBonus', value: 0.15 } },
    { id: 'mining_click_4', branch: 'mining', requiredLevel: 40, energyCost: (0, formatNum_1.bn)('50B'), effect: { type: 'clickMultiplier', value: 2.0 } },
    { id: 'mining_passive_4', branch: 'mining', requiredLevel: 50, energyCost: (0, formatNum_1.bn)('500B'), effect: { type: 'passiveMultiplier', value: 3.0 } },
    // Battle
    { id: 'battle_damage_1', branch: 'battle', requiredLevel: 6, energyCost: 70000, effect: { type: 'damageMultiplier', value: 0.3 } },
    { id: 'battle_damage_2', branch: 'battle', requiredLevel: 8, energyCost: 240000, effect: { type: 'damageMultiplier', value: 0.6 } },
    { id: 'battle_damage_3', branch: 'battle', requiredLevel: 13, energyCost: (0, formatNum_1.bn)('3M'), effect: { type: 'damageMultiplier', value: 1.0 } },
    { id: 'battle_damage_4', branch: 'battle', requiredLevel: 28, energyCost: (0, formatNum_1.bn)('500M'), effect: { type: 'damageMultiplier', value: 1.5 } },
    { id: 'battle_regen_1', branch: 'battle', requiredLevel: 35, energyCost: (0, formatNum_1.bn)('5B'), effect: { type: 'battleRegenBlock', value: 10000 } },
    { id: 'battle_damage_5', branch: 'battle', requiredLevel: 55, energyCost: (0, formatNum_1.bn)('5KB'), effect: { type: 'damageMultiplier', value: 2.5 } },
    { id: 'battle_crit_1', branch: 'battle', requiredLevel: 60, energyCost: (0, formatNum_1.bn)('50KB'), effect: { type: 'critChance', value: 0.10 } },
    { id: 'battle_crit_2', branch: 'battle', requiredLevel: 70, energyCost: (0, formatNum_1.bn)('1MB'), effect: { type: 'critChance', value: 0.10 } },
    // Expedition
    { id: 'exp_speed_1', branch: 'expedition', requiredLevel: 15, energyCost: (0, formatNum_1.bn)('2M'), effect: { type: 'expeditionTimeReduction', value: 0.20 } },
    { id: 'exp_yield_1', branch: 'expedition', requiredLevel: 18, energyCost: (0, formatNum_1.bn)('10M'), effect: { type: 'expeditionYieldBonus', value: 0.25 } },
    { id: 'exp_speed_2', branch: 'expedition', requiredLevel: 25, energyCost: (0, formatNum_1.bn)('150M'), effect: { type: 'expeditionTimeReduction', value: 0.35 } },
    { id: 'exp_yield_2', branch: 'expedition', requiredLevel: 30, energyCost: (0, formatNum_1.bn)('700M'), effect: { type: 'expeditionYieldBonus', value: 0.50 } },
    { id: 'exp_dual_1', branch: 'expedition', requiredLevel: 35, energyCost: (0, formatNum_1.bn)('5B'), effect: { type: 'expeditionSlotBonus', value: 1 } },
    { id: 'exp_speed_3', branch: 'expedition', requiredLevel: 42, energyCost: (0, formatNum_1.bn)('80B'), effect: { type: 'expeditionTimeReduction', value: 0.50 } },
    { id: 'exp_yield_3', branch: 'expedition', requiredLevel: 48, energyCost: (0, formatNum_1.bn)('500B'), effect: { type: 'expeditionYieldBonus', value: 1.0 } },
    { id: 'exp_dual_2', branch: 'expedition', requiredLevel: 55, energyCost: (0, formatNum_1.bn)('10KB'), effect: { type: 'expeditionSlotBonus', value: 1 } },
    // Metallurgy
    { id: 'metal_titan_1', branch: 'metallurgy', requiredLevel: 10, energyCost: 500000, effect: { type: 'specificMetalDropBonus', metalId: 'titan', value: 0.10 } },
    { id: 'metal_iridium_1', branch: 'metallurgy', requiredLevel: 15, energyCost: (0, formatNum_1.bn)('2M'), effect: { type: 'specificMetalDropBonus', metalId: 'iridium', value: 0.08 } },
    { id: 'metal_void_1', branch: 'metallurgy', requiredLevel: 25, energyCost: (0, formatNum_1.bn)('150M'), effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.05 } },
    { id: 'metal_echo_1', branch: 'metallurgy', requiredLevel: 25, energyCost: (0, formatNum_1.bn)('150M'), effect: { type: 'specificMetalDropBonus', metalId: 'echoShard', value: 0.05 } },
    { id: 'metal_titan_2', branch: 'metallurgy', requiredLevel: 32, energyCost: (0, formatNum_1.bn)('3B'), effect: { type: 'specificMetalDropBonus', metalId: 'titan', value: 0.15 } },
    { id: 'metal_iridium_2', branch: 'metallurgy', requiredLevel: 38, energyCost: (0, formatNum_1.bn)('20B'), effect: { type: 'specificMetalDropBonus', metalId: 'iridium', value: 0.12 } },
    { id: 'metal_void_2', branch: 'metallurgy', requiredLevel: 45, energyCost: (0, formatNum_1.bn)('100B'), effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.08 } },
    { id: 'metal_echo_2', branch: 'metallurgy', requiredLevel: 45, energyCost: (0, formatNum_1.bn)('100B'), effect: { type: 'specificMetalDropBonus', metalId: 'echoShard', value: 0.08 } },
    // Modules
    { id: 'module_charge_1', branch: 'modules', requiredLevel: 20, energyCost: (0, formatNum_1.bn)('5M'), effect: { type: 'moduleChargeReduction', value: 0.10 } },
    { id: 'module_ult_1', branch: 'modules', requiredLevel: 22, energyCost: (0, formatNum_1.bn)('15M'), effect: { type: 'moduleEffectBonus', value: 0.20 } },
    { id: 'module_charge_2', branch: 'modules', requiredLevel: 30, energyCost: (0, formatNum_1.bn)('700M'), effect: { type: 'moduleChargeReduction', value: 0.20 } },
    { id: 'module_ult_2', branch: 'modules', requiredLevel: 35, energyCost: (0, formatNum_1.bn)('5B'), effect: { type: 'moduleEffectBonus', value: 0.40 } },
    { id: 'module_charge_3', branch: 'modules', requiredLevel: 42, energyCost: (0, formatNum_1.bn)('80B'), effect: { type: 'moduleChargeReduction', value: 0.30 } },
    { id: 'module_ult_3', branch: 'modules', requiredLevel: 50, energyCost: (0, formatNum_1.bn)('500B'), effect: { type: 'moduleEffectBonus', value: 0.60 } },
    { id: 'module_slot_1', branch: 'modules', requiredLevel: 58, energyCost: (0, formatNum_1.bn)('50KB'), effect: { type: 'moduleSlotBonus', value: 1 } },
    { id: 'module_slot_2', branch: 'modules', requiredLevel: 68, energyCost: (0, formatNum_1.bn)('2MB'), effect: { type: 'moduleSlotBonus', value: 1 } },
    // Special
    { id: 'special_xp_1', branch: 'special', requiredLevel: 40, energyCost: (0, formatNum_1.bn)('50B'), effect: { type: 'xpMultiplierBonus', value: 0.25 } },
    { id: 'special_cost_1', branch: 'special', requiredLevel: 45, energyCost: (0, formatNum_1.bn)('150B'), effect: { type: 'upgradeCostReduction', value: 0.15 } },
    { id: 'special_xp_2', branch: 'special', requiredLevel: 55, energyCost: (0, formatNum_1.bn)('10KB'), effect: { type: 'xpMultiplierBonus', value: 0.50 } },
    { id: 'special_cost_2', branch: 'special', requiredLevel: 60, energyCost: (0, formatNum_1.bn)('50KB'), effect: { type: 'upgradeCostReduction', value: 0.25 } },
    { id: 'special_metal_1', branch: 'special', requiredLevel: 65, energyCost: (0, formatNum_1.bn)('1MB'), effect: { type: 'metalDropBonus', value: 0.20 } },
    { id: 'special_reset_1', branch: 'special', requiredLevel: 75, energyCost: (0, formatNum_1.bn)('10BB'), effect: { type: 'xpMultiplierBonus', value: 1.0 } },
];
