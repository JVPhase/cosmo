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
} from './configData';
import { messages as localeUiRu } from './locales/mobile.ui.ru';
import { messages as localeAlertsRu } from './locales/mobile.alerts.ru';
import { messages as localeIntroRu } from './locales/mobile.intro.ru';
import { messages as localeStoryRu } from './locales/mobile.story.ru';
import { messages as localeDialoguesRu } from './locales/mobile.dialogues.ru';
import { messages as localeConfigRu } from './locales/mobile.config.ru';
import { messages as localeUiEn } from './locales/mobile.ui.en';
import { messages as localeAlertsEn } from './locales/mobile.alerts.en';
import { messages as localeIntroEn } from './locales/mobile.intro.en';
import { messages as localeStoryEn } from './locales/mobile.story.en';
import { messages as localeDialoguesEn } from './locales/mobile.dialogues.en';
import { messages as localeConfigEn } from './locales/mobile.config.en';

const prisma = new PrismaClient();

function readRequiredSeedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

async function seedCrmAdmin() {
  const email = readRequiredSeedEnv('CRM_ADMIN_EMAIL');
  const password = readRequiredSeedEnv('CRM_ADMIN_PASSWORD');

  if (!email && !password) {
    console.log('Skipping CRM admin seed: CRM_ADMIN_EMAIL / CRM_ADMIN_PASSWORD are not set.');
    return;
  }

  if (!email || !password) {
    throw new Error('CRM admin seed requires both CRM_ADMIN_EMAIL and CRM_ADMIN_PASSWORD.');
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
    metadata: { effectType: 'clickMultiplier', multiplier: 2, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 10,
  },
  {
    id: 'booster_xp_1h',
    type: 'booster',
    name: 'shop.booster_xp_1h.name',
    description: 'shop.booster_xp_1h.description',
    priceStars: 20,
    priceCredits: 60,
    metadata: { effectType: 'xpMultiplier', multiplier: 2, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 11,
  },
  {
    id: 'booster_metal_1h',
    type: 'booster',
    name: 'shop.booster_metal_1h.name',
    description: 'shop.booster_metal_1h.description',
    priceStars: 30,
    priceCredits: 90,
    metadata: { effectType: 'metalDropBonus', bonus: 0.5, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 12,
  },
  {
    id: 'booster_battle_30m',
    type: 'booster',
    name: 'shop.booster_battle_30m.name',
    description: 'shop.booster_battle_30m.description',
    priceStars: 15,
    priceCredits: 50,
    metadata: { effectType: 'damageMultiplier', multiplier: 1.5, durationMs: 1_800_000, deliveryMode: 'grant_sync' },
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
    metadata: { metalId: 'voidCrystal', quantity: 5, deliveryMode: 'grant_sync' },
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

  // ── Loot Boxes (grant_sync) ────────────────────────────────────────────────
  {
    id: 'loot_box_basic',
    type: 'loot_box',
    name: 'shop.loot_box_basic.name',
    description: 'shop.loot_box_basic.description',
    priceStars: 15,
    priceCredits: 40,
    metadata: { tier: 'basic', pool: ['iron', 'titan', 'iridium'], deliveryMode: 'grant_sync' },
    sortOrder: 30,
  },
  {
    id: 'loot_box_advanced',
    type: 'loot_box',
    name: 'shop.loot_box_advanced.name',
    description: 'shop.loot_box_advanced.description',
    priceStars: 40,
    priceCredits: 120,
    metadata: { tier: 'advanced', pool: ['iron', 'titan', 'iridium', 'voidCrystal', 'echoShard'], deliveryMode: 'grant_sync' },
    sortOrder: 31,
  },
  {
    id: 'loot_box_premium',
    type: 'loot_box',
    name: 'shop.loot_box_premium.name',
    description: 'shop.loot_box_premium.description',
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

// ── Locale bundles ────────────────────────────────────────────────────────────

type LocaleBundleSeed = {
  app: string;
  namespace: string;
  locale: string;
  messages: Record<string, string>;
};

const LOCALE_BUNDLES: LocaleBundleSeed[] = [
  { app: 'mobile', namespace: 'ui',        locale: 'ru', messages: localeUiRu },
  { app: 'mobile', namespace: 'alerts',    locale: 'ru', messages: localeAlertsRu },
  { app: 'mobile', namespace: 'intro',     locale: 'ru', messages: localeIntroRu },
  { app: 'mobile', namespace: 'story',     locale: 'ru', messages: localeStoryRu },
  { app: 'mobile', namespace: 'dialogues', locale: 'ru', messages: localeDialoguesRu },
  { app: 'mobile', namespace: 'config',    locale: 'ru', messages: localeConfigRu },
  { app: 'mobile', namespace: 'ui',        locale: 'en', messages: localeUiEn },
  { app: 'mobile', namespace: 'alerts',    locale: 'en', messages: localeAlertsEn },
  { app: 'mobile', namespace: 'intro',     locale: 'en', messages: localeIntroEn },
  { app: 'mobile', namespace: 'story',     locale: 'en', messages: localeStoryEn },
  { app: 'mobile', namespace: 'dialogues', locale: 'en', messages: localeDialoguesEn },
  { app: 'mobile', namespace: 'config',    locale: 'en', messages: localeConfigEn },
];

async function seedLocaleBundles() {
  console.log('Seeding LocaleBundle table...');
  for (const bundle of LOCALE_BUNDLES) {
    await prisma.localeBundle.upsert({
      where: {
        app_namespace_locale: {
          app: bundle.app,
          namespace: bundle.namespace,
          locale: bundle.locale,
        },
      },
      update: {
        messages: bundle.messages as object,
        version: { increment: 1 },
      },
      create: {
        app: bundle.app,
        namespace: bundle.namespace,
        locale: bundle.locale,
        messages: bundle.messages as object,
        version: 1,
      },
    });
    console.log(`  ✓ ${bundle.app}/${bundle.namespace}/${bundle.locale}`);
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

  await seedLocaleBundles();

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
