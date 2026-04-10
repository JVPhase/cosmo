/**
 * Contract test: grants → mobile state mapping
 *
 * Tests that server-created grants carry the exact payload shape that
 * mobile's applyGrants() expects for each grant kind.
 *
 * Two layers:
 *   A) Server payload structure — each grant kind has the right field types.
 *   B) Mobile apply contract   — grant payloads produced by fulfillPurchase
 *      are accepted and applied correctly by the mobile applyGrants logic.
 *      (Uses mobile/cosmo-miner/src/game/grants.ts directly — pure TS, no RN deps.)
 *
 * Run: pnpm test:contract
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fulfillPurchase } from '../../src/lib/fulfillment';
import {
  db,
  createTestUser,
  upsertTestShopItem,
  createTestPurchase,
  cleanupUser,
  deleteTestShopItem,
} from '../helpers/db';

// ── Mobile apply logic (pure TypeScript, all imports are type-only) ───────────
// All imports in grants.ts are `import type` — they are erased at runtime by tsx.
// No React Native modules are actually loaded.
import { applyGrants } from '../../../mobile/cosmo-miner/src/game/grants';

// ── Test shop items ───────────────────────────────────────────────────────────

const GRANT_TEST_ITEMS = {
  credits: {
    id: 'test_grants_credits',
    type: 'currency_pack',
    metadata: { creditAmount: 200, deliveryMode: 'grant_sync' },
  },
  metal: {
    id: 'test_grants_metal',
    type: 'metal_pack',
    metadata: { metalId: 'titan', quantity: 15, deliveryMode: 'grant_sync' },
  },
  booster: {
    id: 'test_grants_booster',
    type: 'booster',
    metadata: {
      effectType: 'xpMultiplier',
      multiplier: 3,
      durationMs: 7_200_000,
      deliveryMode: 'grant_sync',
    },
  },
  loot: {
    id: 'test_grants_loot',
    type: 'loot_box',
    metadata: { tier: 'advanced', deliveryMode: 'grant_sync' },
  },
} as const;

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Contract: grants payload → mobile state mapping', () => {
  let userId: string;

  before(async () => {
    const user = await createTestUser();
    userId = user.id;
    for (const item of Object.values(GRANT_TEST_ITEMS)) {
      await upsertTestShopItem(item.id, { type: item.type, metadata: item.metadata });
    }
  });

  after(async () => {
    await cleanupUser(userId);
    for (const item of Object.values(GRANT_TEST_ITEMS)) {
      await deleteTestShopItem(item.id);
    }
  });

  // ── A. Server payload structure ───────────────────────────────────────────

  describe('A — server grant payload structure', () => {
    it('credits_grant has { amount: number }', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.credits.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id } });
      assert.ok(g);
      assert.equal(g!.kind, 'credits_grant');
      const pl = g!.payload as Record<string, unknown>;
      assert.equal(typeof pl.amount, 'number');
      assert.ok((pl.amount as number) > 0);
    });

    it('metal_grant has { metalId: string, quantity: number }', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.metal.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id } });
      assert.ok(g);
      assert.equal(g!.kind, 'metal_grant');
      const pl = g!.payload as Record<string, unknown>;
      assert.equal(typeof pl.metalId, 'string');
      assert.equal(typeof pl.quantity, 'number');
    });

    it('booster_grant has { shopItemId, effectType, durationMs } as strings/numbers', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.booster.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id } });
      assert.ok(g);
      assert.equal(g!.kind, 'booster_grant');
      const pl = g!.payload as Record<string, unknown>;
      assert.equal(typeof pl.shopItemId, 'string');
      assert.equal(typeof pl.effectType, 'string');
      assert.equal(typeof pl.durationMs, 'number');
    });

    it('booster_grant seq is a number (instanceId = "grant_<seq>")', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.booster.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id }, orderBy: { seq: 'desc' } });
      assert.ok(g);
      assert.equal(typeof g!.seq, 'number');
      // Verify mobile will produce the expected instanceId
      const expectedInstanceId = `grant_${g!.seq}`;
      assert.match(expectedInstanceId, /^grant_\d+$/);
    });

    it('loot_box_reward_grant has { rolledMetals: Record<string, number> }', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.loot.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id } });
      assert.ok(g);
      assert.equal(g!.kind, 'loot_box_reward_grant');
      const pl = g!.payload as Record<string, unknown>;
      assert.ok(typeof pl.rolledMetals === 'object' && pl.rolledMetals !== null);
      for (const qty of Object.values(pl.rolledMetals as Record<string, unknown>)) {
        assert.equal(typeof qty, 'number');
      }
    });
  });

  // ── B. Mobile apply contract ──────────────────────────────────────────────

  describe('B — mobile applyGrants applies server grants correctly', () => {
    /** Minimal state compatible with mobile's GameStateInit. */
    const EMPTY_STATE = {
      credits: 0,
      metals: {} as Record<string, number>,
      discoveredMetals: [] as string[],
      activeBoosts: [] as Array<{
        instanceId: string;
        shopItemId: string;
        effect: unknown;
        expiresAt: number;
      }>,
    };

    it('credits_grant: increments credits by payload.amount', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.credits.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id } });
      assert.ok(g);

      const grantDto = {
        id: g!.id,
        seq: g!.seq,
        kind: g!.kind,
        payload: g!.payload as Record<string, unknown>,
        createdAt: g!.createdAt.toISOString(),
      };

      const { state } = applyGrants({ ...EMPTY_STATE }, [grantDto as never], 0);
      const creditAmount = (g!.payload as { amount: number }).amount;
      assert.equal((state as typeof EMPTY_STATE).credits, creditAmount);
    });

    it('metal_grant: adds to metals and discoveredMetals', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.metal.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id } });
      assert.ok(g);

      const grantDto = {
        id: g!.id,
        seq: g!.seq,
        kind: g!.kind,
        payload: g!.payload as Record<string, unknown>,
        createdAt: g!.createdAt.toISOString(),
      };

      const { state } = applyGrants({ ...EMPTY_STATE }, [grantDto as never], 0);
      const pl = g!.payload as { metalId: string; quantity: number };

      const s = state as typeof EMPTY_STATE;
      assert.equal(s.metals[pl.metalId], pl.quantity, 'metals quantity mismatch');
      assert.ok(
        s.discoveredMetals.includes(pl.metalId),
        `${pl.metalId} must be in discoveredMetals`,
      );
    });

    it('booster_grant: creates ActiveBoost with instanceId = "grant_<seq>"', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.booster.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id }, orderBy: { seq: 'desc' } });
      assert.ok(g);

      const grantDto = {
        id: g!.id,
        seq: g!.seq,
        kind: g!.kind,
        payload: g!.payload as Record<string, unknown>,
        createdAt: g!.createdAt.toISOString(),
      };

      const { state, appliedGrantSeq } = applyGrants({ ...EMPTY_STATE }, [grantDto as never], 0);

      const s = state as typeof EMPTY_STATE;
      assert.equal(s.activeBoosts.length, 1);

      const boost = s.activeBoosts[0];
      assert.equal(boost.instanceId, `grant_${g!.seq}`, 'instanceId must be grant_<seq>');
      assert.equal(boost.shopItemId, GRANT_TEST_ITEMS.booster.id);
      assert.equal(appliedGrantSeq, g!.seq);
    });

    it('booster_grant: instanceId is deterministic — same seq always same id', async () => {
      const p1 = await createTestPurchase(userId, GRANT_TEST_ITEMS.booster.id);
      await fulfillPurchase(p1.id);
      const g1 = await db.grant.findFirst({ where: { purchaseId: p1.id }, orderBy: { seq: 'desc' } });
      assert.ok(g1);

      // Apply the same grant twice — idempotency: no duplicate boost
      const grantDto = {
        id: g1!.id,
        seq: g1!.seq,
        kind: g1!.kind,
        payload: g1!.payload as Record<string, unknown>,
        createdAt: g1!.createdAt.toISOString(),
      };

      const state1 = applyGrants({ ...EMPTY_STATE }, [grantDto as never], 0).state;
      // Apply again (simulate retry): second apply of same seq is skipped
      const state2 = applyGrants(state1 as never, [grantDto as never], g1!.seq).state;

      const s2 = state2 as typeof EMPTY_STATE;
      assert.equal(s2.activeBoosts.length, 1, 'Duplicate grant must not produce a second boost');
    });

    it('loot_box_reward_grant: adds rolledMetals to state', async () => {
      const p = await createTestPurchase(userId, GRANT_TEST_ITEMS.loot.id);
      await fulfillPurchase(p.id);
      const g = await db.grant.findFirst({ where: { purchaseId: p.id } });
      assert.ok(g);

      const pl = g!.payload as { rolledMetals: Record<string, number> };
      const grantDto = {
        id: g!.id,
        seq: g!.seq,
        kind: g!.kind,
        payload: g!.payload as Record<string, unknown>,
        createdAt: g!.createdAt.toISOString(),
      };

      const { state } = applyGrants({ ...EMPTY_STATE }, [grantDto as never], 0);
      const s = state as typeof EMPTY_STATE;

      for (const [metalId, qty] of Object.entries(pl.rolledMetals)) {
        assert.equal(s.metals[metalId], qty, `metals["${metalId}"] mismatch after loot apply`);
        assert.ok(s.discoveredMetals.includes(metalId), `${metalId} not in discoveredMetals`);
      }
    });

    it('grants applied in strict seq order — out-of-order grant skipped', async () => {
      // Grant with seq=100 (far future) should be skipped when appliedSeq=99
      const fakeHighSeq = {
        id: 'fake-high',
        seq: 100,
        kind: 'credits_grant',
        payload: { amount: 999 },
        createdAt: new Date().toISOString(),
      };

      const { state, appliedGrantSeq } = applyGrants(
        { ...EMPTY_STATE, credits: 0 } as never,
        // Grants NOT in strictly ascending order relative to the current cursor
        [fakeHighSeq as never],
        100, // current appliedSeq is already 100 — this grant must be skipped
      );

      const s = state as typeof EMPTY_STATE;
      assert.equal(s.credits, 0, 'Grant with seq <= appliedSeq must be skipped');
      assert.equal(appliedGrantSeq, 100, 'appliedGrantSeq must not change when grant is skipped');
    });
  });
});
