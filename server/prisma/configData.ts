/**
 * Canonical game-config seed data — single source of truth for GameConfig rows.
 * Includes all UI fields (name, icon, lore, imageKey) + numeric balance fields.
 * Used exclusively by seed.ts; never imported by the runtime server.
 */

// ── dialogues ─────────────────────────────────────────────────────────────────
// Stores i18n key references for each character/sector — actual text lives in
// LocaleBundle (mobile/dialogues/ru).
const DIALOGUE_CHARS = ['lien', 'riva', 'graves', 'alex'] as const;
export const dialoguesData = Object.fromEntries(
  DIALOGUE_CHARS.map(char => [
    char,
    Object.fromEntries(
      Array.from({ length: 100 }, (_, i) => [String(i + 1), `${char}.${i + 1}`])
    ),
  ])
);

// ── helpers ─────────────────────────────────────────────────────────────────
function bn(s: string): number {
  const units: Record<string, number> = {
    K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15, P: 1e18,
    X: 1e21, Y: 1e24, Z: 1e27, A: 1e30, F: 1e33, H: 1e36,
    KB: 1e33, MB: 1e36, BB: 1e39, QB: 1e42, PB: 1e45,
    XB: 1e48, YB: 1e51, ZB: 1e54, AB: 1e57, FB: 1e60,
  };
  const m = s.match(/^([\d.]+)([A-Z]+)$/);
  if (!m) return parseFloat(s);
  return parseFloat(m[1]) * (units[m[2]] ?? 1);
}

const H1 = 3_600_000;
const M30 = 1_800_000;

// ── formulaConstants ─────────────────────────────────────────────────────────
export const formulaConstantsData = {
  UPGRADE_COST_EXP: 1.7,
  UPGRADE_POWER_EXP: 1.6,
  CANNON_COST_EXP: 1.2,
  MODULE_COST_BASE: 5,
  MODULE_COST_EXP: 1.15,
  ZONE_PLANET_SCALE: 4,
  ENERGY_BASE: 10,
  ENERGY_STEP: 5,
  METAL_CONVERSION_RATE: 3,
  CONVERTER_FEE_PER_TIER: 20,
};

// ── upgrades ─────────────────────────────────────────────────────────────────
export const upgradesData = [
  { id: 1,  nameKey: 'upgrade.1.name',  icon: '⚡',  baseCost: 15,        clickBonus: 1,    passiveBonus: 0,     loreKey: 'upgrade.1.lore'  },
  { id: 10, nameKey: 'upgrade.10.name', icon: '🔥',  baseCost: 600,       clickBonus: 5,    passiveBonus: 0,     loreKey: 'upgrade.10.lore' },
  { id: 3,  nameKey: 'upgrade.3.name',  icon: '🛸',  baseCost: 8000,      clickBonus: 30,   passiveBonus: 0,     loreKey: 'upgrade.3.lore'  },
  { id: 5,  nameKey: 'upgrade.5.name',  icon: '🌀',  baseCost: 150000,    clickBonus: 200,  passiveBonus: 0,     loreKey: 'upgrade.5.lore'  },
  { id: 7,  nameKey: 'upgrade.7.name',  icon: '🌑',  baseCost: 3000000,   clickBonus: 1500, passiveBonus: 0,     loreKey: 'upgrade.7.lore'  },
  { id: 9,  nameKey: 'upgrade.9.name',  icon: '📡',  baseCost: 60,        clickBonus: 0,    passiveBonus: 1,     loreKey: 'upgrade.9.lore'  },
  { id: 2,  nameKey: 'upgrade.2.name',  icon: '🤖',  baseCost: 350,       clickBonus: 0,    passiveBonus: 4,     loreKey: 'upgrade.2.lore'  },
  { id: 11, nameKey: 'upgrade.11.name', icon: '⚙️',  baseCost: 3500,      clickBonus: 0,    passiveBonus: 15,    loreKey: 'upgrade.11.lore' },
  { id: 4,  nameKey: 'upgrade.4.name',  icon: '🏗️',  baseCost: 25000,     clickBonus: 0,    passiveBonus: 80,    loreKey: 'upgrade.4.lore'  },
  { id: 12, nameKey: 'upgrade.12.name', icon: '🔋',  baseCost: 120000,    clickBonus: 0,    passiveBonus: 350,   loreKey: 'upgrade.12.lore' },
  { id: 6,  nameKey: 'upgrade.6.name',  icon: '🐝',  baseCost: 500000,    clickBonus: 0,    passiveBonus: 1500,  loreKey: 'upgrade.6.lore'  },
  { id: 13, nameKey: 'upgrade.13.name', icon: '🌐',  baseCost: 2000000,   clickBonus: 0,    passiveBonus: 7000,  loreKey: 'upgrade.13.lore' },
  { id: 14, nameKey: 'upgrade.14.name', icon: '♾️',  baseCost: 10000000,  clickBonus: 0,    passiveBonus: 35000, loreKey: 'upgrade.14.lore' },
];

// ── cannons ───────────────────────────────────────────────────────────────────
export const cannonsData = [
  { id: 'standard', nameKey: 'cannon.standard.name', icon: '🔫', imageKey: 'standartcanon', damagePerLevel: 5,   baseCost: { iron: 25 },                    loreKey: 'cannon.standard.lore' },
  { id: 'titan',    nameKey: 'cannon.titan.name',    icon: '⚙️', imageKey: 'titancanon',    damagePerLevel: 20,  baseCost: { titan: 20 },                   loreKey: 'cannon.titan.lore'    },
  { id: 'iridium',  nameKey: 'cannon.iridium.name',  icon: '🔮', imageKey: 'iridiumcanon',  damagePerLevel: 60,  baseCost: { iridium: 15 },                 loreKey: 'cannon.iridium.lore'  },
  { id: 'alloy',    nameKey: 'cannon.alloy.name',    icon: '💥', imageKey: 'alloycanon',    damagePerLevel: 200, baseCost: { iron: 20, titan: 20, iridium: 20 }, loreKey: 'cannon.alloy.lore' },
];

// ── ships ─────────────────────────────────────────────────────────────────────
export const shipsData = [
  { id: 'scout',       nameKey: 'ship.scout.name',       icon: '🚀', imageKey: 'scoutship',      damageMultiplier: 1,   expeditionMultiplier: 1,   unlockLevel: 1,  baseCost: { iron: 30 },                       repairCost: { iron: 10 },                      loreKey: 'ship.scout.lore'       },
  { id: 'cruiser',     nameKey: 'ship.cruiser.name',     icon: '🛸', imageKey: 'cruisership',    damageMultiplier: 2.5, expeditionMultiplier: 1.5, unlockLevel: 6,  baseCost: { titan: 25 },                      repairCost: { titan: 8 },                      loreKey: 'ship.cruiser.lore'     },
  { id: 'dreadnought', nameKey: 'ship.dreadnought.name', icon: '🛡️', imageKey: 'dreadnoughtship', damageMultiplier: 5,   expeditionMultiplier: 2.5, unlockLevel: 8,  baseCost: { iridium: 20 },                    repairCost: { iridium: 7 },                    loreKey: 'ship.dreadnought.lore' },
  { id: 'flagship',    nameKey: 'ship.flagship.name',    icon: '💫', imageKey: 'flagship',       damageMultiplier: 12,  expeditionMultiplier: 4,   unlockLevel: 11, baseCost: { iron: 28, titan: 28, iridium: 29 }, repairCost: { iron: 10, titan: 10, iridium: 10 }, loreKey: 'ship.flagship.lore'  },
];

// ── modules ───────────────────────────────────────────────────────────────────
export const modulesData = {
  definitions: [
    { id: 'surge',  nameKey: 'module.surge.name',  icon: '⚡',  cost: { voidCrystal: 30 },             ultNameKey: 'module.surge.ultName',  ultDescriptionKey: 'module.surge.ultDescription',  ultDurationMs: 8_000,  hitsToCharge: 35, loreKey: 'module.surge.lore'  },
    { id: 'warp',   nameKey: 'module.warp.name',   icon: '⏱️', cost: { echoShard: 30 },                ultNameKey: 'module.warp.ultName',   ultDescriptionKey: 'module.warp.ultDescription',   ultDurationMs: 0,      hitsToCharge: 40, loreKey: 'module.warp.lore'   },
    { id: 'dispel', nameKey: 'module.dispel.name', icon: '👁️', cost: { voidCrystal: 20, echoShard: 20 }, ultNameKey: 'module.dispel.ultName', ultDescriptionKey: 'module.dispel.ultDescription', ultDurationMs: 12_000, hitsToCharge: 25, loreKey: 'module.dispel.lore' },
  ],
  maxLevel: 50,
};

