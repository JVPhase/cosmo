import { PrismaClient } from '@prisma/client';
import {
  FORMULA_CONSTANTS,
  UPGRADES_DATA,
  ZONES_DATA,
  PLANETS_PER_SECTOR,
  SECTORS_PER_ZONE,
  TOTAL_SECTORS,
  TOTAL_PLANETS,
  EXPEDITIONS_DATA,
  SHOP_DATA,
  METAL_TIER_DATA,
  RESEARCH_DATA,
  XP_THRESHOLDS,
  MAX_LEVEL,
  MODULES_DATA,
  MAX_MODULE_LEVEL,
  CANNONS_DATA,
  PLANET_DROP_TABLE,
  SHIPS_DATA,
  ZONE_ALIEN_DATA,
  BATTLE_DURATION_MS,
  ACHIEVEMENTS_DATA,
  ACHIEVEMENT_CLAIM_CREDITS,
  HARDCODED_PLANETS_DATA,
  PLANET_ZONE_THEMES_DATA,
} from '@cosmo/game-config';

const prisma = new PrismaClient();

const CONFIG_ENTRIES: Array<{ key: string; data: unknown }> = [
  { key: 'formulaConstants', data: FORMULA_CONSTANTS },
  { key: 'upgrades', data: UPGRADES_DATA },
  {
    key: 'sectors',
    data: {
      zones: ZONES_DATA,
      planetsPerSector: PLANETS_PER_SECTOR,
      sectorsPerZone: SECTORS_PER_ZONE,
      totalSectors: TOTAL_SECTORS,
      totalPlanets: TOTAL_PLANETS,
    },
  },
  { key: 'expeditions', data: EXPEDITIONS_DATA },
  { key: 'shop', data: { items: SHOP_DATA, metalTiers: METAL_TIER_DATA } },
  { key: 'research', data: RESEARCH_DATA },
  { key: 'player', data: { xpThresholds: XP_THRESHOLDS, maxLevel: MAX_LEVEL } },
  { key: 'modules', data: { definitions: MODULES_DATA, maxLevel: MAX_MODULE_LEVEL } },
  { key: 'cannons', data: CANNONS_DATA },
  { key: 'metals', data: { planetDropTable: PLANET_DROP_TABLE } },
  { key: 'ships', data: SHIPS_DATA },
  { key: 'aliens', data: { zoneData: ZONE_ALIEN_DATA, battleDurationMs: BATTLE_DURATION_MS } },
  {
    key: 'achievements',
    data: { claimCredits: ACHIEVEMENT_CLAIM_CREDITS, data: ACHIEVEMENTS_DATA },
  },
  {
    key: 'planets',
    data: { overrides: HARDCODED_PLANETS_DATA, zoneThemes: PLANET_ZONE_THEMES_DATA },
  },
];

// ── Shop items seeded for Telegram Stars purchases ────────────────────────────
// These mirror the in-game shop items from SHOP_DATA but are stored in the DB
// so they can be purchased via Telegram Stars in the Mini App.
// priceStars: Telegram Stars amount (1 Star ≈ $0.013 USD at time of writing)
// priceCredits: in-game credit cost (same as SHOP_DATA credit prices)

type ShopItemSeed = {
  id: string;
  type: string;
  name: string;
  description: string;
  priceStars: number | null;
  priceCredits: number | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
};

