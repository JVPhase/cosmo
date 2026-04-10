/**
 * Contract test: GET /telegram/me
 *
 * Verifies:
 *   1. level is computed using canonical XP_THRESHOLDS (not an approximation).
 *   2. totalEarned and credits are numbers, not strings.
 *   3. xpProgressFraction is in [0, 1].
 *   4. unlockedPlanets is a number.
 *   5. Level at specific XP values matches @cosmo/game-config calculator.
 *
 * Setup: each test creates a fresh user + TelegramUser + UserSave with a known
 * playerXP value, then calls /telegram/me and verifies the summary fields.
 *
 * Run: pnpm test:contract
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../helpers/app';
import { createTestUser, createTestTelegramUser, createTestSave, cleanupUser } from '../helpers/db';
import { signToken } from '../helpers/auth';
import { computePlayerLevel, xpProgressFraction, XP_THRESHOLDS, MAX_LEVEL } from '@cosmo/game-config';

type TelegramMeResponse = {
  telegramId: string;
  firstName: string;
  gameSummary: {
    playerXP: number;
    level: number;
    xpProgressFraction: number;
    totalEarned: number;
    credits: number;
    unlockedPlanets: number;
    saveRev: number;
  };
};

// ── helpers ───────────────────────────────────────────────────────────────────

/** Creates a full user+TelegramUser+Save fixture, returns userId + auth token. */
async function createTgUser(
  app: FastifyInstance,
  playerXP: number,
  extra: { totalEarned?: number; credits?: number; unlockedPlanetIds?: string[] } = {},
): Promise<{ userId: string; token: string }> {
  const user = await createTestUser();
  await createTestTelegramUser(user.id);
  await createTestSave(user.id, {
    version: 2,
    savedAt: 1_700_000_000_000,
    appliedGrantSeq: 0,
    state: {
      playerXP,
      totalEarned: extra.totalEarned ?? 0,
      credits: extra.credits ?? 0,
      unlockedPlanetIds: extra.unlockedPlanetIds ?? [],
    },
  });
  return { userId: user.id, token: signToken(app, user.id) };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Contract: GET /telegram/me', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();
  });

  after(async () => {
    await app.close();
  });

  it('returns 404 for a user without a TelegramUser record', async () => {
    const user = await createTestUser();
    const token = signToken(app, user.id);
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/telegram/me',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.statusCode, 404);
    } finally {
      await cleanupUser(user.id);
    }
  });

  // ── Level calculation: canonical XP_THRESHOLDS ────────────────────────────

  const LEVEL_CASES: Array<{ label: string; playerXP: number; expectedLevel: number }> = [
    { label: 'XP=0 → level 1', playerXP: 0, expectedLevel: 1 },
    { label: 'XP=99 → level 1 (just below level 2 threshold)', playerXP: 99, expectedLevel: 1 },
    { label: 'XP=100 → level 2 (exact threshold)', playerXP: 100, expectedLevel: 2 },
    { label: 'XP=299 → level 2', playerXP: 299, expectedLevel: 2 },
    { label: 'XP=300 → level 3 (exact threshold)', playerXP: 300, expectedLevel: 3 },
    { label: 'XP=500 → level 3', playerXP: 500, expectedLevel: 3 },
    { label: 'XP=700 → level 4 (exact threshold)', playerXP: 700, expectedLevel: 4 },
  ];

  for (const { label, playerXP, expectedLevel } of LEVEL_CASES) {
    it(`level is computed by canonical calculator: ${label}`, async () => {
      // Sanity-check: canonical calculator agrees with our expectation
      assert.equal(
        computePlayerLevel(playerXP),
        expectedLevel,
        `Fixture mistake: canonical calculator disagrees for XP=${playerXP}`,
      );

      const { userId, token } = await createTgUser(app, playerXP);
      try {
        const res = await app.inject({
          method: 'GET',
          url: '/telegram/me',
          headers: { authorization: `Bearer ${token}` },
        });
        assert.equal(res.statusCode, 200, res.body);
        const body = res.json<TelegramMeResponse>();

        // Primary contract assertion: level matches canonical calculator
        assert.equal(
          body.gameSummary.level,
          expectedLevel,
          `Server level ${body.gameSummary.level} ≠ canonical ${expectedLevel} for XP=${playerXP}`,
        );
        // Also cross-check against the domain package directly
        assert.equal(
          body.gameSummary.level,
          computePlayerLevel(playerXP, XP_THRESHOLDS, MAX_LEVEL),
        );
      } finally {
        await cleanupUser(userId);
      }
    });
  }

  // ── Numeric type enforcement ──────────────────────────────────────────────

  it('totalEarned is a number (not string)', async () => {
    const { userId, token } = await createTgUser(app, 0, { totalEarned: 9876 });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/telegram/me',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = res.json<TelegramMeResponse>();
      assert.equal(typeof body.gameSummary.totalEarned, 'number');
      assert.equal(body.gameSummary.totalEarned, 9876);
    } finally {
      await cleanupUser(userId);
    }
  });

  it('credits is a number (not string)', async () => {
    const { userId, token } = await createTgUser(app, 0, { credits: 512 });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/telegram/me',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = res.json<TelegramMeResponse>();
      assert.equal(typeof body.gameSummary.credits, 'number');
      assert.equal(body.gameSummary.credits, 512);
    } finally {
      await cleanupUser(userId);
    }
  });

  it('unlockedPlanets is a number matching unlockedPlanetIds.length', async () => {
    const { userId, token } = await createTgUser(app, 0, {
      unlockedPlanetIds: ['p1', 'p2', 'p3'],
    });
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/telegram/me',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = res.json<TelegramMeResponse>();
      assert.equal(typeof body.gameSummary.unlockedPlanets, 'number');
      assert.equal(body.gameSummary.unlockedPlanets, 3);
    } finally {
      await cleanupUser(userId);
    }
  });

  // ── xpProgressFraction ────────────────────────────────────────────────────

  it('xpProgressFraction is in [0, 1]', async () => {
    const { userId, token } = await createTgUser(app, 150); // mid-level 2
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/telegram/me',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = res.json<TelegramMeResponse>();
      const frac = body.gameSummary.xpProgressFraction;
      assert.equal(typeof frac, 'number');
      assert.ok(frac >= 0 && frac <= 1, `xpProgressFraction ${frac} out of [0,1]`);
    } finally {
      await cleanupUser(userId);
    }
  });

  it('xpProgressFraction matches canonical domain calculator', async () => {
    const XP = 150; // XP_THRESHOLDS level 2: start=100, next=300 → fraction=(150-100)/(300-100)=0.25
    const { userId, token } = await createTgUser(app, XP);
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/telegram/me',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = res.json<TelegramMeResponse>();
      const expected = xpProgressFraction(XP, XP_THRESHOLDS, MAX_LEVEL);
      assert.equal(body.gameSummary.xpProgressFraction, expected);
    } finally {
      await cleanupUser(userId);
    }
  });

  // ── User with no save ─────────────────────────────────────────────────────

  it('returns zero defaults when user has no save', async () => {
    const user = await createTestUser();
    await createTestTelegramUser(user.id);
    const token = signToken(app, user.id);
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/telegram/me',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.statusCode, 200, res.body);
      const body = res.json<TelegramMeResponse>();
      assert.equal(body.gameSummary.playerXP, 0);
      assert.equal(body.gameSummary.level, 1);
      assert.equal(body.gameSummary.totalEarned, 0);
      assert.equal(body.gameSummary.credits, 0);
    } finally {
      await cleanupUser(user.id);
    }
  });
});