// ── expeditions ───────────────────────────────────────────────────────────────
export const expeditionsData = [
  { id: 'patrol',        nameKey: 'expedition.patrol.name',        icon: '🔍', durationMs: 5 * 60 * 1_000,      metalRewards: { iron: 8, titan: 3 },                    xpReward: 50,    loreKey: 'expedition.patrol.lore'        },
  { id: 'asteroid_belt', nameKey: 'expedition.asteroid_belt.name', icon: '🪨', durationMs: 30 * 60 * 1_000,     metalRewards: { iron: 40, titan: 20, iridium: 5 },      xpReward: 250,   loreKey: 'expedition.asteroid_belt.lore' },
  { id: 'deep_space',    nameKey: 'expedition.deep_space.name',    icon: '🌌', durationMs: 2 * 60 * 60 * 1_000, metalRewards: { iron: 100, titan: 80, iridium: 40 },     xpReward: 1_000, loreKey: 'expedition.deep_space.lore'    },
  { id: 'classified',    nameKey: 'expedition.classified.name',    icon: '🔒', durationMs: 8 * 60 * 60 * 1_000, metalRewards: { iron: 300, titan: 250, iridium: 150 },   xpReward: 3_000, loreKey: 'expedition.classified.lore'    },
];

// ── shop ──────────────────────────────────────────────────────────────────────
export const shopData = {
  items: [
    { id: 'booster_mining_1h',  nameKey: 'shop.booster_mining_1h.name',  icon: '⚡',  category: 'boosters',   creditCost: 80,  loreKey: 'shop.booster_mining_1h.lore',  boostEffect: { stat: 'clickMultiplier',  multiplier: 2,   durationMs: H1  } },
    { id: 'booster_xp_1h',      nameKey: 'shop.booster_xp_1h.name',      icon: '🎓',  category: 'boosters',   creditCost: 60,  loreKey: 'shop.booster_xp_1h.lore',      boostEffect: { stat: 'xpMultiplier',     multiplier: 2,   durationMs: H1  } },
    { id: 'booster_metal_1h',   nameKey: 'shop.booster_metal_1h.name',   icon: '🔍',  category: 'boosters',   creditCost: 90,  loreKey: 'shop.booster_metal_1h.lore',   boostEffect: { stat: 'metalDropBonus',   multiplier: 1.5, durationMs: H1  } },
    { id: 'booster_battle_30m', nameKey: 'shop.booster_battle_30m.name', icon: '⚔️',  category: 'boosters',   creditCost: 50,  loreKey: 'shop.booster_battle_30m.lore', boostEffect: { stat: 'damageMultiplier', multiplier: 1.5, durationMs: M30 } },
    { id: 'metal_iron',         nameKey: 'shop.metal_iron.name',         icon: '🔩',  category: 'metals',     creditCost: 30,  loreKey: 'shop.metal_iron.lore',         metalReward: [{ metalId: 'iron', amount: 50 }] },
    { id: 'metal_titan',        nameKey: 'shop.metal_titan.name',        icon: '🔷',  category: 'metals',     creditCost: 70,  loreKey: 'shop.metal_titan.lore',        metalReward: [{ metalId: 'titan', amount: 20 }] },
    { id: 'metal_iridium',      nameKey: 'shop.metal_iridium.name',      icon: '💜',  category: 'metals',     creditCost: 140, loreKey: 'shop.metal_iridium.lore',      metalReward: [{ metalId: 'iridium', amount: 10 }] },
    { id: 'metal_void',         nameKey: 'shop.metal_void.name',         icon: '✨',  category: 'metals',     creditCost: 250, loreKey: 'shop.metal_void.lore',         metalReward: [{ metalId: 'voidCrystal', amount: 5 }] },
    { id: 'metal_echo',         nameKey: 'shop.metal_echo.name',         icon: '🔊',  category: 'metals',     creditCost: 250, loreKey: 'shop.metal_echo.lore',         metalReward: [{ metalId: 'echoShard', amount: 5 }] },
    { id: 'loot_box_basic',     nameKey: 'shop.loot_box_basic.name',     icon: '📦',  category: 'lootboxes',  creditCost: 40,  loreKey: 'shop.loot_box_basic.lore',     lootPool: [{ metalId: 'iron', min: 20, max: 50, chance: 0.8 }, { metalId: 'titan', min: 5, max: 15, chance: 0.5 }, { metalId: 'iridium', min: 2, max: 6, chance: 0.2 }] },
    { id: 'loot_box_advanced',  nameKey: 'shop.loot_box_advanced.name',  icon: '🗃️',  category: 'lootboxes',  creditCost: 120, loreKey: 'shop.loot_box_advanced.lore',  lootPool: [{ metalId: 'iron', min: 30, max: 70, chance: 1.0 }, { metalId: 'titan', min: 10, max: 25, chance: 0.9 }, { metalId: 'iridium', min: 5, max: 12, chance: 0.8 }, { metalId: 'voidCrystal', min: 1, max: 4, chance: 0.3 }, { metalId: 'echoShard', min: 1, max: 4, chance: 0.25 }] },
    { id: 'loot_box_premium',   nameKey: 'shop.loot_box_premium.name',   icon: '🏆',  category: 'lootboxes',  creditCost: 350, loreKey: 'shop.loot_box_premium.lore',   lootPool: [{ metalId: 'iron', min: 50, max: 100, chance: 1.0 }, { metalId: 'titan', min: 20, max: 40, chance: 1.0 }, { metalId: 'iridium', min: 10, max: 20, chance: 1.0 }, { metalId: 'voidCrystal', min: 3, max: 8, chance: 0.8 }, { metalId: 'echoShard', min: 3, max: 8, chance: 0.75 }] },
    { id: 'converter',          nameKey: 'shop.converter.name',          icon: '🔄',  category: 'converter',  creditCost: 20,  loreKey: 'shop.converter.lore' },
  ],
  metalTiers: { iron: 0, titan: 1, iridium: 2, voidCrystal: 3, echoShard: 3 },
};

// ── sectors ───────────────────────────────────────────────────────────────────
export const sectorsData = {
  zones: [
    { index: 0, nameKey: 'zone.0.name', icon: '🌍', minLevel: 1,  sectorScale: 5, loreKey: 'zone.0.lore' },
    { index: 1, nameKey: 'zone.1.name', icon: '🌌', minLevel: 10, sectorScale: 4, loreKey: 'zone.1.lore' },
    { index: 2, nameKey: 'zone.2.name', icon: '🌀', minLevel: 20, sectorScale: 4, loreKey: 'zone.2.lore' },
    { index: 3, nameKey: 'zone.3.name', icon: '🕳️', minLevel: 25, sectorScale: 4, loreKey: 'zone.3.lore' },
    { index: 4, nameKey: 'zone.4.name', icon: '⏳', minLevel: 30, sectorScale: 4, loreKey: 'zone.4.lore' },
    { index: 5, nameKey: 'zone.5.name', icon: '⚛️', minLevel: 35, sectorScale: 4, loreKey: 'zone.5.lore' },
    { index: 6, nameKey: 'zone.6.name', icon: '🌑', minLevel: 40, sectorScale: 4, loreKey: 'zone.6.lore' },
    { index: 7, nameKey: 'zone.7.name', icon: '🌀', minLevel: 45, sectorScale: 4, loreKey: 'zone.7.lore' },
    { index: 8, nameKey: 'zone.8.name', icon: '🔮', minLevel: 50, sectorScale: 4, loreKey: 'zone.8.lore' },
    { index: 9, nameKey: 'zone.9.name', icon: '💀', minLevel: 60, sectorScale: 5, loreKey: 'zone.9.lore' },
  ],
  planetsPerSector: 5,
  sectorsPerZone: 10,
  totalSectors: 100,
  totalPlanets: 500,
};

