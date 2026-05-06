/**
 * Contract test: mobile applyGrants — pure function behaviour.
 *
 * This file imports grants.ts directly. All imports in grants.ts are
 * `import type` and are erased at runtime by tsx — no React Native
 * modules are loaded.
 *
 * Run standalone:
 *   cd mobile/cosmo-miner
 *   npx tsx --test src/game/__tests__/grants.apply.test.ts
 *
 * Or via server test:contract suite (grants.mapping.test.ts also covers these
 * behaviours end-to-end using real DB grants).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyGrants } from '../grants';

// Minimal state compatible with GameStateInit (all optional fields)
type TestState = {
  credits?: number;
  metals?: Record<string, number>;
  discoveredMetals?: string[];
  activeBoosts?: Array<{
    instanceId: string;
    shopItemId: string;
    effect: unknown;
    expiresAt: number;
  }>;
};

const BASE_STATE: TestState = {
  credits: 0,
  metals: {},
  discoveredMetals: [],
  activeBoosts: [],
};

// Minimal GrantDto shape (mirrors cloudSave.ts GrantDto)
function makeGrant(
  seq: number,
  kind: string,
  payload: Record<string, unknown>,
): {
  id: string;
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
} {
  return {
    id: `test_grant_${seq}`,
    seq,
    kind,
    payload,
    createdAt: new Date().toISOString(),
  };
}

// ── credits_grant ─────────────────────────────────────────────────────────────

describe('applyGrants: credits_grant', () => {
  it('increments credits by amount', () => {
    const { state } = applyGrants(
      { ...BASE_STATE } as never,
      [makeGrant(1, 'credits_grant', { amount: 100 }) as never],
      0,
    );
    assert.equal((state as TestState).credits, 100);
  });

  it('adds to existing credits', () => {
    const { state } = applyGrants(
      { ...BASE_STATE, credits: 50 } as never,
      [makeGrant(1, 'credits_grant', { amount: 75 }) as never],
      0,
    );
    assert.equal((state as TestState).credits, 125);
  });

  it('ignores grant with amount <= 0', () => {
    const { state } = applyGrants(
      { ...BASE_STATE, credits: 10 } as never,
      [makeGrant(1, 'credits_grant', { amount: 0 }) as never],
      0,
    );
    assert.equal((state as TestState).credits, 10);
  });

  it('updates appliedGrantSeq', () => {
    const { appliedGrantSeq } = applyGrants(
      { ...BASE_STATE } as never,
      [makeGrant(5, 'credits_grant', { amount: 1 }) as never],
      0,
    );
    assert.equal(appliedGrantSeq, 5);
  });
});

// ── metal_grant ───────────────────────────────────────────────────────────────

describe('applyGrants: metal_grant', () => {
  it('adds quantity to metals and adds metalId to discoveredMetals', () => {
    const { state } = applyGrants(
      { ...BASE_STATE } as never,
      [makeGrant(1, 'metal_grant', { metalId: 'iron', quantity: 50 }) as never],
      0,
    );
    const s = state as TestState;
    assert.equal(s.metals!['iron'], 50);
    assert.ok(s.discoveredMetals!.includes('iron'));
  });

  it('stacks with existing metals', () => {
    const { state } = applyGrants(
      { ...BASE_STATE, metals: { iron: 20 } } as never,
      [makeGrant(1, 'metal_grant', { metalId: 'iron', quantity: 30 }) as never],
      0,
    );
    assert.equal((state as TestState).metals!['iron'], 50);
  });

  it('does not re-add to discoveredMetals if already present', () => {
    const { state } = applyGrants(
      {
        ...BASE_STATE,
        metals: { titan: 5 },
        discoveredMetals: ['titan'],
      } as never,
      [makeGrant(1, 'metal_grant', { metalId: 'titan', quantity: 5 }) as never],
      0,
    );
    const s = state as TestState;
    const titanCount = s.discoveredMetals!.filter((m) => m === 'titan').length;
    assert.equal(
      titanCount,
      1,
      'titan must appear exactly once in discoveredMetals',
    );
  });
});

// ── booster_grant ─────────────────────────────────────────────────────────────

describe('applyGrants: booster_grant', () => {
  it('creates ActiveBoost with instanceId = "grant_<seq>"', () => {
    const { state } = applyGrants(
      { ...BASE_STATE } as never,
      [
        makeGrant(7, 'booster_grant', {
          shopItemId: 'booster_mining_1h',
          effectType: 'clickMultiplier',
          multiplier: 2,
          durationMs: 3_600_000,
        }) as never,
      ],
      0,
    );
    const s = state as TestState;
    assert.equal(s.activeBoosts!.length, 1);
    const boost = s.activeBoosts![0];
    assert.equal(boost.instanceId, 'grant_7');
    assert.equal(boost.shopItemId, 'booster_mining_1h');
    assert.equal(typeof boost.expiresAt, 'number');
    assert.ok(boost.expiresAt > Date.now() - 1_000); // sanity: expiresAt is in the future
  });

  it('does not add duplicate boost on retry (same seq)', () => {
    const grant = makeGrant(3, 'booster_grant', {
      shopItemId: 'booster_xp_1h',
      effectType: 'xpMultiplier',
      multiplier: 2,
      durationMs: 3_600_000,
    });

    const after1 = applyGrants(
      { ...BASE_STATE } as never,
      [grant as never],
      0,
    ).state;
    // Replay the same grant — must be idempotent
    const after2 = applyGrants(after1 as never, [grant as never], 3).state;
    assert.equal(
      (after2 as TestState).activeBoosts!.length,
      1,
      'Duplicate boost must be deduplicated',
    );
  });
});

// ── Seq ordering ──────────────────────────────────────────────────────────────

describe('applyGrants: seq ordering', () => {
  it('skips grants with seq <= currentAppliedSeq', () => {
    const { state, appliedGrantSeq } = applyGrants(
      { ...BASE_STATE, credits: 0 } as never,
      [makeGrant(5, 'credits_grant', { amount: 100 }) as never],
      5, // already applied up to seq 5 → this grant must be skipped
    );
    assert.equal(
      (state as TestState).credits,
      0,
      'Grant with seq <= appliedSeq must be skipped',
    );
    assert.equal(appliedGrantSeq, 5);
  });

  it('returns unchanged state when grants list is empty', () => {
    const initial = { ...BASE_STATE, credits: 42 };
    const { state, appliedGrantSeq } = applyGrants(initial as never, [], 7);
    assert.equal((state as TestState).credits, 42);
    assert.equal(appliedGrantSeq, 7);
  });

  it('unknown grant kind is skipped without error', () => {
    const { state } = applyGrants(
      { ...BASE_STATE, credits: 10 } as never,
      [makeGrant(1, 'unknown_future_grant_kind', { foo: 'bar' }) as never],
      0,
    );
    assert.equal(
      (state as TestState).credits,
      10,
      'Unknown grant kind must leave state unchanged',
    );
  });
});
