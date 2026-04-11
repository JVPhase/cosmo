import { PrismaClient } from '@prisma/client';
import {
  formulaConstantsData,
  upgradesData,
  cannonsData,
  shipsData,
  modulesData,
  expeditionsData,
  shopData,
  sectorsData,
  aliensData,
  planetsData,
  metalsData,
  researchData,
  achievementsData,
  playerData,
} from './configData';

const prisma = new PrismaClient();

const CONFIG_ENTRIES: Array<{ key: string; data: unknown }> = [
  { key: 'formulaConstants', data: formulaConstantsData },
  { key: 'upgrades', data: upgradesData },
  { key: 'sectors', data: sectorsData },
  { key: 'expeditions', data: expeditionsData },
  { key: 'shop', data: shopData },
  { key: 'research', data: researchData },
  { key: 'player', data: playerData },
  { key: 'modules', data: modulesData },
  { key: 'cannons', data: cannonsData },
  { key: 'metals', data: metalsData },
  { key: 'ships', data: shipsData },
  { key: 'aliens', data: aliensData },
  { key: 'achievements', data: achievementsData },
  { key: 'planets', data: planetsData },
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

// deliveryMode values:
//   'grant_sync'   — delivered via Grant sync to mobile (P0 supported)
//   'unsupported'  — no deterministic mobile apply path yet; hidden from catalog
//   'server_only'  — server-side only effect, no mobile sync needed
const SHOP_ITEMS: ShopItemSeed[] = [
  // ── Boosters (grant_sync) ──────────────────────────────────────────────────
  {
    id: 'booster_mining_1h',
    type: 'booster',
    name: '⚡ Mining Boost ×2',
    description: 'Doubles your click power for 1 hour.',
    priceStars: 25,
    priceCredits: 80,
    metadata: { effectType: 'clickMultiplier', multiplier: 2, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 10,
  },
  {
    id: 'booster_xp_1h',
    type: 'booster',
    name: '🎓 XP Boost ×2',
    description: 'Doubles XP earned for 1 hour.',
    priceStars: 20,
    priceCredits: 60,
    metadata: { effectType: 'xpMultiplier', multiplier: 2, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 11,
  },
  {
    id: 'booster_metal_1h',
    type: 'booster',
    name: '🔩 Metal Drop +50%',
    description: 'Increases metal drop chance by 50% for 1 hour.',
    priceStars: 30,
    priceCredits: 90,
    metadata: { effectType: 'metalDropBonus', bonus: 0.5, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 12,
  },
  {
    id: 'booster_battle_30m',
    type: 'booster',
    name: '⚔️ Battle Boost ×1.5',
    description: 'Increases battle damage by 1.5× for 30 minutes.',
    priceStars: 15,
    priceCredits: 50,
    metadata: { effectType: 'damageMultiplier', multiplier: 1.5, durationMs: 1_800_000, deliveryMode: 'grant_sync' },
    sortOrder: 13,
  },

  // ── Metal Packs (grant_sync) ───────────────────────────────────────────────
  {
    id: 'metal_iron',
    type: 'metal_pack',
    name: '🪨 Iron Pack ×50',
    description: '50 units of Iron delivered to your cargo hold.',
    priceStars: 10,
    priceCredits: 30,
    metadata: { metalId: 'iron', quantity: 50, deliveryMode: 'grant_sync' },
    sortOrder: 20,
  },
  {
    id: 'metal_titan',
    type: 'metal_pack',
    name: '⚙️ Titan Pack ×20',
    description: '20 units of Titan.',
    priceStars: 25,
    priceCredits: 70,
    metadata: { metalId: 'titan', quantity: 20, deliveryMode: 'grant_sync' },
    sortOrder: 21,
  },
  {
    id: 'metal_iridium',
    type: 'metal_pack',
    name: '💎 Iridium Pack ×10',
    description: '10 units of Iridium.',
    priceStars: 50,
    priceCredits: 140,
    metadata: { metalId: 'iridium', quantity: 10, deliveryMode: 'grant_sync' },
    sortOrder: 22,
  },
  {
    id: 'metal_void',
    type: 'metal_pack',
    name: '🌌 Void Crystal ×5',
    description: '5 Void Crystals, rare tier-3 material.',
    priceStars: 90,
    priceCredits: 250,
    metadata: { metalId: 'voidCrystal', quantity: 5, deliveryMode: 'grant_sync' },
    sortOrder: 23,
  },
  {
    id: 'metal_echo',
    type: 'metal_pack',
    name: '🔊 Echo Shard ×5',
    description: '5 Echo Shards, rare tier-3 material.',
    priceStars: 90,
    priceCredits: 250,
    metadata: { metalId: 'echoShard', quantity: 5, deliveryMode: 'grant_sync' },
    sortOrder: 24,
  },

  // ── Loot Boxes (grant_sync) ────────────────────────────────────────────────
  {
    id: 'loot_box_basic',
    type: 'loot_box',
    name: '📦 Basic Crate',
    description: 'Contains a random amount of Iron, Titan, or Iridium.',
    priceStars: 15,
    priceCredits: 40,
    metadata: { tier: 'basic', pool: ['iron', 'titan', 'iridium'], deliveryMode: 'grant_sync' },
    sortOrder: 30,
  },
  {
    id: 'loot_box_advanced',
    type: 'loot_box',
    name: '📦 Advanced Crate',
    description: 'All base metals plus a chance at rare materials.',
    priceStars: 40,
    priceCredits: 120,
    metadata: { tier: 'advanced', pool: ['iron', 'titan', 'iridium', 'voidCrystal', 'echoShard'], deliveryMode: 'grant_sync' },
    sortOrder: 31,
  },
  {
    id: 'loot_box_premium',
    type: 'loot_box',
    name: '🎁 Premium Crate',
    description: 'Guaranteed rare materials with double quantities.',
    priceStars: 120,
    priceCredits: 350,
    metadata: { tier: 'premium', pool: ['voidCrystal', 'echoShard'], guaranteed: true, doubleQty: true, deliveryMode: 'grant_sync' },
    sortOrder: 32,
  },

  // ── Premium Unlocks (unsupported in P0) ───────────────────────────────────
  // Hidden from catalog until a deterministic mobile apply path exists.
  {
    id: 'premium_sector_skip',
    type: 'premium_unlock',
    name: '🚀 Sector Skip',
    description: 'Instantly unlock the next sector without grinding the cost.',
    priceStars: 200,
    priceCredits: null,
    metadata: { effect: 'unlockNextSector', deliveryMode: 'unsupported' },
    sortOrder: 40,
  },
  {
    id: 'premium_research_reset',
    type: 'premium_unlock',
    name: '🔬 Research Reset',
    description: 'Reset all research nodes and recover spent energy.',
    priceStars: 150,
    priceCredits: null,
    metadata: { effect: 'resetResearch', deliveryMode: 'unsupported' },
    sortOrder: 41,
  },

  // ── Credit Packs (grant_sync) ─────────────────────────────────────────────
  // Delivered via credits_grant to mobile via sync.
  {
    id: 'credits_100',
    type: 'currency_pack',
    name: '💰 100 Credits',
    description: '100 in-game credits.',
    priceStars: 15,
    priceCredits: null,
    metadata: { creditAmount: 100, deliveryMode: 'grant_sync' },
    sortOrder: 50,
  },
  {
    id: 'credits_1000',
    type: 'currency_pack',
    name: '💰 1 000 Credits',
    description: '1 000 in-game credits — saves 13% vs buying individually.',
    priceStars: 130,
    priceCredits: null,
    metadata: { creditAmount: 1000, deliveryMode: 'grant_sync' },
    sortOrder: 51,
  },
  {
    id: 'credits_10000',
    type: 'currency_pack',
    name: '💰 10 000 Credits',
    description: '10 000 in-game credits — best value, saves 33%.',
    priceStars: 1000,
    priceCredits: null,
    metadata: { creditAmount: 10000, deliveryMode: 'grant_sync' },
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
