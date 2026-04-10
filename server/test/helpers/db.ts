/**
 * DB helpers for contract tests.
 *
 * Each helper creates exactly the rows it describes.
 * Cleanup is always by userId cascade — deleting the User row removes everything.
 *
 * Uses a fresh PrismaClient bound to DATABASE_URL from process.env.
 * Set via --env-file=.env.test before any module load.
 */
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient({ log: [] });

// ── User helpers ──────────────────────────────────────────────────────────────

export async function createTestUser(): Promise<{ id: string }> {
  return db.user.create({ data: {} });
}

/**
 * Creates a TelegramUser linked to the given userId.
 * Uses a timestamp-based telegramId to avoid unique-constraint collisions
 * between parallel test runs.
 */
export async function createTestTelegramUser(userId: string): Promise<void> {
  const telegramId =
    BigInt(Date.now()) * 1_000n + BigInt(Math.floor(Math.random() * 1_000));
  await db.telegramUser.create({
    data: {
      telegramId,
      firstName: 'ContractTest',
      userId,
    },
  });
}

// ── Save helpers ──────────────────────────────────────────────────────────────

export async function createTestSave(userId: string, data: object): Promise<void> {
  await db.userSave.create({ data: { userId, data, rev: 1 } });
}

// ── Shop helpers ──────────────────────────────────────────────────────────────

type ShopItemOverrides = {
  type?: string;
  name?: string;
  description?: string;
  priceStars?: number | null;
  priceCredits?: number | null;
  metadata?: object;
  sortOrder?: number;
};

export async function upsertTestShopItem(
  id: string,
  overrides: ShopItemOverrides = {},
): Promise<void> {
  await db.shopItem.upsert({
    where: { id },
    create: {
      id,
      type: overrides.type ?? 'currency_pack',
      name: overrides.name ?? `Test ${id}`,
      description: overrides.description ?? 'Contract test item',
      priceStars: overrides.priceStars ?? 10,
      priceCredits: overrides.priceCredits ?? null,
      metadata: overrides.metadata ?? { creditAmount: 100, deliveryMode: 'grant_sync' },
      isActive: true,
      sortOrder: overrides.sortOrder ?? 9999,
    },
    update: {},
  });
}

export async function deleteTestShopItem(id: string): Promise<void> {
  await db.shopItem.delete({ where: { id } }).catch(() => {});
}

// ── Purchase helpers ──────────────────────────────────────────────────────────

export async function createTestPurchase(
  userId: string,
  shopItemId: string,
): Promise<{ id: string }> {
  return db.purchase.create({
    data: {
      userId,
      shopItemId,
      paymentMethod: 'stars',
      starsAmount: 10,
      status: 'pending',
    },
  });
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

/** Deletes the user and all cascade-related rows (saves, grants, purchases, etc.). */
export async function cleanupUser(userId: string): Promise<void> {
  await db.user.delete({ where: { id: userId } }).catch(() => {});
}
