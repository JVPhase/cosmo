/**
 * Prestige mechanics unit tests.
 *
 * Covers pure-function behaviour — no React hooks required.
 *
 * Run standalone:
 *   cd mobile/cosmo-miner
 *   npx tsx --test src/game/__tests__/prestige.test.ts
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_PRESTIGE_STATE,
  PRESTIGE_ENERGY_BONUS_PER,
  PRESTIGE_METAL_BONUS_PER,
  PRESTIGE_ATTACK_BONUS_PER,
  PRESTIGE_LEVEL_THRESHOLD,
  computePrestigeState,
  applyPrestigeReset,
  getPrestigeBlockedReason,
} from '../prestige';

import {
  serializeGameplaySaveV2,
  deserializeGameplaySaveEnvelope,
} from '../saveContract';

import type { GameState, PrestigeState } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal GameState satisfying the type (all fields present). */
function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    energy: 0,
    totalEarned: 0,
    clicks: 0,
    upgrades: {} as GameState['upgrades'],
    unlockedPlanetIds: [1 as any],
    selectedPlanetId: 1 as any,
    achievements: { unlockedIds: [], claimedIds: [] },
    metals: { iron: 0, titan: 0, iridium: 0, voidCrystal: 0, echoShard: 0 },
    discoveredMetals: [],
    fleet: { ownedShips: [], selectedShipId: null },
    battle: null,
    playerXP: 0,
    research: {},
    expeditions: [],
    tabsUnlocked: { shipyard: false, upgrades: false, planets: false },
    moduleLevels: {},
    chosenCharacterId: null,
    battlesWon: 0,
    battleWinStreak: 0,
    credits: 0,
    activeBoosts: [],
    characterMessageHistory: [],
    greetingShown: false,
    prestige: DEFAULT_PRESTIGE_STATE,
    ...overrides,
  };
}

// ── computePrestigeState ─────────────────────────────────────────────────────

describe('computePrestigeState', () => {
  it('returns zeroed state for count=0', () => {
    const p = computePrestigeState(0);
    assert.equal(p.count, 0);
    assert.equal(p.energyBonus, 0);
    assert.equal(p.metalDropBonus, 0);
    assert.equal(p.attackBonus, 0);
  });

  it('scales linearly with prestige count', () => {
    const p1 = computePrestigeState(1);
    assert.ok(Math.abs(p1.energyBonus    - PRESTIGE_ENERGY_BONUS_PER) < 1e-9);
    assert.ok(Math.abs(p1.metalDropBonus - PRESTIGE_METAL_BONUS_PER)  < 1e-9);
    assert.ok(Math.abs(p1.attackBonus    - PRESTIGE_ATTACK_BONUS_PER) < 1e-9);

    const p3 = computePrestigeState(3);
    assert.ok(Math.abs(p3.energyBonus    - 3 * PRESTIGE_ENERGY_BONUS_PER) < 1e-9);
    assert.ok(Math.abs(p3.metalDropBonus - 3 * PRESTIGE_METAL_BONUS_PER)  < 1e-9);
    assert.ok(Math.abs(p3.attackBonus    - 3 * PRESTIGE_ATTACK_BONUS_PER) < 1e-9);
  });

  it('has +10% energy, +2pp metal, +8% attack per prestige (spec values)', () => {
    const p = computePrestigeState(1);
    assert.ok(Math.abs(p.energyBonus    - 0.10) < 1e-9, 'energyBonus must be 0.10');
    assert.ok(Math.abs(p.metalDropBonus - 0.02) < 1e-9, 'metalDropBonus must be 0.02');
    assert.ok(Math.abs(p.attackBonus    - 0.08) < 1e-9, 'attackBonus must be 0.08');
  });
});

// ── getPrestigeBlockedReason ─────────────────────────────────────────────────