// ── aliens ────────────────────────────────────────────────────────────────────
export const aliensData = {
  battleDurationMs: 60_000,
  zoneData: [
    { baseHP: 250,          baseXP: 200,          zoneStart: 1,  sectorScale: 5, namePoolKeys: ['alien.zone.0.name.0','alien.zone.0.name.1','alien.zone.0.name.2','alien.zone.0.name.3','alien.zone.0.name.4','alien.zone.0.name.5','alien.zone.0.name.6','alien.zone.0.name.7','alien.zone.0.name.8','alien.zone.0.name.9'],                                                                       iconPool: ['👹','🤖','👾','🛸','⚙️'], loreKey: 'alien.zone.0.lore' },
    { baseHP: bn('500M'),   baseXP: 8_000,         zoneStart: 11, sectorScale: 4, namePoolKeys: ['alien.zone.1.name.0','alien.zone.1.name.1','alien.zone.1.name.2','alien.zone.1.name.3','alien.zone.1.name.4','alien.zone.1.name.5','alien.zone.1.name.6','alien.zone.1.name.7','alien.zone.1.name.8','alien.zone.1.name.9'],                                     iconPool: ['🕳️','💫','🌀','👾','🌌'], loreKey: 'alien.zone.1.lore' },
    { baseHP: bn('150KB'),  baseXP: bn('110M'),    zoneStart: 21, sectorScale: 4, namePoolKeys: ['alien.zone.2.name.0','alien.zone.2.name.1','alien.zone.2.name.2','alien.zone.2.name.3','alien.zone.2.name.4','alien.zone.2.name.5','alien.zone.2.name.6','alien.zone.2.name.7','alien.zone.2.name.8','alien.zone.2.name.9'],                                                         iconPool: ['🌀','👻','🔊','🌫️','🌑'], loreKey: 'alien.zone.2.lore' },
    { baseHP: bn('40BB'),   baseXP: bn('2KB'),     zoneStart: 31, sectorScale: 4, namePoolKeys: ['alien.zone.3.name.0','alien.zone.3.name.1','alien.zone.3.name.2','alien.zone.3.name.3','alien.zone.3.name.4','alien.zone.3.name.5','alien.zone.3.name.6','alien.zone.3.name.7','alien.zone.3.name.8','alien.zone.3.name.9'],                                          iconPool: ['🕳️','💥','🌑','☁️','⚫'], loreKey: 'alien.zone.3.lore' },
    { baseHP: bn('12QB'),   baseXP: bn('48MB'),    zoneStart: 41, sectorScale: 4, namePoolKeys: ['alien.zone.4.name.0','alien.zone.4.name.1','alien.zone.4.name.2','alien.zone.4.name.3','alien.zone.4.name.4','alien.zone.4.name.5','alien.zone.4.name.6','alien.zone.4.name.7','alien.zone.4.name.8','alien.zone.4.name.9'],                            iconPool: ['⏳','⌛','🕐','⚡','🌀'], loreKey: 'alien.zone.4.lore' },
    { baseHP: bn('4XB'),    baseXP: bn('4TB'),     zoneStart: 51, sectorScale: 4, namePoolKeys: ['alien.zone.5.name.0','alien.zone.5.name.1','alien.zone.5.name.2','alien.zone.5.name.3','alien.zone.5.name.4','alien.zone.5.name.5','alien.zone.5.name.6','alien.zone.5.name.7','alien.zone.5.name.8','alien.zone.5.name.9'],                                               iconPool: ['⚛️','💡','🌐','🔬','⚡'], loreKey: 'alien.zone.5.lore' },
    { baseHP: bn('1.2ZB'),  baseXP: bn('300QB'),   zoneStart: 61, sectorScale: 4, namePoolKeys: ['alien.zone.6.name.0','alien.zone.6.name.1','alien.zone.6.name.2','alien.zone.6.name.3','alien.zone.6.name.4','alien.zone.6.name.5','alien.zone.6.name.6','alien.zone.6.name.7','alien.zone.6.name.8','alien.zone.6.name.9'],                                            iconPool: ['🌑','👁️','🌚','🌒','⚫'], loreKey: 'alien.zone.6.lore' },
    { baseHP: bn('400AB'),  baseXP: bn('16XB'),    zoneStart: 71, sectorScale: 4, namePoolKeys: ['alien.zone.7.name.0','alien.zone.7.name.1','alien.zone.7.name.2','alien.zone.7.name.3','alien.zone.7.name.4','alien.zone.7.name.5','alien.zone.7.name.6','alien.zone.7.name.7','alien.zone.7.name.8','alien.zone.7.name.9'],                                  iconPool: ['🌀','💫','🔮','⚫','🌌'], loreKey: 'alien.zone.7.lore' },
    { baseHP: bn('110FB'),  baseXP: bn('1.1ZB'),   zoneStart: 81, sectorScale: 4, namePoolKeys: ['alien.zone.8.name.0','alien.zone.8.name.1','alien.zone.8.name.2','alien.zone.8.name.3','alien.zone.8.name.4','alien.zone.8.name.5','alien.zone.8.name.6','alien.zone.8.name.7','alien.zone.8.name.8','alien.zone.8.name.9'],                                                  iconPool: ['🔮','💎','🌐','⚡','🌊'], loreKey: 'alien.zone.8.lore' },
    { baseHP: bn('30HB'),   baseXP: bn('75AB'),    zoneStart: 91, sectorScale: 5, namePoolKeys: ['alien.zone.9.name.0','alien.zone.9.name.1','alien.zone.9.name.2','alien.zone.9.name.3','alien.zone.9.name.4','alien.zone.9.name.5','alien.zone.9.name.6','alien.zone.9.name.7','alien.zone.9.name.8','alien.zone.9.name.9'],                                    iconPool: ['💀','☠️','🌑','🔱','⚫'], loreKey: 'alien.zone.9.lore' },
  ],
  hardcodedAliens: [
    { planetId: 2,  nameKey: 'alien.hardcoded.2.name',      icon: '👹', imageKey: 'fireship',           loreKey: 'alien.hardcoded.2.lore' },
    { planetId: 3,  nameKey: 'alien.hardcoded.3.name',     icon: '💎', imageKey: 'crystalship',        loreKey: 'alien.hardcoded.3.lore' },
    { planetId: 4,  nameKey: 'alien.hardcoded.4.name',       icon: '👻', imageKey: 'omegaship',          loreKey: 'alien.hardcoded.4.lore' },
    { planetId: 5,  nameKey: 'alien.hardcoded.5.name',      icon: '☀️', imageKey: 'sunship',            loreKey: 'alien.hardcoded.5.lore' },
    { planetId: 6,  nameKey: 'alien.hardcoded.6.name',   icon: '🕳️', imageKey: 'blackholeship',      loreKey: 'alien.hardcoded.6.lore', ability: { type: 'shield', intervalMs: 12_000, durationMs: 2_500 } },
    { planetId: 7,  nameKey: 'alien.hardcoded.7.name',      icon: '💫', imageKey: 'neitronship',        loreKey: 'alien.hardcoded.7.lore', ability: { type: 'shield', intervalMs: 10_000, durationMs: 3_000 } },
    { planetId: 8,  nameKey: 'alien.hardcoded.8.name',     icon: '🌀', imageKey: 'nebulaship',         loreKey: 'alien.hardcoded.8.lore', ability: { type: 'shield', intervalMs: 8_000, durationMs: 3_500 } },
    { planetId: 9,  nameKey: 'alien.hardcoded.9.name', icon: '👾', imageKey: 'quantumship',     loreKey: 'alien.hardcoded.9.lore', ability: { type: 'shield', intervalMs: 6_000, durationMs: 4_000 } },
    { planetId: 10, nameKey: 'alien.hardcoded.10.name',       icon: '🌌', imageKey: 'singularityship',    loreKey: 'alien.hardcoded.10.lore', ability: { type: 'shield', intervalMs: 5_000, durationMs: 5_000 } },
    { planetId: 11, nameKey: 'alien.hardcoded.11.name',          icon: '🌀', imageKey: 'mirageprimeship',    loreKey: 'alien.hardcoded.11.lore', ability: { type: 'illusion', intervalMs: 20_000, durationMs: 4_000 } },
    { planetId: 12, nameKey: 'alien.hardcoded.12.name',       icon: '👻', imageKey: 'phantomveilship',    loreKey: 'alien.hardcoded.12.lore', ability: { type: 'illusion', intervalMs: 15_000, durationMs: 5_000 } },
    { planetId: 13, nameKey: 'alien.hardcoded.13.name',     icon: '🔊', imageKey: 'echoriftship',       loreKey: 'alien.hardcoded.13.lore', ability: { type: 'illusion', intervalMs: 12_000, durationMs: 5_500 } },
    { planetId: 14, nameKey: 'alien.hardcoded.14.name', icon: '🌫️', imageKey: 'depthsofmiragesship', loreKey: 'alien.hardcoded.14.lore', ability: { type: 'illusion', intervalMs: 10_000, durationMs: 6_000 } },
    { planetId: 15, nameKey: 'alien.hardcoded.15.name',      icon: '🌑', imageKey: 'ghostofthevoidship', loreKey: 'alien.hardcoded.15.lore', ability: { type: 'illusion', intervalMs: 8_000, durationMs: 7_000 } },
  ],
};

