import AsyncStorage from '@react-native-async-storage/async-storage';
import { FORMULA_CONSTANTS } from '@cosmo/game-config';
import { invalidatePlanetsCache } from './PLANETS';

const REMOTE_CONFIG_KEY = 'cosmo_remote_config_v1';

// URL сервера — задайте через переменную окружения или замените напрямую
const REMOTE_CONFIG_URL = process.env.EXPO_PUBLIC_CONFIG_URL ?? 'http://localhost:3000/config';

// ── Типы для числовых данных сущностей (только числовые поля) ───────────────
export type RemoteUpgrade = { id: number; baseCost: number; clickBonus: number; passiveBonus: number };
export type RemoteShip = { id: string; damageMultiplier: number; expeditionMultiplier: number; unlockLevel: number; baseCost: Record<string, number>; repairCost: Record<string, number> };
export type RemoteExpedition = { id: string; durationMs: number; metalRewards: Record<string, number>; xpReward: number };
export type RemoteCannon = { id: string; damagePerLevel: number; baseCost: Record<string, number> };
export type RemoteModuleDef = { id: string; cost: Record<string, number>; ultDurationMs: number; hitsToCharge: number };
export type RemoteAlienZone = { baseHP: number; baseXP: number; zoneStart: number; sectorScale: number };
export type RemoteResearchNode = { id: string; requiredLevel: number; energyCost: number; effect: { type: string; value: number; metalId?: string } };

export type RemoteAchievementTarget =
  | { type: string; value: number }
  | { type: 'battleCondition'; conditionKey: string }
  | { type: 'metalAtLeast'; metalId: string; value: number };
export type RemoteAchievement = { id: number; target: RemoteAchievementTarget };

export type RemotePlanetOverride = { id: number; cost: number; bonus: number };
export type RemotePlanetZoneTheme = { zoneIndex: number; bonusBase: number; bonusSectorScale: number };

export type RemoteMetalDrop = { metalId: string; chance: number };
export type RemoteShopItem = { id: string; creditCost: number };

export type RemoteGameConfig = {
  version: number;
  generatedAt: number;
  monetizationEnabled?: boolean;
  formulaConstants?: Partial<typeof FORMULA_CONSTANTS>;
  upgrades?: RemoteUpgrade[];
  ships?: RemoteShip[];
  expeditions?: RemoteExpedition[];
  cannons?: RemoteCannon[];
  modules?: { definitions: RemoteModuleDef[]; maxLevel: number };
  aliens?: { zoneData: RemoteAlienZone[]; battleDurationMs: number };
  research?: RemoteResearchNode[];
  player?: { xpThresholds: number[]; maxLevel: number };
  achievements?: { claimCredits: number; data: RemoteAchievement[] };
  planets?: { overrides: RemotePlanetOverride[]; zoneThemes: RemotePlanetZoneTheme[] };
  metals?: { planetDropTable: Record<number, RemoteMetalDrop[]> };
  shop?: { items: RemoteShopItem[] };
};

let _cachedConfig: RemoteGameConfig | null = null;

/** Возвращает закэшированный remote-конфиг, или null если не загружен */
export function getCachedRemoteConfig(): RemoteGameConfig | null {
  return _cachedConfig;
}

/** Формульные константы: remote-значения поверх локальных констант */
export function getFormulaConstants(): typeof FORMULA_CONSTANTS {
  const remote = getCachedRemoteConfig()?.formulaConstants;
  if (!remote) return FORMULA_CONSTANTS;
  return { ...FORMULA_CONSTANTS, ...remote };
}

/** Загружает конфиг из AsyncStorage (быстро, без сети) */
export async function loadRemoteConfigFromCache(): Promise<RemoteGameConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CONFIG_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    _cachedConfig = parsed as RemoteGameConfig;
    invalidatePlanetsCache();
    return _cachedConfig;
  } catch {
    return null;
  }
}

/** Загружает свежий конфиг с сервера и сохраняет в AsyncStorage для следующего запуска */
export async function fetchAndCacheRemoteConfig(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(REMOTE_CONFIG_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null) return;
    await AsyncStorage.setItem(REMOTE_CONFIG_KEY, JSON.stringify(data));
    _cachedConfig = data as RemoteGameConfig;
    invalidatePlanetsCache();
  } catch {
    // Сеть недоступна — тихо используем локальные константы
  }
}