describe('getPrestigeBlockedReason', () => {
  it('returns null when all conditions are met (level >= 30, no battle, no expeditions)', () => {
    assert.equal(
      getPrestigeBlockedReason(PRESTIGE_LEVEL_THRESHOLD, false, false),
      null,
    );
  });

  it('returns level_too_low when level < 30', () => {
    assert.equal(getPrestigeBlockedReason(29, false, false), 'level_too_low');
    assert.equal(getPrestigeBlockedReason(1,  false, false), 'level_too_low');
  });

  it('returns level_too_low even if battle/expeditions are also present (level check first)', () => {
    assert.equal(getPrestigeBlockedReason(15, true, true), 'level_too_low');
  });

  it('returns active_battle when level ok but battle is active', () => {
    assert.equal(getPrestigeBlockedReason(30, true, false), 'active_battle');
  });

  it('returns active_expeditions when level ok and no battle but expeditions active', () => {
    assert.equal(getPrestigeBlockedReason(30, false, true), 'active_expeditions');
  });

  it('prioritises active_battle over active_expeditions', () => {
    assert.equal(getPrestigeBlockedReason(30, true, true), 'active_battle');
  });
});

// ── applyPrestigeReset ───────────────────────────────────────────────────────

describe('applyPrestigeReset', () => {
  const defaultState = makeState();

  it('increments prestige count', () => {
    const prev = makeState({ prestige: computePrestigeState(2) });
    const next = applyPrestigeReset(prev, defaultState);
    assert.equal(next.prestige.count, 3);
  });

  it('recalculates prestige bonuses correctly after reset', () => {
    const prev = makeState({ prestige: computePrestigeState(0) });
    const next = applyPrestigeReset(prev, defaultState);
    const expected = computePrestigeState(1);
    assert.ok(Math.abs(next.prestige.energyBonus    - expected.energyBonus)    < 1e-9);
    assert.ok(Math.abs(next.prestige.metalDropBonus - expected.metalDropBonus) < 1e-9);
    assert.ok(Math.abs(next.prestige.attackBonus    - expected.attackBonus)    < 1e-9);
  });

  // ── Meta-progress that must be preserved ──────────────────────────────────

  it('preserves achievements', () => {
    const prev = makeState({
      achievements: { unlockedIds: [1 as any, 2 as any], claimedIds: [1 as any] },
    });
    const next = applyPrestigeReset(prev, defaultState);
    assert.deepEqual(next.achievements.unlockedIds, [1, 2]);
    assert.deepEqual(next.achievements.claimedIds,  [1]);
  });

  it('preserves credits', () => {
    const prev = makeState({ credits: 999 });
    const next = applyPrestigeReset(prev, defaultState);
    assert.equal(next.credits, 999);
  });

  it('preserves activeBoosts', () => {
    const boost: GameState['activeBoosts'][number] = {
      instanceId: 'test_boost',
      shopItemId: 'booster_mining_1h' as any,
      effect: { stat: 'clickMultiplier', multiplier: 2, durationMs: 3_600_000 },
      expiresAt: Date.now() + 3_600_000,
    };
    const prev = makeState({ activeBoosts: [boost] });
    const next = applyPrestigeReset(prev, defaultState);
    assert.equal(next.activeBoosts.length, 1);
    assert.equal(next.activeBoosts[0]!.instanceId, 'test_boost');
  });

  // ── Run-progress that must be reset ───────────────────────────────────────

  it('resets energy to 0', () => {
    const prev = makeState({ energy: 50000, totalEarned: 100000 });
    const next = applyPrestigeReset(prev, defaultState);
    assert.equal(next.energy, 0);
    assert.equal(next.totalEarned, 0);
  });

  it('resets playerXP to 0', () => {
    const prev = makeState({ playerXP: 99999 });
    const next = applyPrestigeReset(prev, defaultState);
    assert.equal(next.playerXP, 0);
  });

  it('resets upgrades to defaults', () => {
    const prev = makeState({ upgrades: { 'laser_1': 5 } as any });
    const next = applyPrestigeReset(prev, defaultState);
    assert.deepEqual(next.upgrades, defaultState.upgrades);
  });

  it('resets fleet to empty', () => {
    const prev = makeState({
      fleet: {
        ownedShips: [{ shipId: 'scout' as any, broken: false, cannons: {} as any, equippedModuleId: null }],
        selectedShipId: 'scout' as any,
      },
    });
    const next = applyPrestigeReset(prev, defaultState);
    assert.equal(next.fleet.ownedShips.length, 0);
    assert.equal(next.fleet.selectedShipId, null);
  });

  it('resets battlesWon and battleWinStreak', () => {
    const prev = makeState({ battlesWon: 42, battleWinStreak: 10 });
    const next = applyPrestigeReset(prev, defaultState);
    assert.equal(next.battlesWon, 0);
    assert.equal(next.battleWinStreak, 0);
  });

  it('resets characterMessageHistory and greetingShown', () => {
    const prev = makeState({
      characterMessageHistory: ['msg1', 'msg2'],
      greetingShown: true,
    });
    const next = applyPrestigeReset(prev, defaultState);
    assert.deepEqual(next.characterMessageHistory, []);
    assert.equal(next.greetingShown, false);
  });
});

