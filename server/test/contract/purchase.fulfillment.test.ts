/**
 * Contract test: purchase fulfillment
 *
 * Tests the fulfillPurchase() function directly (no HTTP layer).
 *
 * Verifies:
 *   1. currency_pack purchase creates a credits_grant with { amount: number }.
 *   2. booster purchase creates a booster_grant with deterministic payload.
 *   3. metal_pack purchase creates a metal_grant with { metalId, quantity }.
 *   4. loot_box purchase creates a loot_box_reward_grant with { rolledMetals }.
 *   5. Idempotency: calling fulfillPurchase twice for the same purchaseId returns
 *      alreadyFulfilled=true and creates no second grant.
 *   6. GameplaySave / UserSave is NOT mutated by the server during fulfillment.
 *
 * Run: pnpm test:contract
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fulfillPurchase } from '../../src/lib/fulfillment';
import {
  db,
  createTestUser,
  createTestSave,
  upsertTestShopItem,
  createTestPurchase,
  cleanupUser,
  deleteTestShopItem,
} from '../helpers/db';

// ── Test shop item definitions ────────────────────────────────────────────────

const TEST_ITEMS = {
  credits100: {
    id: 'test_contract_credits_100',
    type: 'currency_pack',
    metadata: { creditAmount: 100, deliveryMode: 'grant_sync' },
  },
  metalIron: {
    id: 'test_contract_metal_iron',
    type: 'metal_pack',
    metadata: { metalId: 'iron', quantity: 50, deliveryMode: 'grant_sync' },
  },
  boosterMining: {
    id: 'test_contract_booster_mining',
    type: 'booster',
    metadata: {
      effectType: 'clickMultiplier',
      multiplier: 2,
      durationMs: 3_600_000,
      deliveryMode: 'grant_sync',
    },
  },
  lootBasic: {
    id: 'test_contract_loot_basic',
    type: 'loot_box',
    metadata: { tier: 'basic', deliveryMode: 'grant_sync' },
  },
} as const;

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Contract: purchase fulfillment', () => {
  let userId: string;

  before(async () => {
    // Create test user and seed test shop items
    const user = await createTestUser();
    userId = user.id;

    // Also create a save so we can verify it is NOT mutated
    await createTestSave(userId, {
      version: 2,
      savedAt: 1_700_000_000_000,
      appliedGrantSeq: 0,
      state: { playerXP: 500, credits: 250, totalEarned: 5000 },
    });

    for (const item of Object.values(TEST_ITEMS)) {
      await upsertTestShopItem(item.id, {
        type: item.type,
        metadata: item.metadata,
      });
    }
  });

  after(async () => {
    await cleanupUser(userId);
    for (const item of Object.values(TEST_ITEMS)) {
      await deleteTestShopItem(item.id);
    }
  });

  // ── 1. currency_pack → credits_grant ─────────────────────────────────────

  it('currency_pack: creates credits_grant with { amount: number }', async () => {
    const purchase = await createTestPurchase(userId, TEST_ITEMS.credits100.id);
    const result = await fulfillPurchase(purchase.id);

    assert.ok(result.ok, `fulfillPurchase failed: ${(result as { reason: string }).reason}`);
    assert.equal((result as { alreadyFulfilled: boolean }).alreadyFulfilled, false);

    const grant = await db.grant.findFirst({
      where: { userId, purchaseId: purchase.id },
    });
    assert.ok(grant, 'Grant was not created');
    assert.equal(grant!.kind, 'credits_grant');

    const payload = grant!.payload as Record<string, unknown>;
    assert.equal(typeof payload.amount, 'number', 'credits_grant payload.amount must be number');
    assert.equal(payload.amount, 100);
  });

  // ── 2. booster → booster_grant ───────────────────────────────────────────

  it('booster: creates booster_grant with deterministic payload', async () => {
    const purchase = await createTestPurchase(userId, TEST_ITEMS.boosterMining.id);
    const result = await fulfillPurchase(purchase.id);

    assert.ok(result.ok);

    const grant = await db.grant.findFirst({
      where: { userId, purchaseId: purchase.id },
    });
    assert.ok(grant, 'Grant was not created');
    assert.equal(grant!.kind, 'booster_grant');

    const payload = grant!.payload as Record<string, unknown>;
    assert.equal(typeof payload.shopItemId, 'string');
    assert.equal(payload.shopItemId, TEST_ITEMS.boosterMining.id);
    assert.equal(typeof payload.effectType, 'string');
    assert.equal(payload.effectType, 'clickMultiplier');
    assert.equal(typeof payload.multiplier, 'number');
    assert.equal(payload.multiplier, 2);
    assert.equal(typeof payload.durationMs, 'number');
    assert.equal(payload.durationMs, 3_600_000);

    // Mobile derives instanceId as "grant_<seq>" — verify seq is a number
    assert.equal(typeof grant!.seq, 'number', 'grant.seq must be a number');
    // The expected instanceId the mobile client will build:
    const expectedInstanceId = `grant_${grant!.seq}`;
    assert.ok(
      expectedInstanceId.startsWith('grant_'),
      `Mobile instanceId "${expectedInstanceId}" must match grant_<seq> pattern`,
    );
  });

  // ── 3. metal_pack → metal_grant ──────────────────────────────────────────

  it('metal_pack: creates metal_grant with { metalId: string, quantity: number }', async () => {
    const purchase = await createTestPurchase(userId, TEST_ITEMS.metalIron.id);
    const result = await fulfillPurchase(purchase.id);

    assert.ok(result.ok);

    const grant = await db.grant.findFirst({
      where: { userId, purchaseId: purchase.id },
    });
    assert.ok(grant, 'Grant was not created');
    assert.equal(grant!.kind, 'metal_grant');

    const payload = grant!.payload as Record<string, unknown>;
    assert.equal(typeof payload.metalId, 'string');
    assert.equal(payload.metalId, 'iron');
    assert.equal(typeof payload.quantity, 'number');
    assert.equal(payload.quantity, 50);
  });

  // ── 4. loot_box → loot_box_reward_grant ──────────────────────────────────

  it('loot_box: creates loot_box_reward_grant with { rolledMetals: object }', async () => {
    const purchase = await createTestPurchase(userId, TEST_ITEMS.lootBasic.id);
    const result = await fulfillPurchase(purchase.id);

    assert.ok(result.ok);

    const grant = await db.grant.findFirst({
      where: { userId, purchaseId: purchase.id },
    });
    assert.ok(grant, 'Grant was not created');
    assert.equal(grant!.kind, 'loot_box_reward_grant');

    const payload = grant!.payload as Record<string, unknown>;
    assert.ok(
      typeof payload.rolledMetals === 'object' && payload.rolledMetals !== null,
      'loot_box_reward_grant must have rolledMetals object',
    );
    // Each entry must be a positive number
    const rolledMetals = payload.rolledMetals as Record<string, unknown>;
    for (const [metalId, qty] of Object.entries(rolledMetals)) {
      assert.equal(typeof qty, 'number', `rolledMetals["${metalId}"] must be a number`);
      assert.ok((qty as number) > 0, `rolledMetals["${metalId}"] must be positive`);
    }
    assert.ok(
      Object.keys(rolledMetals).length > 0,
      'loot_box_reward_grant must roll at least one metal',
    );
  });

  // ── 5. Idempotency ────────────────────────────────────────────────────────

  it('idempotency: second fulfillPurchase returns alreadyFulfilled=true, no duplicate grant', async () => {
    const purchase = await createTestPurchase(userId, TEST_ITEMS.credits100.id);

    const r1 = await fulfillPurchase(purchase.id);
    assert.ok(r1.ok);
    assert.equal((r1 as { alreadyFulfilled: boolean }).alreadyFulfilled, false);

    const r2 = await fulfillPurchase(purchase.id);
    assert.ok(r2.ok);
    assert.equal(
      (r2 as { alreadyFulfilled: boolean }).alreadyFulfilled,
      true,
      'Second fulfillPurchase call must be idempotent',
    );

    // Only one grant should exist for this purchase
    const grants = await db.grant.findMany({ where: { purchaseId: purchase.id } });
    assert.equal(grants.length, 1, 'Idempotent fulfillment must not create a second grant');
  });

  it('idempotency: purchase status is "completed" after fulfillment, not "pending"', async () => {
    const purchase = await createTestPurchase(userId, TEST_ITEMS.metalIron.id);
    await fulfillPurchase(purchase.id);

    const updated = await db.purchase.findUnique({ where: { id: purchase.id } });
    assert.equal(updated!.status, 'completed');
    assert.ok(updated!.fulfilledAt !== null, 'fulfilledAt should be set after fulfillment');
  });

  it('uses shop item snapshot from purchase metadata when the catalog item changes later', async () => {
    const purchase = await db.purchase.create({
      data: {
        userId,
        shopItemId: TEST_ITEMS.credits100.id,
        paymentMethod: 'stars',
        starsAmount: 15,
        status: 'pending',
        metadata: {
          initiatedAt: new Date().toISOString(),
          shopItemSnapshot: {
            id: TEST_ITEMS.credits100.id,
            type: 'currency_pack',
            name: 'Snapshot Credits 100',
            description: 'Snapshot payload',
            priceStars: 15,
            priceCredits: null,
            metadata: { creditAmount: 100, deliveryMode: 'grant_sync' },
          },
        },
      },
    });

    await db.shopItem.update({
      where: { id: TEST_ITEMS.credits100.id },
      data: {
        type: 'currency_pack',
        metadata: { creditAmount: 9999, deliveryMode: 'grant_sync' },
      },
    });

    const result = await fulfillPurchase(purchase.id);
    assert.ok(result.ok);

    const grant = await db.grant.findFirst({
      where: { userId, purchaseId: purchase.id },
    });
    assert.ok(grant, 'Grant was not created');
    assert.equal(grant!.kind, 'credits_grant');
    assert.equal((grant!.payload as { amount: number }).amount, 100);
  });

  // ── 6. UserSave not mutated ───────────────────────────────────────────────

  it('GameplaySave/UserSave is NOT mutated during fulfillment', async () => {
    // Read save data before fulfillment
    const saveBefore = await db.userSave.findUnique({ where: { userId } });
    const dataBefore = JSON.stringify(saveBefore!.data);
    const revBefore = saveBefore!.rev;

    const purchase = await createTestPurchase(userId, TEST_ITEMS.credits100.id);
    await fulfillPurchase(purchase.id);

    // Read save data after fulfillment
    const saveAfter = await db.userSave.findUnique({ where: { userId } });
    assert.equal(
      JSON.stringify(saveAfter!.data),
      dataBefore,
      'Server must not mutate UserSave.data during grant fulfillment',
    );
    assert.equal(
      saveAfter!.rev,
      revBefore,
      'Server must not increment UserSave.rev during grant fulfillment',
    );
  });
});
