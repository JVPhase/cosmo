import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GameState, GameStateInit } from "./types";

const STORAGE_KEY = "cosmo_game_v1";

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
      upgrades: state.upgrades,
      unlockedPlanetIds: state.unlockedPlanetIds,
      achievements: state.achievements,
      settings: state.settings,
    },
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