// ── Save contract: serialization / migration ─────────────────────────────────

describe('saveContract: prestige serialization round-trip', () => {
  it('preserves prestige state through serialize → deserialize', () => {
    const state = makeState({ prestige: computePrestigeState(3) });
    const envelope = serializeGameplaySaveV2(state, 0);
    const result = deserializeGameplaySaveEnvelope(envelope);

    assert.ok(result.ok, 'envelope must deserialize ok');
    if (!result.ok) return; // narrow type

    const restored = result.envelope.state.prestige as PrestigeState | undefined;
    assert.ok(restored, 'prestige must be present in deserialized state');
    assert.equal(restored!.count, 3);
    assert.ok(Math.abs(restored!.energyBonus    - 3 * PRESTIGE_ENERGY_BONUS_PER) < 1e-9);
    assert.ok(Math.abs(restored!.metalDropBonus - 3 * PRESTIGE_METAL_BONUS_PER)  < 1e-9);
    assert.ok(Math.abs(restored!.attackBonus    - 3 * PRESTIGE_ATTACK_BONUS_PER) < 1e-9);
  });
});

describe('saveContract: migration — old save without prestige field', () => {
  it('deserializes a v2 save that has no prestige field without error', () => {
    // Simulate an old save blob that predates prestige
    const oldEnvelope = {
      version: 2,
      savedAt: Date.now(),
      appliedGrantSeq: 0,
      state: {
        energy: 100,
        totalEarned: 200,
        clicks: 50,
        selectedPlanetId: 1,
        unlockedPlanetIds: [1],
        achievements: { unlockedIds: [], claimedIds: [] },
        upgrades: {},
        metals: {},
        fleet: { ownedShips: [] },
        // prestige field intentionally absent
      },
    };

    const result = deserializeGameplaySaveEnvelope(oldEnvelope);
    assert.ok(result.ok, 'old save without prestige must still deserialize ok');
    if (!result.ok) return;

    // The state comes back with prestige === undefined (optional field)
    // and useGame will apply DEFAULT_PRESTIGE_STATE via:  initial?.prestige ?? DEFAULT_PRESTIGE_STATE
    const prestige = result.envelope.state.prestige;
    assert.ok(
      prestige === undefined || prestige === null,
      'old save must not have a spurious prestige field',
    );

    // Simulate what useGame does on load
    const effective: PrestigeState = prestige ?? DEFAULT_PRESTIGE_STATE;
    assert.equal(effective.count, 0, 'migrated prestige count must be 0');
    assert.equal(effective.energyBonus, 0);
    assert.equal(effective.metalDropBonus, 0);
    assert.equal(effective.attackBonus, 0);
  });

  it('deserializes a v1 save (upgraded to v2) without prestige without error', () => {
    const v1Envelope = {
      version: 1,
      savedAt: Date.now(),
      state: {
        energy: 10,
        totalEarned: 20,
        clicks: 5,
        selectedPlanetId: 1,
        unlockedPlanetIds: [1],
        achievements: { unlockedIds: [], claimedIds: [] },
        upgrades: {},
        metals: {},
        fleet: { ownedShips: [] },
      },
    };

    const result = deserializeGameplaySaveEnvelope(v1Envelope);
    assert.ok(result.ok, 'v1 save must upgrade to v2 ok');
    if (!result.ok) return;

    assert.equal(result.envelope.version, 2);
    assert.equal(result.envelope.appliedGrantSeq, 0);
    // prestige absent → useGame defaults to 0
    const effective: PrestigeState = result.envelope.state.prestige ?? DEFAULT_PRESTIGE_STATE;
    assert.equal(effective.count, 0);
  });
});
