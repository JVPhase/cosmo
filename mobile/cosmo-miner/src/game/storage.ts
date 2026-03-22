import AsyncStorage from "@react-native-async-storage/async-storage";
import { METALS } from "./METALS";
import { PLANETS } from "./PLANETS";
import { UPGRADES } from "./UPGRADES";
import type { GameState, GameStateInit } from "./types";

const STORAGE_KEY = "cosmo_game_v1";
const INTRO_KEY = "cosmo_intro_seen_v1";

type StoredGameV1 = {
  version: 1;
  state: GameStateInit;
};

function isStoredGameV1(value: unknown): value is StoredGameV1 {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { version?: unknown; state?: unknown };
  return v.version === 1 && typeof v.state === "object" && v.state !== null;
}

function isValidState(s: unknown): s is GameStateInit {
  if (typeof s !== "object" || s === null) return false;
  const state = s as Record<string, unknown>;

  // Top-level primitive fields
  if (typeof state.energy !== "number") return false;
  if (typeof state.totalEarned !== "number") return false;
  if (typeof state.clicks !== "number") return false;
  if (typeof state.selectedPlanetId !== "number") return false;
  if (!Array.isArray(state.unlockedPlanetIds)) return false;

  // achievements
  if (typeof state.achievements !== "object" || state.achievements === null) return false;
  if (!Array.isArray((state.achievements as Record<string, unknown>).unlockedIds)) return false;

  // upgrades — all current upgrade IDs must be present as numbers
  if (typeof state.upgrades !== "object" || state.upgrades === null) return false;
  const upgrades = state.upgrades as Record<string, unknown>;
  for (const upg of UPGRADES) {
    if (typeof upgrades[upg.id] !== "number") return false;
  }

  // metals — all current metal IDs must be present as numbers
  if (typeof state.metals !== "object" || state.metals === null) return false;
  const metals = state.metals as Record<string, unknown>;
  for (const metal of METALS) {
    if (typeof metals[metal.id] !== "number") return false;
  }

  // fleet
  if (typeof state.fleet !== "object" || state.fleet === null) return false;
  const fleet = state.fleet as Record<string, unknown>;
  if (!Array.isArray(fleet.ownedShips)) return false;

  // unlockedPlanetIds — all values must be valid planet IDs
  const validPlanetIds = new Set(PLANETS.map((p) => p.id));
  if (!(state.unlockedPlanetIds as unknown[]).every((id) => validPlanetIds.has(id as number))) return false;

  return true;
}

export async function loadGame(): Promise<GameStateInit | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredGameV1(parsed)) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (!isValidState(parsed.state)) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.state;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return null;
  }
}

export async function saveGame(state: GameState): Promise<void> {
  const payload: StoredGameV1 = {
    version: 1,
    state: {
      energy: state.energy,
      totalEarned: state.totalEarned,
      clicks: state.clicks,
      upgrades: state.upgrades,
      unlockedPlanetIds: state.unlockedPlanetIds,
      selectedPlanetId: state.selectedPlanetId,
      achievements: state.achievements,
      metals: state.metals,
      fleet: state.fleet,
      battle: state.battle,
    },
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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
