import AsyncStorage from "@react-native-async-storage/async-storage";
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

export async function loadGame(): Promise<GameStateInit | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredGameV1(parsed)) return null;
    return parsed.state;
  } catch {
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
  } catch {
    // ignore
  }
}