const SHOP_ITEMS: ShopItemSeed[] = [
  // ── Boosters ───────────────────────────────────────────────────────────────
  {
    id: 'booster_mining_1h',
    type: 'booster',
    name: '⚡ Mining Boost ×2',
    description: 'Doubles your click power for 1 hour.',
    priceStars: 25,
    priceCredits: 80,
    metadata: { effectType: 'clickMultiplier', multiplier: 2, durationMs: 3_600_000 },
    sortOrder: 10,
  },
  {
    id: 'booster_xp_1h',
    type: 'booster',
    name: '🎓 XP Boost ×2',
    description: 'Doubles XP earned for 1 hour.',
    priceStars: 20,
    priceCredits: 60,
    metadata: { effectType: 'xpMultiplier', multiplier: 2, durationMs: 3_600_000 },
    sortOrder: 11,
  },
  {
    id: 'booster_metal_1h',
    type: 'booster',
    name: '🔩 Metal Drop +50%',
    description: 'Increases metal drop chance by 50% for 1 hour.',
    priceStars: 30,
    priceCredits: 90,
    metadata: { effectType: 'metalDropBonus', bonus: 0.5, durationMs: 3_600_000 },
    sortOrder: 12,
  },
  {
    id: 'booster_battle_30m',
    type: 'booster',
    name: '⚔️ Battle Boost ×1.5',
    description: 'Increases battle damage by 1.5× for 30 minutes.',
    priceStars: 15,
    priceCredits: 50,
    metadata: { effectType: 'damageMultiplier', multiplier: 1.5, durationMs: 1_800_000 },
    sortOrder: 13,
  },

  // ── Metal Packs ────────────────────────────────────────────────────────────
  {
    id: 'metal_iron',
    type: 'metal_pack',
    name: '🪨 Iron Pack ×50',
    description: '50 units of Iron delivered directly to your cargo hold.',
    priceStars: 10,
    priceCredits: 30,
    metadata: { metalId: 'iron', quantity: 50 },
    sortOrder: 20,
  },
  {
    id: 'metal_titan',
    type: 'metal_pack',
    name: '⚙️ Titan Pack ×20',
    description: '20 units of Titan.',
    priceStars: 25,
    priceCredits: 70,
    metadata: { metalId: 'titan', quantity: 20 },
    sortOrder: 21,
  },
  {
    id: 'metal_iridium',
    type: 'metal_pack',
    name: '💎 Iridium Pack ×10',
    description: '10 units of Iridium.',
    priceStars: 50,
    priceCredits: 140,
    metadata: { metalId: 'iridium', quantity: 10 },
    sortOrder: 22,
  },
  {
    id: 'metal_void',
    type: 'metal_pack',
    name: '🌌 Void Crystal ×5',
    description: '5 Void Crystals, rare tier-3 material.',
    priceStars: 90,
    priceCredits: 250,
    metadata: { metalId: 'voidCrystal', quantity: 5 },
    sortOrder: 23,
  },
  {
    id: 'metal_echo',
    type: 'metal_pack',
    name: '🔊 Echo Shard ×5',
    description: '5 Echo Shards, rare tier-3 material.',
    priceStars: 90,
    priceCredits: 250,
    metadata: { metalId: 'echoShard', quantity: 5 },
    sortOrder: 24,
  },

  // ── Loot Boxes ────────────────────────────────────────────────────────────
  {
    id: 'loot_box_basic',
    type: 'loot_box',
    name: '📦 Basic Crate',
    description: 'Contains a random amount of Iron, Titan, or Iridium.',
    priceStars: 15,
    priceCredits: 40,
    metadata: { tier: 'basic', pool: ['iron', 'titan', 'iridium'] },
    sortOrder: 30,
  },
  {
    id: 'loot_box_advanced',
    type: 'loot_box',
    name: '📦 Advanced Crate',
    description: 'All base metals plus a chance at rare materials.',
    priceStars: 40,
    priceCredits: 120,
    metadata: { tier: 'advanced', pool: ['iron', 'titan', 'iridium', 'voidCrystal', 'echoShard'] },
    sortOrder: 31,
  },
  {
    id: 'loot_box_premium',
    type: 'loot_box',
    name: '🎁 Premium Crate',
    description: 'Guaranteed rare materials with double quantities.',
    priceStars: 120,
    priceCredits: 350,
    metadata: { tier: 'premium', pool: ['voidCrystal', 'echoShard'], guaranteed: true, doubleQty: true },
    sortOrder: 32,
  },

  // ── Premium Unlocks ───────────────────────────────────────────────────────
  {
    id: 'premium_sector_skip',
    type: 'premium_unlock',
    name: '🚀 Sector Skip',
    description: 'Instantly unlock the next sector without grinding the cost.',
    priceStars: 200,
    priceCredits: null,
    metadata: { effect: 'unlockNextSector' },
    sortOrder: 40,
  },
  {
    id: 'premium_research_reset',
    type: 'premium_unlock',
    name: '🔬 Research Reset',
    description: 'Reset all research nodes and recover spent energy.',
    priceStars: 150,
    priceCredits: null,
    metadata: { effect: 'resetResearch' },
    sortOrder: 41,
  },

  // ── Credit Packs (Telegram Stars → in-game credits) ──────────────────────
  // On purchase these are credited directly to UserSave.data.credits (not inventory).
  {
    id: 'credits_100',
    type: 'currency_pack',
    name: '💰 100 Credits',
    description: '100 in-game credits.',
    priceStars: 15,
    priceCredits: null,
    metadata: { creditAmount: 100 },
    sortOrder: 50,
  },
  {
    id: 'credits_1000',
    type: 'currency_pack',
    name: '💰 1 000 Credits',
    description: '1 000 in-game credits — saves 13% vs buying individually.',
    priceStars: 130,
    priceCredits: null,
    metadata: { creditAmount: 1000 },
    sortOrder: 51,
  },
  {
    id: 'credits_10000',
    type: 'currency_pack',
    name: '💰 10 000 Credits',
    description: '10 000 in-game credits — best value, saves 33%.',
    priceStars: 1000,
    priceCredits: null,
    metadata: { creditAmount: 10000 },
    sortOrder: 52,
  },
];

async function main() {
  console.log('Seeding GameConfig table...');
  for (const entry of CONFIG_ENTRIES) {
    await prisma.gameConfig.upsert({
      where: { key: entry.key },
      update: { data: entry.data as object, version: { increment: 1 } },
      create: { key: entry.key, data: entry.data as object },
    });
    console.log(`  ✓ ${entry.key}`);
  }

  console.log('Seeding ShopItem table...');
  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        priceStars: item.priceStars,
        priceCredits: item.priceCredits,
        metadata: item.metadata,
        sortOrder: item.sortOrder,
      },
      create: {
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        priceStars: item.priceStars,
        priceCredits: item.priceCredits,
        metadata: item.metadata,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
    console.log(`  ✓ ${item.id}`);
  }

  // Deactivate legacy credit pack IDs replaced by credits_100/1000/10000
  const legacyIds = ['credits_small', 'credits_medium', 'credits_large'];
  const deactivated = await prisma.shopItem.updateMany({
    where: { id: { in: legacyIds } },
    data: { isActive: false },
  });
  if (deactivated.count > 0) {
    console.log(`  ↩ deactivated ${deactivated.count} legacy credit pack(s)`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
