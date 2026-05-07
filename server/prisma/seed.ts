import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
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
  dialoguesData,
  charactersData,
} from './configData';
import { seedLocaleBundles } from './localeBundles';

const prisma = new PrismaClient();

function readRequiredSeedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

async function seedCrmAdmin() {
  const email = readRequiredSeedEnv('CRM_ADMIN_EMAIL');
  const password = readRequiredSeedEnv('CRM_ADMIN_PASSWORD');

  if (!email && !password) {
    console.log(
      'Skipping CRM admin seed: CRM_ADMIN_EMAIL / CRM_ADMIN_PASSWORD are not set.',
    );
    return;
  }

  if (!email || !password) {
    throw new Error(
      'CRM admin seed requires both CRM_ADMIN_EMAIL and CRM_ADMIN_PASSWORD.',
    );
  }

  if (password.length < 8) {
    throw new Error('CRM_ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const emailNorm = email.toLowerCase();
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email: emailNorm },
    update: { passwordHash },
    create: { email: emailNorm, passwordHash },
  });

  await prisma.crmUser.upsert({
    where: { userId: user.id },
    update: { role: 'admin' },
    create: { userId: user.id, role: 'admin' },
  });

  console.log(`  ✓ seeded CRM admin ${emailNorm}`);
}

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
  { key: 'dialogues', data: dialoguesData },
  { key: 'characters', data: charactersData },
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
    name: 'shop.booster_mining_1h.name',
    description: 'shop.booster_mining_1h.description',
    priceStars: 25,
    priceCredits: 80,
    metadata: {
      effectType: 'clickMultiplier',
      multiplier: 2,
      durationMs: 3_600_000,
      deliveryMode: 'grant_sync',
    },
    sortOrder: 10,
  },
  {
    id: 'booster_xp_1h',
    type: 'booster',
    name: 'shop.booster_xp_1h.name',
    description: 'shop.booster_xp_1h.description',
    priceStars: 20,
    priceCredits: 60,
    metadata: {
      effectType: 'xpMultiplier',
      multiplier: 2,
      durationMs: 3_600_000,
      deliveryMode: 'grant_sync',
    },
    sortOrder: 11,
  },
  {
    id: 'booster_metal_1h',
    type: 'booster',
    name: 'shop.booster_metal_1h.name',
    description: 'shop.booster_metal_1h.description',
    priceStars: 30,
    priceCredits: 90,
    metadata: {
      effectType: 'metalDropBonus',
      bonus: 0.5,
      durationMs: 3_600_000,
      deliveryMode: 'grant_sync',
    },
    sortOrder: 12,
  },
  {
    id: 'booster_battle_30m',
    type: 'booster',
    name: 'shop.booster_battle_30m.name',
    description: 'shop.booster_battle_30m.description',
    priceStars: 15,
    priceCredits: 50,
    metadata: {
      effectType: 'damageMultiplier',
      multiplier: 1.5,
      durationMs: 1_800_000,
      deliveryMode: 'grant_sync',
    },
    sortOrder: 13,
  },

  // ── Metal Packs (grant_sync) ───────────────────────────────────────────────
  {
    id: 'metal_iron',
    type: 'metal_pack',
    name: 'shop.metal_iron.name',
    description: 'shop.metal_iron.description',
    priceStars: 10,
    priceCredits: 30,
    metadata: { metalId: 'iron', quantity: 50, deliveryMode: 'grant_sync' },
    sortOrder: 20,
  },
  {
    id: 'metal_titan',
    type: 'metal_pack',
    name: 'shop.metal_titan.name',
    description: 'shop.metal_titan.description',
    priceStars: 25,
    priceCredits: 70,
    metadata: { metalId: 'titan', quantity: 20, deliveryMode: 'grant_sync' },
    sortOrder: 21,
  },
  {
    id: 'metal_iridium',
    type: 'metal_pack',
    name: 'shop.metal_iridium.name',
    description: 'shop.metal_iridium.description',
    priceStars: 50,
    priceCredits: 140,
    metadata: { metalId: 'iridium', quantity: 10, deliveryMode: 'grant_sync' },
    sortOrder: 22,
  },
  {
    id: 'metal_void',
    type: 'metal_pack',
    name: 'shop.metal_void.name',
    description: 'shop.metal_void.description',
    priceStars: 90,
    priceCredits: 250,
    metadata: {
      metalId: 'voidCrystal',
      quantity: 5,
      deliveryMode: 'grant_sync',
    },
    sortOrder: 23,
  },
  {
    id: 'metal_echo',
    type: 'metal_pack',
    name: 'shop.metal_echo.name',
    description: 'shop.metal_echo.description',
    priceStars: 90,
    priceCredits: 250,
    metadata: { metalId: 'echoShard', quantity: 5, deliveryMode: 'grant_sync' },
    sortOrder: 24,
  },

  // ── Premium Unlocks (unsupported in P0) ───────────────────────────────────
  // Hidden from catalog until a deterministic mobile apply path exists.
  {
    id: 'premium_sector_skip',
    type: 'premium_unlock',
    name: 'shop.premium_sector_skip.name',
    description: 'shop.premium_sector_skip.description',
    priceStars: 200,
    priceCredits: null,
    metadata: { effect: 'unlockNextSector', deliveryMode: 'unsupported' },
    sortOrder: 40,
  },
  {
    id: 'premium_research_reset',
    type: 'premium_unlock',
    name: 'shop.premium_research_reset.name',
    description: 'shop.premium_research_reset.description',
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
    name: 'shop.credits_100.name',
    description: 'shop.credits_100.description',
    priceStars: 15,
    priceCredits: null,
    metadata: { creditAmount: 100, deliveryMode: 'grant_sync' },
    sortOrder: 50,
  },
  {
    id: 'credits_1000',
    type: 'currency_pack',
    name: 'shop.credits_1000.name',
    description: 'shop.credits_1000.description',
    priceStars: 130,
    priceCredits: null,
    metadata: { creditAmount: 1000, deliveryMode: 'grant_sync' },
    sortOrder: 51,
  },
  {
    id: 'credits_10000',
    type: 'currency_pack',
    name: 'shop.credits_10000.name',
    description: 'shop.credits_10000.description',
    priceStars: 1000,
    priceCredits: null,
    metadata: { creditAmount: 10000, deliveryMode: 'grant_sync' },
    sortOrder: 52,
  },
];

