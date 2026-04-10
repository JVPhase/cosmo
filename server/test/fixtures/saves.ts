/**
 * Canonical save envelope fixtures for contract tests.
 *
 * - All timestamps use a fixed epoch value so snapshots are deterministic.
 * - playerXP values are chosen to land on exact level boundaries per
 *   XP_THRESHOLDS: level 1 = 0 XP, level 2 = 100 XP, level 3 = 300 XP.
 */
import type { GameplaySaveEnvelopeV2Dto } from '@cosmo/game-config';

/** A minimal but fully valid V2 envelope — all required fields, empty state. */
export const MINIMAL_V2_ENVELOPE: GameplaySaveEnvelopeV2Dto = {
  version: 2,
  savedAt: 1_700_000_000_000,
  appliedGrantSeq: 0,
  state: {},
};

/**
 * V2 envelope with playerXP=0 → level 1.
 * XP_THRESHOLDS[0] = 0.
 */
export const V2_LEVEL_1: GameplaySaveEnvelopeV2Dto = {
  version: 2,
  savedAt: 1_700_000_000_000,
  appliedGrantSeq: 0,
  state: {
    playerXP: 0,
    totalEarned: 0,
    credits: 0,
    unlockedPlanetIds: [],
  },
};

/**
 * V2 envelope with playerXP=100 → level 2.
 * XP_THRESHOLDS[1] = 100.
 */
export const V2_LEVEL_2: GameplaySaveEnvelopeV2Dto = {
  version: 2,
  savedAt: 1_700_000_000_000,
  appliedGrantSeq: 3,
  state: {
    playerXP: 100,
    totalEarned: 1000,
    credits: 50,
    unlockedPlanetIds: ['planet_1'],
  },
};

/**
 * V2 envelope with playerXP=500 → level 3 (XP_THRESHOLDS[2]=300, [3]=700).
 */
export const V2_LEVEL_3: GameplaySaveEnvelopeV2Dto = {
  version: 2,
  savedAt: 1_700_000_000_000,
  appliedGrantSeq: 7,
  state: {
    playerXP: 500,
    totalEarned: 5000,
    credits: 250,
    unlockedPlanetIds: ['planet_1', 'planet_2', 'planet_3'],
  },
};

// ── Invalid envelopes (should produce 400) ────────────────────────────────────

/** V2 but no appliedGrantSeq. */
export const INVALID_NO_SEQ = {
  version: 2,
  savedAt: 1_700_000_000_000,
  state: { playerXP: 0 },
  // appliedGrantSeq intentionally missing
} as const;

/** V2 but state is missing entirely. */
export const INVALID_NO_STATE = {
  version: 2,
  savedAt: 1_700_000_000_000,
  appliedGrantSeq: 0,
  // state intentionally missing
} as const;

/** No version field at all. */
export const INVALID_NO_VERSION = {
  savedAt: 1_700_000_000_000,
  appliedGrantSeq: 0,
  state: { playerXP: 0 },
} as const;

/** null — must be rejected. */
export const INVALID_NULL = null;

/** Array — must be rejected. */
export const INVALID_ARRAY = [{ version: 2 }];