// ── planets ───────────────────────────────────────────────────────────────────
export const planetsData = {
  overrides: [
    { id: 1,  sectorId: 1, nameKey: 'planet.override.1.name',          icon: '🪨', imageKey: 'asteroid',         unlocked: true,  cost: 0,                bonus: 1,         resourceKey: 'planet.override.1.resource',  color: '#a09080', loreKey: 'planet.override.1.lore' },
    { id: 2,  sectorId: 1, nameKey: 'planet.override.2.name',          icon: '🔴', imageKey: 'mercury',          unlocked: false, cost: 500,              bonus: 2.5,       resourceKey: 'planet.override.2.resource',  color: '#e74c3c', loreKey: 'planet.override.2.lore' },
    { id: 3,  sectorId: 1, nameKey: 'planet.override.3.name',          icon: '💎', imageKey: 'crystal',          unlocked: false, cost: 3000,             bonus: 6,         resourceKey: 'planet.override.3.resource',  color: '#3498db', loreKey: 'planet.override.3.lore' },
    { id: 4,  sectorId: 1, nameKey: 'planet.override.4.name',          icon: '🌫️', imageKey: 'omega',            unlocked: false, cost: 15000,            bonus: 15,        resourceKey: 'planet.override.4.resource',  color: '#9b59b6', loreKey: 'planet.override.4.lore' },
    { id: 5,  sectorId: 1, nameKey: 'planet.override.5.name',          icon: '⭐', imageKey: 'sun',              unlocked: false, cost: 80000,            bonus: 50,        resourceKey: 'planet.override.5.resource',  color: '#f39c12', loreKey: 'planet.override.5.lore' },
    { id: 6,  sectorId: 2, nameKey: 'planet.override.6.name',          icon: '⚫', imageKey: 'blackhole',        unlocked: false, cost: 0,                bonus: 120,       resourceKey: 'planet.override.6.resource',  color: '#8e44ad', loreKey: 'planet.override.6.lore' },
    { id: 7,  sectorId: 2, nameKey: 'planet.override.7.name',          icon: '💫', imageKey: 'neitronstar',      unlocked: false, cost: 0,                bonus: 350,       resourceKey: 'planet.override.7.resource',  color: '#1abc9c', loreKey: 'planet.override.7.lore' },
    { id: 8,  sectorId: 2, nameKey: 'planet.override.8.name',          icon: '🌀', imageKey: 'nebula',           unlocked: false, cost: 0,                bonus: 1000,      resourceKey: 'planet.override.8.resource',  color: '#2980b9', loreKey: 'planet.override.8.lore' },
    { id: 9,  sectorId: 2, nameKey: 'planet.override.9.name',          icon: '⚡', imageKey: 'quantumfield',     unlocked: false, cost: 0,                bonus: 3000,      resourceKey: 'planet.override.9.resource',  color: '#e67e22', loreKey: 'planet.override.9.lore' },
    { id: 10, sectorId: 2, nameKey: 'planet.override.10.name',         icon: '🌌', imageKey: 'singularity',      unlocked: false, cost: 0,                bonus: 10000,     resourceKey: 'planet.override.10.resource', color: '#c0392b', loreKey: 'planet.override.10.lore' },
    { id: 11, sectorId: 3, nameKey: 'planet.override.11.name',         icon: '🌈', imageKey: 'mirageprime',      unlocked: false, cost: 50_000_000,       bonus: 30_000,    resourceKey: 'planet.override.11.resource', color: '#7ecbd4', loreKey: 'planet.override.11.lore' },
    { id: 12, sectorId: 3, nameKey: 'planet.override.12.name',         icon: '👻', imageKey: 'phantomveil',      unlocked: false, cost: 500_000_000,      bonus: 100_000,   resourceKey: 'planet.override.12.resource', color: '#c490d1', loreKey: 'planet.override.12.lore' },
    { id: 13, sectorId: 3, nameKey: 'planet.override.13.name',         icon: '🔊', imageKey: 'echorift',         unlocked: false, cost: 5_000_000_000,    bonus: 300_000,   resourceKey: 'planet.override.13.resource', color: '#6dd49c', loreKey: 'planet.override.13.lore' },
    { id: 14, sectorId: 3, nameKey: 'planet.override.14.name',         icon: '🏜️', imageKey: 'depthsofmirages',  unlocked: false, cost: 50_000_000_000,   bonus: 1_000_000, resourceKey: 'planet.override.14.resource', color: '#d4a17e', loreKey: 'planet.override.14.lore' },
    { id: 15, sectorId: 3, nameKey: 'planet.override.15.name',         icon: '🌑', imageKey: 'ghostofthevoid',   unlocked: false, cost: 500_000_000_000,  bonus: 3_000_000, resourceKey: 'planet.override.15.resource', color: '#8090d4', loreKey: 'planet.override.15.lore' },
  ],
  zoneThemes: [
    { zoneIndex: 0, namePrefixKey: 'planet.theme.0.namePrefix',   iconPool: ['🪨','🔴','💎','🌫️','⭐'], resourcePoolKeys: ['planet.theme.0.resource.0','planet.theme.0.resource.1','planet.theme.0.resource.2','planet.theme.0.resource.3','planet.theme.0.resource.4'],                   colorPool: ['#706050','#c0503c','#3060a0','#806090','#c08020'], loreKey: 'planet.theme.0.lore',                                   bonusBase: 4e8,  bonusSectorScale: 5 },
    { zoneIndex: 1, namePrefixKey: 'planet.theme.1.namePrefix',   iconPool: ['⚫','💫','🌌','⚡','🔵'], resourcePoolKeys: ['planet.theme.1.resource.0','planet.theme.1.resource.1','planet.theme.1.resource.2','planet.theme.1.resource.3','planet.theme.1.resource.4'],                          colorPool: ['#8e44ad','#1abc9c','#2980b9','#e67e22','#c0392b'], loreKey: 'planet.theme.1.lore',   bonusBase: 3e15, bonusSectorScale: 4 },
    { zoneIndex: 2, namePrefixKey: 'planet.theme.2.namePrefix',    iconPool: ['🌈','👻','🔊','🌫️','🌀'], resourcePoolKeys: ['planet.theme.2.resource.0','planet.theme.2.resource.1','planet.theme.2.resource.2','planet.theme.2.resource.3','planet.theme.2.resource.4'],           colorPool: ['#7ecbd4','#c490d1','#6dd49c','#d4a17e','#8090d4'], loreKey: 'planet.theme.2.lore',                   bonusBase: 3e18, bonusSectorScale: 4 },
    { zoneIndex: 3, namePrefixKey: 'planet.theme.3.namePrefix',   iconPool: ['🕳️','💥','🌑','☁️','🔩'], resourcePoolKeys: ['planet.theme.3.resource.0','planet.theme.3.resource.1','planet.theme.3.resource.2','planet.theme.3.resource.3','planet.theme.3.resource.4'],            colorPool: ['#2c2c4c','#8b0000','#4a4060','#3d3050','#1a1a3e'], loreKey: 'planet.theme.3.lore',        bonusBase: 3e21, bonusSectorScale: 4 },
    { zoneIndex: 4, namePrefixKey: 'planet.theme.4.namePrefix',   iconPool: ['⏳','⌛','🕐','⚡','🌀'], resourcePoolKeys: ['planet.theme.4.resource.0','planet.theme.4.resource.1','planet.theme.4.resource.2','planet.theme.4.resource.3','planet.theme.4.resource.4'],      colorPool: ['#9b59b6','#8e44ad','#6c3483','#5b2c6f','#4a235a'], loreKey: 'planet.theme.4.lore',                            bonusBase: 3e24, bonusSectorScale: 4 },
    { zoneIndex: 5, namePrefixKey: 'planet.theme.5.namePrefix',    iconPool: ['⚛️','💡','🌐','🔬','⚡'], resourcePoolKeys: ['planet.theme.5.resource.0','planet.theme.5.resource.1','planet.theme.5.resource.2','planet.theme.5.resource.3','planet.theme.5.resource.4'],                   colorPool: ['#1a5276','#154360','#0e6655','#1b4f72','#154360'],  loreKey: 'planet.theme.5.lore',                                    bonusBase: 3e27, bonusSectorScale: 4 },
    { zoneIndex: 6, namePrefixKey: 'planet.theme.6.namePrefix',   iconPool: ['🌑','👁️','🌚','🌒','⚫'], resourcePoolKeys: ['planet.theme.6.resource.0','planet.theme.6.resource.1','planet.theme.6.resource.2','planet.theme.6.resource.3','planet.theme.6.resource.4'],    colorPool: ['#1a1a2e','#16213e','#0f3460','#1a1a2e','#0d0d1a'],  loreKey: 'planet.theme.6.lore',          bonusBase: 3e30, bonusSectorScale: 4 },
    { zoneIndex: 7, namePrefixKey: 'planet.theme.7.namePrefix',   iconPool: ['🌀','💫','🔮','⚫','🌌'], resourcePoolKeys: ['planet.theme.7.resource.0','planet.theme.7.resource.1','planet.theme.7.resource.2','planet.theme.7.resource.3','planet.theme.7.resource.4'],  colorPool: ['#311b92','#1a237e','#0d47a1','#006064','#1b5e20'],  loreKey: 'planet.theme.7.lore',                                   bonusBase: 3e33, bonusSectorScale: 4 },
    { zoneIndex: 8, namePrefixKey: 'planet.theme.8.namePrefix',     iconPool: ['🔮','💎','🌐','⚡','🌊'], resourcePoolKeys: ['planet.theme.8.resource.0','planet.theme.8.resource.1','planet.theme.8.resource.2','planet.theme.8.resource.3','planet.theme.8.resource.4'],  colorPool: ['#424242','#37474f','#263238','#1c313a','#102027'],   loreKey: 'planet.theme.8.lore',                                   bonusBase: 3e36, bonusSectorScale: 4 },
    { zoneIndex: 9, namePrefixKey: 'planet.theme.9.namePrefix',  iconPool: ['💀','☠️','🌑','🔱','⚫'], resourcePoolKeys: ['planet.theme.9.resource.0','planet.theme.9.resource.1','planet.theme.9.resource.2','planet.theme.9.resource.3','planet.theme.9.resource.4'], colorPool: ['#b71c1c','#880e4f','#4a148c','#1a237e','#000010'],  loreKey: 'planet.theme.9.lore',                   bonusBase: 3e39, bonusSectorScale: 5 },
  ],
};