// ── IAP Packs ─────────────────────────────────────────────────────────────────

type IapPackSeed = {
  id: string;
  kind: 'ad' | 'iap';
  icon: string;
  credits: number;
  name: string; // i18n key in config namespace
  lore: string; // i18n key in config namespace
  productId: string | null;
  basePrice: string | null;
  sortOrder: number;
};

const IAP_PACKS: IapPackSeed[] = [
  {
    id: 'credits_ad',
    kind: 'ad',
    icon: '📺',
    credits: 30,
    name: 'iap_pack.credits_ad.name',
    lore: 'iap_pack.credits_ad.lore',
    productId: null,
    basePrice: null,
    sortOrder: 0,
  },
  {
    id: 'credits_100',
    kind: 'iap',
    icon: '💳',
    credits: 100,
    name: 'iap_pack.credits_100.name',
    lore: 'iap_pack.credits_100.lore',
    productId: 'cosmo_credits_100',
    basePrice: '$0.99',
    sortOrder: 1,
  },
  {
    id: 'credits_300',
    kind: 'iap',
    icon: '💰',
    credits: 300,
    name: 'iap_pack.credits_300.name',
    lore: 'iap_pack.credits_300.lore',
    productId: 'cosmo_credits_300',
    basePrice: '$1.99',
    sortOrder: 2,
  },
  {
    id: 'credits_800',
    kind: 'iap',
    icon: '🌟',
    credits: 800,
    name: 'iap_pack.credits_800.name',
    lore: 'iap_pack.credits_800.lore',
    productId: 'cosmo_credits_800',
    basePrice: '$4.99',
    sortOrder: 3,
  },
  {
    id: 'credits_2000',
    kind: 'iap',
    icon: '🏦',
    credits: 2000,
    name: 'iap_pack.credits_2000.name',
    lore: 'iap_pack.credits_2000.lore',
    productId: 'cosmo_credits_2000',
    basePrice: '$9.99',
    sortOrder: 4,
  },
];

async function seedIapPacks() {
  console.log('Seeding IapPack table...');
  for (const pack of IAP_PACKS) {
    await prisma.iapPack.upsert({
      where: { id: pack.id },
      update: {
        kind: pack.kind,
        icon: pack.icon,
        credits: pack.credits,
        name: pack.name,
        lore: pack.lore,
        productId: pack.productId,
        basePrice: pack.basePrice,
        sortOrder: pack.sortOrder,
      },
      create: {
        id: pack.id,
        kind: pack.kind,
        icon: pack.icon,
        credits: pack.credits,
        name: pack.name,
        lore: pack.lore,
        productId: pack.productId,
        basePrice: pack.basePrice,
        sortOrder: pack.sortOrder,
        isActive: true,
      },
    });
    console.log(`  ✓ ${pack.id}`);
  }
}

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
        metadata: item.metadata as object,
        sortOrder: item.sortOrder,
      },
      create: {
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        priceStars: item.priceStars,
        priceCredits: item.priceCredits,
        metadata: item.metadata as object,
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

  console.log('Seeding CRM admin user...');
  await seedCrmAdmin();

  await seedIapPacks();

  await seedLocaleBundles(prisma);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
