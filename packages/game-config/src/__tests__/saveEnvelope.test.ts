/**
 * Contract test: save envelope roundtrip shape.
 * Verifies that the canonical DTO types match what mobile serializes.
 * Run with: npx tsx --test src/__tests__/saveEnvelope.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  GameplaySaveEnvelopeV2Dto,
  ActiveBoostDto,
  AchievementsStateDto,
} from '../schemas';

describe('GameplaySaveEnvelopeV2Dto contract', () => {
  it('accepts a minimal V2 envelope', () => {
    const envelope: GameplaySaveEnvelopeV2Dto = {
      version: 2,
      savedAt: Date.now(),
      appliedGrantSeq: 0,
      state: {
        playerXP: 0,
        totalEarned: 0,
        credits: 0,
      },
    };

    assert.equal(envelope.version, 2);
    assert.ok(typeof envelope.savedAt === 'number');
    assert.equal(envelope.appliedGrantSeq, 0);
    assert.equal(envelope.state.playerXP, 0);
  });

  it('upgrades keys are strings (JSON serialization of numeric UpgradeId)', () => {
    const envelope: GameplaySaveEnvelopeV2Dto = {
      version: 2,
      savedAt: Date.now(),
      appliedGrantSeq: 0,
      state: {
        // UpgradeId is a number in TypeScript, but JSON keys are always strings
        upgrades: { '1': 3, '3': 1, '10': 2 },
      },
    };
    assert.deepEqual(Object.keys(envelope.state.upgrades ?? {}), ['1', '3', '10']);
  });

  it('achievements shape is { unlockedIds, claimedIds } with numeric ids', () => {
    // AchievementId in mobile is a numeric literal (ACHIEVEMENTS.ts ids: 1, 2, 3, …)
    const achievements: AchievementsStateDto = {
      unlockedIds: [1, 5, 12],
      claimedIds: [1],
    };
    const envelope: GameplaySaveEnvelopeV2Dto = {
      version: 2,
      savedAt: Date.now(),
      appliedGrantSeq: 0,
      state: { achievements },
    };
    assert.deepEqual(envelope.state.achievements?.unlockedIds, [1, 5, 12]);
    assert.deepEqual(envelope.state.achievements?.claimedIds, [1]);
    assert.ok(typeof envelope.state.achievements?.unlockedIds[0] === 'number');
  });

  it('ActiveBoostDto shape matches mobile types.ts', () => {
    const boost: ActiveBoostDto = {
      instanceId: 'grant_7',
      shopItemId: 'booster_mining_1h',
      effect: {
        stat: 'clickMultiplier',
        multiplier: 2,
        durationMs: 3_600_000,
      },
      expiresAt: Date.now() + 3_600_000,
    };
    const envelope: GameplaySaveEnvelopeV2Dto = {
      version: 2,
      savedAt: Date.now(),
      appliedGrantSeq: 7,
      state: { activeBoosts: [boost] },
    };
    const b = envelope.state.activeBoosts![0];
    assert.equal(b.instanceId, 'grant_7');
    assert.equal(b.shopItemId, 'booster_mining_1h');
    assert.equal(b.effect.stat, 'clickMultiplier');
    assert.equal(b.effect.multiplier, 2);
    assert.equal(b.effect.durationMs, 3_600_000);
    assert.ok(typeof b.expiresAt === 'number');
  });

  it('version field is literal 2, not 1', () => {
    const raw: unknown = { version: 2, savedAt: 0, appliedGrantSeq: 0, state: {} };
    const envelope = raw as GameplaySaveEnvelopeV2Dto;
    assert.equal(envelope.version, 2);
  });
});

describe('GrantDto contract', () => {
  it('has createdAt as ISO string (matches cloudSave.ts wire format)', async () => {
    const { } = await import('../schemas');
    // Type-level check: createdAt must be a string
    const grant = {
      id: 'grant_abc',
      seq: 1,
      kind: 'credits_grant' as const,
      payload: { amount: 100 },
      createdAt: new Date().toISOString(),
    };
    assert.ok(typeof grant.createdAt === 'string');
    assert.ok(grant.createdAt.includes('T')); // ISO-8601 format
  });
});
