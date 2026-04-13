/**
 * Canonical save contract — single serializer/deserializer for V2 envelope.
 *
 * All persistence paths (local AsyncStorage, cloud PUT /saves) must go
 * through this module so local and cloud saves are always byte-identical.
 *
 * Format:
 *   { version: 2, savedAt: number, appliedGrantSeq: number, state: GameStateInit }
 */
import type { GameState, GameStateInit, GameplaySaveEnvelopeV2 } from './types';

/**
 * Serializes the full game state into a V2 envelope.
 * appliedGrantSeq defaults to 0 for saves that predate grant sync.
 */
export function serializeGameplaySaveV2(
  state: GameState,
  appliedGrantSeq: number,
): GameplaySaveEnvelopeV2 {
  return {
    version: 2,
    savedAt: Date.now(),
    appliedGrantSeq,
    state: {
      energy: state.energy,
      totalEarned: state.totalEarned,
      clicks: state.clicks,
      upgrades: state.upgrades,
      unlockedPlanetIds: state.unlockedPlanetIds,
      selectedPlanetId: state.selectedPlanetId,
      achievements: state.achievements,
      metals: state.metals,
      discoveredMetals: state.discoveredMetals,
      fleet: state.fleet,
      battle: state.battle,
      playerXP: state.playerXP,
      research: state.research,
      expeditions: state.expeditions,
      tabsUnlocked: state.tabsUnlocked,
      moduleLevels: state.moduleLevels,
      chosenCharacterId: state.chosenCharacterId,
      battlesWon: state.battlesWon,
      battleWinStreak: state.battleWinStreak,
      credits: state.credits,
      activeBoosts: state.activeBoosts,
      characterMessageHistory: state.characterMessageHistory,
      greetingShown: state.greetingShown,
      prestige: state.prestige,
    },
  };
}

export type DeserializeResult =
  | { ok: true; envelope: GameplaySaveEnvelopeV2 }
  | { ok: false; reason: string };

/**
 * Deserializes an opaque raw value from storage or server into a V2 envelope.
 *
 * Handles:
 *   V2: { version: 2, savedAt, appliedGrantSeq, state }
 *   V1: { version: 1, savedAt?, state }  — upgraded to V2 with appliedGrantSeq=0
 *   Raw (no version): rejected — callers should clear storage and start fresh
 */
export function deserializeGameplaySaveEnvelope(raw: unknown): DeserializeResult {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, reason: 'not an object' };
  }
  const d = raw as Record<string, unknown>;

  if (d.version === 2) {
    if (typeof d.savedAt !== 'number') {
      return { ok: false, reason: 'v2: savedAt must be number' };
    }
    if (typeof d.appliedGrantSeq !== 'number') {
      return { ok: false, reason: 'v2: appliedGrantSeq must be number' };
    }
    if (typeof d.state !== 'object' || d.state === null) {
      return { ok: false, reason: 'v2: state must be object' };
    }
    return {
      ok: true,
      envelope: {
        version: 2,
        savedAt: d.savedAt,
        appliedGrantSeq: d.appliedGrantSeq,
        state: d.state as GameStateInit,
      },
    };
  }

  if (d.version === 1) {
    if (typeof d.state !== 'object' || d.state === null) {
      return { ok: false, reason: 'v1: state must be object' };
    }
    // Upgrade v1 → v2 in-memory; next save will persist as v2
    return {
      ok: true,
      envelope: {
        version: 2,
        savedAt: typeof d.savedAt === 'number' ? d.savedAt : 0,
        appliedGrantSeq: 0,
        state: d.state as GameStateInit,
      },
    };
  }

  return { ok: false, reason: `unknown version: ${String(d.version)}` };
}

/**
 * Pick the more recent of two envelopes by savedAt.
 * Returns the envelope itself, not just the timestamp.
 */
export function pickNewerEnvelope(
  a: GameplaySaveEnvelopeV2 | null,
  b: GameplaySaveEnvelopeV2 | null,
): GameplaySaveEnvelopeV2 | null {
  if (!a) return b;
  if (!b) return a;
  return a.savedAt >= b.savedAt ? a : b;
}