// ── metals ────────────────────────────────────────────────────────────────────
export const metalsData = {
  metals: [
    { id: 'iron',        nameKey: 'metal.iron.name',        icon: '🔩', imageKey: 'iron' },
    { id: 'titan',       nameKey: 'metal.titan.name',       icon: '🔷', imageKey: 'titan' },
    { id: 'iridium',     nameKey: 'metal.iridium.name',     icon: '💜', imageKey: 'iridium' },
    { id: 'voidCrystal', nameKey: 'metal.voidCrystal.name', icon: '✨', imageKey: 'voidcrystal' },
    { id: 'echoShard',   nameKey: 'metal.echoShard.name',   icon: '🔊', imageKey: 'echoshard' },
  ],
  planetDropTable: {
    1:  [{ metalId: 'iron', chance: 0.15 }],
    2:  [{ metalId: 'titan', chance: 0.12 }, { metalId: 'iron', chance: 0.06 }],
    3:  [{ metalId: 'iridium', chance: 0.10 }, { metalId: 'titan', chance: 0.06 }],
    4:  [{ metalId: 'iron', chance: 0.08 }, { metalId: 'titan', chance: 0.08 }, { metalId: 'iridium', chance: 0.08 }],
    5:  [{ metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    6:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.18 }, { metalId: 'iridium', chance: 0.12 }],
    7:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.20 }, { metalId: 'iridium', chance: 0.15 }],
    8:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.18 }],
    9:  [{ metalId: 'iron', chance: 0.28 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.20 }],
    10: [{ metalId: 'iron', chance: 0.30 }, { metalId: 'titan', chance: 0.25 }, { metalId: 'iridium', chance: 0.22 }],
    11: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.12 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    12: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.14 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    13: [{ metalId: 'voidCrystal', chance: 0.17 }, { metalId: 'echoShard', chance: 0.15 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    14: [{ metalId: 'voidCrystal', chance: 0.18 }, { metalId: 'echoShard', chance: 0.16 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    15: [{ metalId: 'voidCrystal', chance: 0.20 }, { metalId: 'echoShard', chance: 0.18 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  } as Record<number, { metalId: string; chance: number }[]>,
};

// ── research ──────────────────────────────────────────────────────────────────
export const researchData = [
  { id: 'mining_click_1',   nameKey: 'research.mining_click_1.name',   icon: '⚡',  branch: 'mining',      requiredLevel: 1,  energyCost: 300,        requires: [],                                    effect: { type: 'clickMultiplier',           value: 0.3  }, loreKey: 'research.mining_click_1.lore'   },
  { id: 'mining_passive_1', nameKey: 'research.mining_passive_1.name', icon: '🤖',  branch: 'mining',      requiredLevel: 3,  energyCost: 2_000,      requires: ['mining_click_1'],                    effect: { type: 'passiveMultiplier',          value: 0.4  }, loreKey: 'research.mining_passive_1.lore' },
  { id: 'mining_metal_1',   nameKey: 'research.mining_metal_1.name',   icon: '🔭',  branch: 'mining',      requiredLevel: 5,  energyCost: 6_000,      requires: [],                                    effect: { type: 'metalDropBonus',             value: 0.08 }, loreKey: 'research.mining_metal_1.lore'   },
  { id: 'mining_click_2',   nameKey: 'research.mining_click_2.name',   icon: '🌀',  branch: 'mining',      requiredLevel: 8,  energyCost: 25_000,     requires: ['mining_passive_1'],                  effect: { type: 'clickMultiplier',           value: 0.6  }, loreKey: 'research.mining_click_2.lore'   },
  { id: 'mining_passive_2', nameKey: 'research.mining_passive_2.name', icon: '🧠',  branch: 'mining',      requiredLevel: 12, energyCost: 100_000,    requires: ['mining_metal_1', 'mining_click_2'],  effect: { type: 'passiveMultiplier',          value: 0.8  }, loreKey: 'research.mining_passive_2.lore' },
  { id: 'mining_click_3',   nameKey: 'research.mining_click_3.name',   icon: '🔥',  branch: 'mining',      requiredLevel: 20, energyCost: bn('5M'),   requires: ['mining_passive_2'],                  effect: { type: 'clickMultiplier',           value: 1.2  }, loreKey: 'research.mining_click_3.lore'   },
  { id: 'mining_passive_3', nameKey: 'research.mining_passive_3.name', icon: '🐝',  branch: 'mining',      requiredLevel: 25, energyCost: bn('50M'),  requires: ['mining_click_3'],                    effect: { type: 'passiveMultiplier',          value: 1.5  }, loreKey: 'research.mining_passive_3.lore' },
  { id: 'mining_metal_2',   nameKey: 'research.mining_metal_2.name',   icon: '🔬',  branch: 'mining',      requiredLevel: 30, energyCost: bn('500M'), requires: ['mining_metal_1'],                    effect: { type: 'metalDropBonus',             value: 0.15 }, loreKey: 'research.mining_metal_2.lore'   },
  { id: 'mining_click_4',   nameKey: 'research.mining_click_4.name',   icon: '💥',  branch: 'mining',      requiredLevel: 40, energyCost: bn('50B'),  requires: ['mining_passive_3'],                  effect: { type: 'clickMultiplier',           value: 2.0  }, loreKey: 'research.mining_click_4.lore'   },
  { id: 'mining_passive_4', nameKey: 'research.mining_passive_4.name', icon: '🏭',  branch: 'mining',      requiredLevel: 50, energyCost: bn('500B'), requires: ['mining_click_4'],                    effect: { type: 'passiveMultiplier',          value: 3.0  }, loreKey: 'research.mining_passive_4.lore' },
  { id: 'battle_damage_1',  nameKey: 'research.battle_damage_1.name',  icon: '⚔️',  branch: 'battle',      requiredLevel: 6,  energyCost: 70_000,     requires: [],                                    effect: { type: 'damageMultiplier',           value: 0.3  }, loreKey: 'research.battle_damage_1.lore'  },
  { id: 'battle_damage_2',  nameKey: 'research.battle_damage_2.name',  icon: '🛸',  branch: 'battle',      requiredLevel: 8,  energyCost: 240_000,    requires: ['battle_damage_1'],                   effect: { type: 'damageMultiplier',           value: 0.6  }, loreKey: 'research.battle_damage_2.lore'  },
  { id: 'battle_damage_3',  nameKey: 'research.battle_damage_3.name',  icon: '🌑',  branch: 'battle',      requiredLevel: 13, energyCost: bn('3M'),   requires: ['battle_damage_2'],                   effect: { type: 'damageMultiplier',           value: 1.0  }, loreKey: 'research.battle_damage_3.lore'  },
  { id: 'battle_damage_4',  nameKey: 'research.battle_damage_4.name',  icon: '💫',  branch: 'battle',      requiredLevel: 28, energyCost: bn('500M'), requires: ['battle_damage_3'],                   effect: { type: 'damageMultiplier',           value: 1.5  }, loreKey: 'research.battle_damage_4.lore'  },
  { id: 'battle_regen_1',   nameKey: 'research.battle_regen_1.name',   icon: '🛡️',  branch: 'battle',      requiredLevel: 35, energyCost: bn('5B'),   requires: ['battle_damage_4'],                   effect: { type: 'battleRegenBlock',           value: 10_000 }, loreKey: 'research.battle_regen_1.lore' },
  { id: 'battle_damage_5',  nameKey: 'research.battle_damage_5.name',  icon: '🌀',  branch: 'battle',      requiredLevel: 55, energyCost: bn('5KB'),  requires: ['battle_regen_1'],                    effect: { type: 'damageMultiplier',           value: 2.5  }, loreKey: 'research.battle_damage_5.lore'  },
  { id: 'battle_crit_1',    nameKey: 'research.battle_crit_1.name',    icon: '🎯',  branch: 'battle',      requiredLevel: 60, energyCost: bn('50KB'), requires: ['battle_damage_5'],                   effect: { type: 'critChance',                 value: 0.10 }, loreKey: 'research.battle_crit_1.lore'    },
  { id: 'battle_crit_2',    nameKey: 'research.battle_crit_2.name',    icon: '⚛️',  branch: 'battle',      requiredLevel: 70, energyCost: bn('1MB'),  requires: ['battle_crit_1'],                     effect: { type: 'critChance',                 value: 0.10 }, loreKey: 'research.battle_crit_2.lore'    },
  { id: 'exp_speed_1',      nameKey: 'research.exp_speed_1.name',      icon: '🚀',  branch: 'expedition',  requiredLevel: 15, energyCost: bn('2M'),   requires: [],                                    effect: { type: 'expeditionTimeReduction',    value: 0.20 }, loreKey: 'research.exp_speed_1.lore'      },
  { id: 'exp_yield_1',      nameKey: 'research.exp_yield_1.name',      icon: '📦',  branch: 'expedition',  requiredLevel: 18, energyCost: bn('10M'),  requires: ['exp_speed_1'],                       effect: { type: 'expeditionYieldBonus',       value: 0.25 }, loreKey: 'research.exp_yield_1.lore'      },
  { id: 'exp_speed_2',      nameKey: 'research.exp_speed_2.name',      icon: '✨',  branch: 'expedition',  requiredLevel: 25, energyCost: bn('150M'), requires: ['exp_yield_1'],                       effect: { type: 'expeditionTimeReduction',    value: 0.35 }, loreKey: 'research.exp_speed_2.lore'      },
  { id: 'exp_yield_2',      nameKey: 'research.exp_yield_2.name',      icon: '🔩',  branch: 'expedition',  requiredLevel: 30, energyCost: bn('700M'), requires: ['exp_speed_2'],                       effect: { type: 'expeditionYieldBonus',       value: 0.50 }, loreKey: 'research.exp_yield_2.lore'      },
  { id: 'exp_dual_1',       nameKey: 'research.exp_dual_1.name',       icon: '🛸',  branch: 'expedition',  requiredLevel: 35, energyCost: bn('5B'),   requires: ['exp_yield_2'],                       effect: { type: 'expeditionSlotBonus',        value: 1    }, loreKey: 'research.exp_dual_1.lore'       },
  { id: 'exp_speed_3',      nameKey: 'research.exp_speed_3.name',      icon: '🌌',  branch: 'expedition',  requiredLevel: 42, energyCost: bn('80B'),  requires: ['exp_dual_1'],                        effect: { type: 'expeditionTimeReduction',    value: 0.50 }, loreKey: 'research.exp_speed_3.lore'      },
  { id: 'exp_yield_3',      nameKey: 'research.exp_yield_3.name',      icon: '🏭',  branch: 'expedition',  requiredLevel: 48, energyCost: bn('500B'), requires: ['exp_speed_3'],                       effect: { type: 'expeditionYieldBonus',       value: 1.0  }, loreKey: 'research.exp_yield_3.lore'      },
  { id: 'exp_dual_2',       nameKey: 'research.exp_dual_2.name',       icon: '🚀',  branch: 'expedition',  requiredLevel: 55, energyCost: bn('10KB'), requires: ['exp_yield_3'],                       effect: { type: 'expeditionSlotBonus',        value: 1    }, loreKey: 'research.exp_dual_2.lore'       },
  { id: 'metal_titan_1',    nameKey: 'research.metal_titan_1.name',    icon: '🔷',  branch: 'metallurgy',  requiredLevel: 10, energyCost: 500_000,    requires: [],                                    effect: { type: 'specificMetalDropBonus', metalId: 'titan',       value: 0.10 }, loreKey: 'research.metal_titan_1.lore'    },
  { id: 'metal_iridium_1',  nameKey: 'research.metal_iridium_1.name',  icon: '💜',  branch: 'metallurgy',  requiredLevel: 15, energyCost: bn('2M'),   requires: ['metal_titan_1'],                     effect: { type: 'specificMetalDropBonus', metalId: 'iridium',     value: 0.08 }, loreKey: 'research.metal_iridium_1.lore'  },
  { id: 'metal_void_1',     nameKey: 'research.metal_void_1.name',     icon: '✨',  branch: 'metallurgy',  requiredLevel: 25, energyCost: bn('150M'), requires: ['metal_iridium_1'],                   effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.05 }, loreKey: 'research.metal_void_1.lore'     },
  { id: 'metal_echo_1',     nameKey: 'research.metal_echo_1.name',     icon: '🔊',  branch: 'metallurgy',  requiredLevel: 25, energyCost: bn('150M'), requires: ['metal_iridium_1'],                   effect: { type: 'specificMetalDropBonus', metalId: 'echoShard',   value: 0.05 }, loreKey: 'research.metal_echo_1.lore'     },
  { id: 'metal_titan_2',    nameKey: 'research.metal_titan_2.name',    icon: '🔷',  branch: 'metallurgy',  requiredLevel: 32, energyCost: bn('3B'),   requires: ['metal_void_1', 'metal_echo_1'],      effect: { type: 'specificMetalDropBonus', metalId: 'titan',       value: 0.15 }, loreKey: 'research.metal_titan_2.lore'    },
  { id: 'metal_iridium_2',  nameKey: 'research.metal_iridium_2.name',  icon: '💜',  branch: 'metallurgy',  requiredLevel: 38, energyCost: bn('20B'),  requires: ['metal_titan_2'],                     effect: { type: 'specificMetalDropBonus', metalId: 'iridium',     value: 0.12 }, loreKey: 'research.metal_iridium_2.lore'  },
  { id: 'metal_void_2',     nameKey: 'research.metal_void_2.name',     icon: '✨',  branch: 'metallurgy',  requiredLevel: 45, energyCost: bn('100B'), requires: ['metal_iridium_2'],                   effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.08 }, loreKey: 'research.metal_void_2.lore'     },
  { id: 'metal_echo_2',     nameKey: 'research.metal_echo_2.name',     icon: '🔊',  branch: 'metallurgy',  requiredLevel: 45, energyCost: bn('100B'), requires: ['metal_iridium_2'],                   effect: { type: 'specificMetalDropBonus', metalId: 'echoShard',   value: 0.08 }, loreKey: 'research.metal_echo_2.lore'     },
  { id: 'module_charge_1',  nameKey: 'research.module_charge_1.name',  icon: '⚡',  branch: 'modules',     requiredLevel: 20, energyCost: bn('5M'),   requires: [],                                    effect: { type: 'moduleChargeReduction',      value: 0.10 }, loreKey: 'research.module_charge_1.lore'  },
  { id: 'module_ult_1',     nameKey: 'research.module_ult_1.name',     icon: '💫',  branch: 'modules',     requiredLevel: 22, energyCost: bn('15M'),  requires: ['module_charge_1'],                   effect: { type: 'moduleEffectBonus',          value: 0.20 }, loreKey: 'research.module_ult_1.lore'     },
  { id: 'module_charge_2',  nameKey: 'research.module_charge_2.name',  icon: '🔋',  branch: 'modules',     requiredLevel: 30, energyCost: bn('700M'), requires: ['module_ult_1'],                      effect: { type: 'moduleChargeReduction',      value: 0.20 }, loreKey: 'research.module_charge_2.lore'  },
  { id: 'module_ult_2',     nameKey: 'research.module_ult_2.name',     icon: '💥',  branch: 'modules',     requiredLevel: 35, energyCost: bn('5B'),   requires: ['module_charge_2'],                   effect: { type: 'moduleEffectBonus',          value: 0.40 }, loreKey: 'research.module_ult_2.lore'     },
  { id: 'module_charge_3',  nameKey: 'research.module_charge_3.name',  icon: '🧠',  branch: 'modules',     requiredLevel: 42, energyCost: bn('80B'),  requires: ['module_ult_2'],                      effect: { type: 'moduleChargeReduction',      value: 0.30 }, loreKey: 'research.module_charge_3.lore'  },
  { id: 'module_ult_3',     nameKey: 'research.module_ult_3.name',     icon: '🌀',  branch: 'modules',     requiredLevel: 50, energyCost: bn('500B'), requires: ['module_charge_3'],                   effect: { type: 'moduleEffectBonus',          value: 0.60 }, loreKey: 'research.module_ult_3.lore'     },
  { id: 'module_slot_1',    nameKey: 'research.module_slot_1.name',    icon: '🗂️',  branch: 'modules',     requiredLevel: 58, energyCost: bn('50KB'), requires: ['module_ult_3'],                      effect: { type: 'moduleSlotBonus',            value: 1    }, loreKey: 'research.module_slot_1.lore'    },
  { id: 'module_slot_2',    nameKey: 'research.module_slot_2.name',    icon: '🏗️',  branch: 'modules',     requiredLevel: 68, energyCost: bn('2MB'),  requires: ['module_slot_1'],                     effect: { type: 'moduleSlotBonus',            value: 1    }, loreKey: 'research.module_slot_2.lore'    },
  { id: 'special_xp_1',     nameKey: 'research.special_xp_1.name',     icon: '📚',  branch: 'special',     requiredLevel: 40, energyCost: bn('50B'),  requires: [],                                    effect: { type: 'xpMultiplierBonus',          value: 0.25 }, loreKey: 'research.special_xp_1.lore'     },
  { id: 'special_cost_1',   nameKey: 'research.special_cost_1.name',   icon: '💰',  branch: 'special',     requiredLevel: 45, energyCost: bn('150B'), requires: ['special_xp_1'],                      effect: { type: 'upgradeCostReduction',       value: 0.15 }, loreKey: 'research.special_cost_1.lore'   },
  { id: 'special_xp_2',     nameKey: 'research.special_xp_2.name',     icon: '⚡',  branch: 'special',     requiredLevel: 55, energyCost: bn('10KB'), requires: ['special_cost_1'],                    effect: { type: 'xpMultiplierBonus',          value: 0.50 }, loreKey: 'research.special_xp_2.lore'     },
  { id: 'special_cost_2',   nameKey: 'research.special_cost_2.name',   icon: '🔧',  branch: 'special',     requiredLevel: 60, energyCost: bn('50KB'), requires: ['special_xp_2'],                      effect: { type: 'upgradeCostReduction',       value: 0.25 }, loreKey: 'research.special_cost_2.lore'   },
  { id: 'special_metal_1',  nameKey: 'research.special_metal_1.name',  icon: '🪞',  branch: 'special',     requiredLevel: 65, energyCost: bn('1MB'),  requires: ['special_cost_2'],                    effect: { type: 'metalDropBonus',             value: 0.20 }, loreKey: 'research.special_metal_1.lore'  },
  { id: 'special_reset_1',  nameKey: 'research.special_reset_1.name',  icon: '🔥',  branch: 'special',     requiredLevel: 75, energyCost: bn('10BB'), requires: ['special_metal_1'],                   effect: { type: 'xpMultiplierBonus',          value: 1.0  }, loreKey: 'research.special_reset_1.lore'  },
];

// ── achievements ──────────────────────────────────────────────────────────────
export const achievementsData = {
  claimCredits: 5,
  data: [
    { id: 1,  nameKey: 'achievement.1.name',  icon: '📋', target: { type: 'totalAtLeast',           value: 10 },        loreKey: 'achievement.1.lore'  },
    { id: 2,  nameKey: 'achievement.2.name',  icon: '📊', target: { type: 'totalAtLeast',           value: 1_000 },     loreKey: 'achievement.2.lore'  },
    { id: 3,  nameKey: 'achievement.3.name',  icon: '🏆', target: { type: 'totalAtLeast',           value: 10_000 },    loreKey: 'achievement.3.lore'  },
    { id: 4,  nameKey: 'achievement.4.name',  icon: '🤖', target: { type: 'passiveAtLeast',         value: 10 },        loreKey: 'achievement.4.lore'  },
    { id: 5,  nameKey: 'achievement.5.name',  icon: '🌌', target: { type: 'planetsAtLeast',         value: 3 },         loreKey: 'achievement.5.lore'  },
    { id: 6,  nameKey: 'achievement.6.name',  icon: '☕', target: { type: 'clicksAtLeast',          value: 500 },       loreKey: 'achievement.6.lore'  },
    { id: 7,  nameKey: 'achievement.7.name',  icon: '💰', target: { type: 'totalAtLeast',           value: 100_000 },   loreKey: 'achievement.7.lore'  },
    { id: 8,  nameKey: 'achievement.8.name',  icon: '📁', target: { type: 'upgCountAtLeast',        value: 5 },         loreKey: 'achievement.8.lore'  },
    { id: 9,  nameKey: 'achievement.9.name',  icon: '🖱️', target: { type: 'clicksAtLeast',          value: 100 },       loreKey: 'achievement.9.lore'  },
    { id: 10, nameKey: 'achievement.10.name', icon: '🤲', target: { type: 'clicksAtLeast',          value: 2_000 },     loreKey: 'achievement.10.lore' },
    { id: 11, nameKey: 'achievement.11.name', icon: '💪', target: { type: 'clicksAtLeast',          value: 10_000 },    loreKey: 'achievement.11.lore' },
    { id: 12, nameKey: 'achievement.12.name', icon: '🤑', target: { type: 'totalAtLeast',           value: 500_000 },   loreKey: 'achievement.12.lore' },
    { id: 13, nameKey: 'achievement.13.name', icon: '👑', target: { type: 'totalAtLeast',           value: 1_000_000 }, loreKey: 'achievement.13.lore' },
    { id: 14, nameKey: 'achievement.14.name', icon: '🌠', target: { type: 'totalAtLeast',           value: 10_000_000 },loreKey: 'achievement.14.lore' },
    { id: 15, nameKey: 'achievement.15.name', icon: '📦', target: { type: 'upgCountAtLeast',        value: 7 },         loreKey: 'achievement.15.lore' },
    { id: 16, nameKey: 'achievement.16.name', icon: '😤', target: { type: 'passiveAtLeast',         value: 50 },        loreKey: 'achievement.16.lore' },
    { id: 17, nameKey: 'achievement.17.name', icon: '🏭', target: { type: 'passiveAtLeast',         value: 200 },       loreKey: 'achievement.17.lore' },
    { id: 18, nameKey: 'achievement.18.name', icon: '🪐', target: { type: 'planetsAtLeast',         value: 5 },         loreKey: 'achievement.18.lore' },
    { id: 19, nameKey: 'achievement.19.name', icon: '💎', target: { type: 'totalAtLeast',           value: 1e9 },       loreKey: 'achievement.19.lore' },
    { id: 20, nameKey: 'achievement.20.name', icon: '⛏️', target: { type: 'totalAtLeast',           value: 1e12 },      loreKey: 'achievement.20.lore' },
    { id: 21, nameKey: 'achievement.21.name', icon: '🌌', target: { type: 'totalAtLeast',           value: 1e15 },      loreKey: 'achievement.21.lore' },
    { id: 22, nameKey: 'achievement.22.name', icon: '👁️', target: { type: 'totalAtLeast',           value: 1e18 },      loreKey: 'achievement.22.lore' },
    { id: 23, nameKey: 'achievement.23.name', icon: '🖱️', target: { type: 'clicksAtLeast',          value: 50_000 },    loreKey: 'achievement.23.lore' },
    { id: 24, nameKey: 'achievement.24.name', icon: '💯', target: { type: 'clicksAtLeast',          value: 100_000 },   loreKey: 'achievement.24.lore' },
    { id: 25, nameKey: 'achievement.25.name', icon: '☝️', target: { type: 'clicksAtLeast',          value: 500_000 },   loreKey: 'achievement.25.lore' },
    { id: 26, nameKey: 'achievement.26.name', icon: '⚛️', target: { type: 'clicksAtLeast',          value: 1_000_000 }, loreKey: 'achievement.26.lore' },
    { id: 27, nameKey: 'achievement.27.name', icon: '🌍', target: { type: 'planetsAtLeast',         value: 10 },        loreKey: 'achievement.27.lore' },
    { id: 28, nameKey: 'achievement.28.name', icon: '🗺️', target: { type: 'planetsAtLeast',         value: 25 },        loreKey: 'achievement.28.lore' },
    { id: 29, nameKey: 'achievement.29.name', icon: '🏴', target: { type: 'planetsAtLeast',         value: 50 },        loreKey: 'achievement.29.lore' },
    { id: 30, nameKey: 'achievement.30.name', icon: '🌐', target: { type: 'planetsAtLeast',         value: 100 },       loreKey: 'achievement.30.lore' },
    { id: 31, nameKey: 'achievement.31.name', icon: '🌠', target: { type: 'planetsAtLeast',         value: 250 },       loreKey: 'achievement.31.lore' },
    { id: 32, nameKey: 'achievement.32.name', icon: '💀', target: { type: 'planetsAtLeast',         value: 500 },       loreKey: 'achievement.32.lore' },
    { id: 33, nameKey: 'achievement.33.name', icon: '⚙️', target: { type: 'passiveAtLeast',         value: 1_000 },     loreKey: 'achievement.33.lore' },
    { id: 34, nameKey: 'achievement.34.name', icon: '🤖', target: { type: 'passiveAtLeast',         value: 10_000 },    loreKey: 'achievement.34.lore' },
    { id: 35, nameKey: 'achievement.35.name', icon: '🏗️', target: { type: 'passiveAtLeast',         value: 100_000 },   loreKey: 'achievement.35.lore' },
    { id: 36, nameKey: 'achievement.36.name', icon: '🌋', target: { type: 'passiveAtLeast',         value: 1_000_000 }, loreKey: 'achievement.36.lore' },
    { id: 37, nameKey: 'achievement.37.name', icon: '🔧', target: { type: 'upgCountAtLeast',        value: 10 },        loreKey: 'achievement.37.lore' },
    { id: 38, nameKey: 'achievement.38.name', icon: '🛠️', target: { type: 'upgCountAtLeast',        value: 14 },        loreKey: 'achievement.38.lore' },
    { id: 39, nameKey: 'achievement.39.name', icon: '⚔️', target: { type: 'battlesWonAtLeast',      value: 1 },         loreKey: 'achievement.39.lore' },
    { id: 40, nameKey: 'achievement.40.name', icon: '🛡️', target: { type: 'battlesWonAtLeast',      value: 10 },        loreKey: 'achievement.40.lore' },
    { id: 41, nameKey: 'achievement.41.name', icon: '🌑', target: { type: 'battlesWonAtLeast',      value: 50 },        loreKey: 'achievement.41.lore' },
    { id: 42, nameKey: 'achievement.42.name', icon: '🏆', target: { type: 'battlesWonAtLeast',      value: 200 },       loreKey: 'achievement.42.lore' },
    { id: 43, nameKey: 'achievement.43.name', icon: '💥', target: { type: 'battlesWonAtLeast',      value: 1_000 },     loreKey: 'achievement.43.lore' },
    { id: 44, nameKey: 'achievement.44.name', icon: '✨', target: { type: 'battleCondition',        conditionKey: 'winWithHighTimer' },   loreKey: 'achievement.44.lore' },
    { id: 45, nameKey: 'achievement.45.name', icon: '⏱️', target: { type: 'battleCondition',        conditionKey: 'winInLastSeconds' },   loreKey: 'achievement.45.lore' },
    { id: 46, nameKey: 'achievement.46.name', icon: '⚡', target: { type: 'battleCondition',        conditionKey: 'fiveUltsInBattle' },   loreKey: 'achievement.46.lore' },
    { id: 47, nameKey: 'achievement.47.name', icon: '🎯', target: { type: 'battleWinStreakAtLeast', value: 10 },        loreKey: 'achievement.47.lore' },
    { id: 48, nameKey: 'achievement.48.name', icon: '👑', target: { type: 'battleWinStreakAtLeast', value: 50 },        loreKey: 'achievement.48.lore' },
    { id: 49, nameKey: 'achievement.49.name', icon: '🔬', target: { type: 'researchCountAtLeast',   value: 1 },         loreKey: 'achievement.49.lore' },
    { id: 50, nameKey: 'achievement.50.name', icon: '📚', target: { type: 'researchCountAtLeast',   value: 5 },         loreKey: 'achievement.50.lore' },
    { id: 51, nameKey: 'achievement.51.name', icon: '🎓', target: { type: 'researchCountAtLeast',   value: 15 },        loreKey: 'achievement.51.lore' },
    { id: 52, nameKey: 'achievement.52.name', icon: '🧪', target: { type: 'researchCountAtLeast',   value: 30 },        loreKey: 'achievement.52.lore' },
    { id: 53, nameKey: 'achievement.53.name', icon: '🔭', target: { type: 'researchCountAtLeast',   value: 50 },        loreKey: 'achievement.53.lore' },
    { id: 54, nameKey: 'achievement.54.name', icon: '🌐', target: { type: 'researchCountAtLeast',   value: 60 },        loreKey: 'achievement.54.lore' },
    { id: 55, nameKey: 'achievement.55.name', icon: '📋', target: { type: 'playerLevelAtLeast',     value: 5 },         loreKey: 'achievement.55.lore' },
    { id: 56, nameKey: 'achievement.56.name', icon: '📈', target: { type: 'playerLevelAtLeast',     value: 10 },        loreKey: 'achievement.56.lore' },
    { id: 57, nameKey: 'achievement.57.name', icon: '🏛️', target: { type: 'playerLevelAtLeast',     value: 20 },        loreKey: 'achievement.57.lore' },
    { id: 58, nameKey: 'achievement.58.name', icon: '🌟', target: { type: 'playerLevelAtLeast',     value: 40 },        loreKey: 'achievement.58.lore' },
    { id: 59, nameKey: 'achievement.59.name', icon: '🔮', target: { type: 'playerLevelAtLeast',     value: 60 },        loreKey: 'achievement.59.lore' },
    { id: 60, nameKey: 'achievement.60.name', icon: '💫', target: { type: 'playerLevelAtLeast',     value: 100 },       loreKey: 'achievement.60.lore' },
    { id: 61, nameKey: 'achievement.61.name', icon: '💠', target: { type: 'metalAtLeast', metalId: 'voidCrystal', value: 1 },   loreKey: 'achievement.61.lore' },
    { id: 62, nameKey: 'achievement.62.name', icon: '🔷', target: { type: 'metalAtLeast', metalId: 'voidCrystal', value: 100 }, loreKey: 'achievement.62.lore' },
    { id: 63, nameKey: 'achievement.63.name', icon: '🔶', target: { type: 'metalAtLeast', metalId: 'echoShard',   value: 100 }, loreKey: 'achievement.63.lore' },
    { id: 64, nameKey: 'achievement.64.name', icon: '🥈', target: { type: 'metalAtLeast', metalId: 'iridium',     value: 500 }, loreKey: 'achievement.64.lore' },
    { id: 65, nameKey: 'achievement.65.name', icon: '🏅', target: { type: 'allMetalsAtLeast',       value: 500 },       loreKey: 'achievement.65.lore' },
    { id: 66, nameKey: 'achievement.66.name', icon: '🌍', target: { type: 'planetsAtLeast',         value: 50 },        loreKey: 'achievement.66.lore' },
    { id: 67, nameKey: 'achievement.67.name', icon: '🌌', target: { type: 'planetsAtLeast',         value: 100 },       loreKey: 'achievement.67.lore' },
    { id: 68, nameKey: 'achievement.68.name', icon: '🌀', target: { type: 'planetsAtLeast',         value: 150 },       loreKey: 'achievement.68.lore' },
    { id: 69, nameKey: 'achievement.69.name', icon: '💀', target: { type: 'planetsAtLeast',         value: 500 },       loreKey: 'achievement.69.lore' },
  ],
};

// ── player ────────────────────────────────────────────────────────────────────
export const playerData = {
  xpThresholds: [
    0, 100, 300, 700, 1_500, 3_000, 6_000, 12_000, 22_000, 40_000,
    70_000, 120_000, 200_000, 320_000, 500_000, 750_000, 1_100_000, 1_600_000, 2_200_000, 3_000_000,
    3_958_524, 5_223_303, 6_892_190, 9_094_299, 12_000_000, 15_267_116, 19_423_735, 24_712_034, 31_440_123, 40_000_000,
    49_829_238, 62_073_823, 77_327_282, 96_328_987, 120_000_000, 150_309_123, 188_273_604, 235_827_004, 295_391_251, 370_000_000,
    460_086_951, 572_108_116, 711_403_997, 884_615_395, 1_100_000_000, 1_344_430_632, 1_643_176_113, 2_008_305_728, 2_454_570_672, 3_000_000_000,
    3_626_704_146, 4_384_327_655, 5_300_219_762, 6_407_442_995, 7_745_966_692, 9_364_109_840, 11_320_285_328, 13_685_108_578, 16_543_946_674, 20_000_000_000,
    24_464_487_485, 29_925_557_395, 36_605_671_218, 44_776_949_269, 54_772_255_751, 66_998_758_266, 81_954_514_155, 100_248_759_294, 122_626_725_856, 150_000_000_000,
    181_335_207_314, 219_216_382_743, 265_010_988_075, 320_372_149_754, 387_298_334_621, 468_205_492_005, 566_014_266_387, 684_255_428_919, 827_197_333_723, 1_000_000_000_000,
    1_214_814_044_039, 1_475_773_161_595, 1_792_789_962_521, 2_177_906_424_483, 2_645_751_311_065, 3_214_095_849_716, 3_904_528_777_123, 4_743_276_393_803, 5_762_198_777_951, 7_000_000_000_000,
    8_520_895_446_666, 10_372_237_030_430, 12_625_821_040_619, 15_369_043_002_204, 18_708_286_933_870, 22_773_050_992_818, 27_720_969_501_628, 33_743_926_114_798, 41_075_495_197_744, 50_000_000_000_000,
  ],
  maxLevel: 100,
  titles: Array.from({ length: 100 }, (_, i) => `player.title.${i + 1}`),
};
