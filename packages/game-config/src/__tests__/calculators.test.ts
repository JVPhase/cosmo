/**
 * Contract tests for canonical XP/level calculators.
 * Run with: npx tsx --test src/__tests__/calculators.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computePlayerLevel, xpAtLevelStart, xpForNextLevel, xpProgressFraction } from '../calculators';
import { XP_THRESHOLDS, MAX_LEVEL } from '../player';

describe('computePlayerLevel', () => {
  it('returns level 1 at XP 0', () => {
    assert.equal(computePlayerLevel(0), 1);
  });

  it('returns level 2 at threshold boundary', () => {
    assert.equal(computePlayerLevel(100), 2);
  });

  it('returns level 2 just below level 3 threshold', () => {
    assert.equal(computePlayerLevel(299), 2);
  });

  it('returns level 3 at 300 XP', () => {
    assert.equal(computePlayerLevel(300), 3);
  });

  it('returns MAX_LEVEL at very high XP', () => {
    assert.equal(computePlayerLevel(Number.MAX_SAFE_INTEGER), MAX_LEVEL);
  });

  it('returns MAX_LEVEL at exact last threshold', () => {
    assert.equal(computePlayerLevel(XP_THRESHOLDS[XP_THRESHOLDS.length - 1]), MAX_LEVEL);
  });

  it('accepts custom thresholds and maxLevel (remoteConfig overlay)', () => {
    const custom = [0, 50, 200];
    assert.equal(computePlayerLevel(100, custom, 3), 2);
    assert.equal(computePlayerLevel(200, custom, 3), 3);
  });
});

describe('xpAtLevelStart', () => {
  it('level 1 starts at 0', () => {
    assert.equal(xpAtLevelStart(1), 0);
  });

  it('level 2 starts at 100', () => {
    assert.equal(xpAtLevelStart(2), 100);
  });

  it('level 100 starts at last threshold', () => {
    assert.equal(xpAtLevelStart(100), XP_THRESHOLDS[99]);
  });
});

describe('xpForNextLevel', () => {
  it('next level from 1 is 100', () => {
    assert.equal(xpForNextLevel(1), 100);
  });

  it('returns null at MAX_LEVEL', () => {
    assert.equal(xpForNextLevel(MAX_LEVEL), null);
  });
});

describe('xpProgressFraction', () => {
  it('returns 0 at level start', () => {
    // At XP=0 (level 1 start), progress within level 1 is 0
    assert.equal(xpProgressFraction(0), 0);
  });

  it('returns 0.5 halfway through level 1', () => {
    // Level 1: 0..100, halfway = 50
    assert.equal(xpProgressFraction(50), 0.5);
  });

  it('returns 1 at MAX_LEVEL', () => {
    assert.equal(xpProgressFraction(Number.MAX_SAFE_INTEGER), 1);
  });

  it('is between 0 and 1 for any valid XP', () => {
    for (const xp of [0, 99, 100, 500, 1_000_000, 50_000_000_000_000]) {
      const f = xpProgressFraction(xp);
      assert.ok(f >= 0 && f <= 1, `fraction ${f} out of range for xp ${xp}`);
    }
  });
});
