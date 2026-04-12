import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMetals } from "./METALS";
import { getPlanets, type PlanetId } from "./PLANETS";
import { getUpgrades } from "./UPGRADES";
import { getCachedRemoteConfig } from "./remoteConfig";
import type { GameState, GameStateInit, GameplaySaveEnvelopeV2 } from "./types";
import { serializeGameplaySaveV2, deserializeGameplaySaveEnvelope } from "./saveContract";

const STORAGE_KEY = "cosmo_game_v2";
const INTRO_KEY = "cosmo_intro_seen_v1";

// ── State validator ───────────────────────────────────────────────────────────

function isValidState(s: unknown): s is GameStateInit {
  if (typeof s !== "object" || s === null) return false;
  const state = s as Record<string, unknown>;

  if (typeof state.energy !== "number") return false;
  if (typeof state.totalEarned !== "number") return false;
  if (typeof state.clicks !== "number") return false;
  if (typeof state.selectedPlanetId !== "number") return false;
  if (!Array.isArray(state.unlockedPlanetIds)) return false;

  if (typeof state.achievements !== "object" || state.achievements === null) return false;
  if (!Array.isArray((state.achievements as Record<string, unknown>).unlockedIds)) return false;

  if (typeof state.upgrades !== "object" || state.upgrades === null) return false;
  if (getCachedRemoteConfig()) {
    const upgrades = state.upgrades as Record<string, unknown>;
    for (const upg of getUpgrades()) {
      const v = upgrades[String(upg.id)];
      if (v !== undefined && typeof v !== "number") return false;
    }
  }

  if (typeof state.metals !== "object" || state.metals === null) return false;
  if (getCachedRemoteConfig()) {
    const metals = state.metals as Record<string, unknown>;
    for (const metal of getMetals()) {
      if (metals[metal.id] !== undefined && typeof metals[metal.id] !== "number") return false;
    }
  }

  if (typeof state.fleet !== "object" || state.fleet === null) return false;
  const fleet = state.fleet as Record<string, unknown>;
  if (!Array.isArray(fleet.ownedShips)) return false;

  if (getCachedRemoteConfig()) {
    const validPlanetIds = new Set(getPlanets().map((p) => p.id));
    if (!validPlanetIds.has(state.selectedPlanetId as PlanetId)) return false;
    if (!(state.unlockedPlanetIds as unknown[]).every((id) => validPlanetIds.has(id as PlanetId))) return false;
  }

  const validCharIds = new Set(['lien', 'riva', 'graves', 'alex']);
  if (state.chosenCharacterId !== undefined && state.chosenCharacterId !== null && !validCharIds.has(state.chosenCharacterId as string)) return false;

  return true;
}

// ── Load / Save ───────────────────────────────────────────────────────────────

/**
 * Loads the local save envelope.
 * Returns null if no save exists or the save is corrupt (clears corrupt data).
 */
export async function loadGame(): Promise<{ state: GameStateInit; savedAt: number; appliedGrantSeq: number } | null> {
  try {
    // Try V2 key first
    let raw = await AsyncStorage.getItem(STORAGE_KEY);

    // Fall back to legacy V1 key for migration
    if (!raw) {
      raw = await AsyncStorage.getItem("cosmo_game_v1");
    }

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    const result = deserializeGameplaySaveEnvelope(parsed);

    if (!result.ok) {
      await AsyncStorage.multiRemove([STORAGE_KEY, "cosmo_game_v1"]).catch(() => {});
      return null;
    }

    const { state, savedAt, appliedGrantSeq } = result.envelope;

    if (!isValidState(state)) {
      await AsyncStorage.multiRemove([STORAGE_KEY, "cosmo_game_v1"]).catch(() => {});
      return null;
    }

    // Migrate: craftedModules[] → moduleLevels
    const stateRecord = state as Record<string, unknown>;
    if (Array.isArray(stateRecord.craftedModules) && !stateRecord.moduleLevels) {
      const levels: Record<string, number> = {};
      for (const id of stateRecord.craftedModules as string[]) {
        levels[id] = 1;
      }
      stateRecord.moduleLevels = levels;
      delete stateRecord.craftedModules;
    }

    return { state: stateRecord as GameStateInit, savedAt, appliedGrantSeq };
  } catch {
    await AsyncStorage.multiRemove([STORAGE_KEY, "cosmo_game_v1"]).catch(() => {});
    return null;
  }
}

/**
 * Saves the full game state as a V2 envelope locally.
 * appliedGrantSeq tracks the last Grant seq applied by this client.
 */
export async function saveGame(state: GameState, appliedGrantSeq: number): Promise<void> {
  const envelope: GameplaySaveEnvelopeV2 = serializeGameplaySaveV2(state, appliedGrantSeq);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

/**
 * Saves a pre-built V2 envelope directly (used during bootstrap grant sync
 * where we already have the envelope and don't want to re-serialize).
 */
export async function saveGameEnvelope(envelope: GameplaySaveEnvelopeV2): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export async function clearGame(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEY, "cosmo_game_v1"]).catch(() => {});
}

export async function loadIntroSeen(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(INTRO_KEY);
    return raw === "1";
  } catch {
    return false;
  }
}

export async function saveIntroSeen(seen: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(INTRO_KEY, seen ? "1" : "0");
  } catch {}
}
