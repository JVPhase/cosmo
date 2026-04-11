/**
 * Contract test: GET /config
 *
 * Verifies:
 *   1. Response shape matches the canonical domain schema (structural validation).
 *   2. All numeric fields are numbers, not strings.
 *   3. player section matches canonical @cosmo/game-config values (snapshot of keys).
 *   4. All required top-level sections are present and are objects.
 *
 * NOTE: @cosmo/game-config has no Zod validators ("No Zod runtime validators here"
 * — see schemas.ts). Validation is performed via assertion functions below.
 *
 * Run: pnpm test:contract (or: node --env-file=.env.test --test test/contract/config.test.ts)
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../helpers/app';

// ── Structural validator ──────────────────────────────────────────────────────

type ConfigPayload = {
  version: unknown;
  generatedAt: unknown;
  monetizationEnabled: unknown;
  formulaConstants: unknown;
  upgrades: unknown;
  sectors: unknown;
  expeditions: unknown;
  shop: unknown;
  research: unknown;
  player: {
    xpThresholds: unknown;
    maxLevel: unknown;
  };
  modules: unknown;
  cannons: unknown;
  metals: unknown;
  ships: unknown;
  aliens: unknown;
  achievements: unknown;
  planets: unknown;
};

const REQUIRED_SECTIONS = [
  'formulaConstants',
  'upgrades',
  'sectors',
  'expeditions',
  'shop',
  'research',
  'player',
  'modules',
  'cannons',
  'metals',
  'ships',
  'aliens',
  'achievements',
  'planets',
] as const;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Contract: GET /config', () => {
  let app: FastifyInstance;
  let body: ConfigPayload;

  before(async () => {
    app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/config' });
    assert.equal(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${res.body}`);
    body = res.json<ConfigPayload>();
  });

  after(async () => {
    await app.close();
  });

  it('returns HTTP 200 with JSON content-type', async () => {
    const res = await app.inject({ method: 'GET', url: '/config' });
    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('application/json'));
  });

  it('version is the number 1 (not a string)', () => {
    assert.equal(typeof body.version, 'number', 'version must be a number');
    assert.equal(body.version, 1);
  });

  it('generatedAt is a number (Unix ms timestamp)', () => {
    assert.equal(typeof body.generatedAt, 'number', 'generatedAt must be a number');
    assert.ok((body.generatedAt as number) > 0);
  });

  it('monetizationEnabled is a boolean', () => {
    assert.equal(typeof body.monetizationEnabled, 'boolean');
  });

  it('all required top-level sections are non-null objects', () => {
    const raw = body as unknown as Record<string, unknown>;
    for (const section of REQUIRED_SECTIONS) {
      assert.ok(
        raw[section] !== null && typeof raw[section] === 'object',
        `section "${section}" is missing or not an object (got ${typeof raw[section]})`,
      );
    }
  });

  it('player.xpThresholds is an array of numbers', () => {
    const thresholds = body.player?.xpThresholds;
    assert.ok(Array.isArray(thresholds), 'player.xpThresholds must be an array');
    assert.ok((thresholds as unknown[]).length > 0, 'player.xpThresholds must not be empty');
    for (const t of thresholds as unknown[]) {
      assert.equal(typeof t, 'number', `xpThreshold entry ${JSON.stringify(t)} is not a number`);
    }
  });

  it('player.maxLevel is a number', () => {
    assert.equal(typeof body.player?.maxLevel, 'number', 'player.maxLevel must be a number');
  });

  it('player.xpThresholds has 100 entries (one per level)', () => {
    const thresholds = body.player?.xpThresholds as number[];
    assert.equal(
      thresholds.length,
      100,
      `player.xpThresholds should have 100 entries, got ${thresholds.length}`,
    );
  });

  it('player.maxLevel equals 100', () => {
    assert.equal(
      body.player?.maxLevel as number,
      100,
      'player.maxLevel must be 100',
    );
  });
});
