/**
 * Contract test: PUT /saves + GET /saves
 *
 * Verifies:
 *   1. PUT accepts a full GameplaySaveEnvelopeV2 and returns { rev, updatedAt }.
 *   2. GET returns the exact envelope that was PUT (roundtrip integrity).
 *   3. appliedGrantSeq is stored and returned as a number.
 *   4. Invalid / partial envelopes are rejected with 400.
 *   5. Optimistic concurrency: stale rev → 409 Conflict.
 *
 * Run: pnpm test:contract
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../helpers/app';
import { createTestUser, cleanupUser } from '../helpers/db';
import { signToken } from '../helpers/auth';
import {
  MINIMAL_V2_ENVELOPE,
  V2_LEVEL_3,
  INVALID_NO_SEQ,
  INVALID_NO_STATE,
  INVALID_NO_VERSION,
  INVALID_NULL,
  INVALID_ARRAY,
} from '../fixtures/saves';

describe('Contract: PUT/GET /saves', () => {
  let app: FastifyInstance;

  // ── Roundtrip & validation suite (shared user) ────────────────────────────
  let userId: string;
  let token: string;

  // ── Concurrency suite (dedicated user to avoid rev drift from roundtrip tests)
  let concUserId: string;
  let concToken: string;

  before(async () => {
    app = await buildApp();

    const user = await createTestUser();
    userId = user.id;
    token = signToken(app, userId);

    const concUser = await createTestUser();
    concUserId = concUser.id;
    concToken = signToken(app, concUserId);
  });

  after(async () => {
    await app.close();
    await cleanupUser(userId);
    await cleanupUser(concUserId);
  });

  // ── 1. Basic PUT ──────────────────────────────────────────────────────────

  describe('PUT /saves — success path', () => {
    it('returns 200 with numeric rev and ISO updatedAt', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${token}` },
        payload: { data: MINIMAL_V2_ENVELOPE },
      });
      assert.equal(res.statusCode, 200, res.body);
      const body = res.json<{ rev: unknown; updatedAt: unknown }>();
      assert.equal(typeof body.rev, 'number', 'rev must be a number');
      assert.equal(typeof body.updatedAt, 'string', 'updatedAt must be a string');
      assert.ok(
        (body.updatedAt as string).includes('T'),
        'updatedAt must be an ISO-8601 string',
      );
    });

    it('rev increments on each PUT', async () => {
      const r1 = await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${token}` },
        payload: { data: MINIMAL_V2_ENVELOPE },
      });
      const r2 = await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${token}` },
        payload: { data: MINIMAL_V2_ENVELOPE },
      });
      const rev1 = r1.json<{ rev: number }>().rev;
      const rev2 = r2.json<{ rev: number }>().rev;
      assert.ok(rev2 > rev1, `rev should increment: ${rev1} → ${rev2}`);
    });
  });

  // ── 2. GET roundtrip ──────────────────────────────────────────────────────

  describe('GET /saves — roundtrip integrity', () => {
    it('GET after PUT returns the exact envelope (deep equality)', async () => {
      await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${token}` },
        payload: { data: V2_LEVEL_3 },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/saves',
        headers: { authorization: `Bearer ${token}` },
      });
      assert.equal(res.statusCode, 200, res.body);
      const body = res.json<{ save: { data: unknown } }>();
      assert.ok(body.save !== null, 'save must not be null');
      assert.deepEqual(body.save?.data, V2_LEVEL_3);
    });

    it('GET returns { save: null } for a user with no save', async () => {
      // freshUser has never PUT
      const freshUser = await createTestUser();
      const freshToken = signToken(app, freshUser.id);
      try {
        const res = await app.inject({
          method: 'GET',
          url: '/saves',
          headers: { authorization: `Bearer ${freshToken}` },
        });
        assert.equal(res.statusCode, 200, res.body);
        const body = res.json<{ save: null }>();
        assert.equal(body.save, null);
      } finally {
        await cleanupUser(freshUser.id);
      }
    });
  });

  // ── 3. appliedGrantSeq type enforcement ───────────────────────────────────

  describe('appliedGrantSeq contract', () => {
    it('appliedGrantSeq is stored and returned as a number, not a string', async () => {
      const envelope = { ...MINIMAL_V2_ENVELOPE, appliedGrantSeq: 42 };
      await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${token}` },
        payload: { data: envelope },
      });
      const res = await app.inject({
        method: 'GET',
        url: '/saves',
        headers: { authorization: `Bearer ${token}` },
      });
      const body = res.json<{ save: { data: { appliedGrantSeq: unknown } } }>();
      const seq = body.save?.data?.appliedGrantSeq;
      assert.equal(typeof seq, 'number', `appliedGrantSeq must be number, got ${typeof seq}`);
      assert.equal(seq, 42);
    });
  });

  // ── 4. Validation: 400 on invalid envelopes ───────────────────────────────

  describe('PUT /saves — 400 on invalid envelope', () => {
    const cases: Array<{ label: string; data: unknown }> = [
      { label: 'V2 without appliedGrantSeq', data: INVALID_NO_SEQ },
      { label: 'V2 without state', data: INVALID_NO_STATE },
      { label: 'no version field', data: INVALID_NO_VERSION },
      { label: 'null', data: INVALID_NULL },
      { label: 'array instead of object', data: INVALID_ARRAY },
      { label: 'empty object', data: {} },
      {
        label: 'string instead of object',
        data: 'not-an-object',
      },
    ];

    for (const { label, data } of cases) {
      it(`returns 400 for: ${label}`, async () => {
        const res = await app.inject({
          method: 'PUT',
          url: '/saves',
          headers: { authorization: `Bearer ${token}` },
          payload: { data },
        });
        assert.equal(
          res.statusCode,
          400,
          `Expected 400 for "${label}", got ${res.statusCode}: ${res.body}`,
        );
      });
    }
  });

  // ── 5. Optimistic concurrency ─────────────────────────────────────────────

  describe('PUT /saves — optimistic concurrency', () => {
    it('returns 409 when client sends a stale rev', async () => {
      // First PUT — establishes rev=1
      await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${concToken}` },
        payload: { data: MINIMAL_V2_ENVELOPE },
      });

      // Second PUT (no rev) — advances to rev=2
      await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${concToken}` },
        payload: { data: MINIMAL_V2_ENVELOPE },
      });

      // Third PUT with rev=1 (stale) — server is at rev=2 → 409
      const res = await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${concToken}` },
        payload: { data: MINIMAL_V2_ENVELOPE, rev: 1 },
      });
      assert.equal(res.statusCode, 409, `Expected 409, got ${res.statusCode}: ${res.body}`);
      const body = res.json<{ error: string; serverRev: number }>();
      assert.equal(body.error, 'conflict');
      assert.equal(typeof body.serverRev, 'number');
    });

    it('PUT with correct rev succeeds (no stale)', async () => {
      // GET current rev
      const getRes = await app.inject({
        method: 'GET',
        url: '/saves',
        headers: { authorization: `Bearer ${concToken}` },
      });
      const currentRev = getRes.json<{ save: { rev: number } }>().save?.rev ?? 0;

      const res = await app.inject({
        method: 'PUT',
        url: '/saves',
        headers: { authorization: `Bearer ${concToken}` },
        payload: { data: MINIMAL_V2_ENVELOPE, rev: currentRev },
      });
      assert.equal(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${res.body}`);
    });
  });
});
