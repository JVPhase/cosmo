import AsyncStorage from '@react-native-async-storage/async-storage';
import { invalidatePlanetsCache } from './PLANETS';
import { invalidateAliensCache } from './ALIENS';

const REMOTE_CONFIG_KEY = 'cosmo_remote_config_v1';

const REMOTE_CONFIG_URL = process.env.EXPO_PUBLIC_CONFIG_URL ?? 'http://localhost:3000/config';

// ── Config types (mirrors DB seed shape) ────────────────────────────────────

export type FormulaConstantsConfig = {
  UPGRADE_COST_EXP: number;
  UPGRADE_POWER_EXP: number;
  CANNON_COST_EXP: number;
  MODULE_COST_BASE: number;
  MODULE_COST_EXP: number;
  ZONE_PLANET_SCALE: number;
  ENERGY_BASE: number;
  ENERGY_STEP: number;
  METAL_CONVERSION_RATE: number;
  CONVERTER_FEE_PER_TIER: number;
};

export type UpgradeConfig = {
  id: number;
  nameKey: string;
  icon: string;
  baseCost: number;
  clickBonus: number;
  passiveBonus: number;
  loreKey: string;
};

export type ShipConfig = {
  id: string;
  nameKey: string;
  icon: string;
  imageKey: string;
  damageMultiplier: number;
  expeditionMultiplier: number;
  unlockLevel: number;
  baseCost: Record<string, number>;
  repairCost: Record<string, number>;
  loreKey: string;
};

export type CannonConfig = {
  id: string;
  nameKey: string;
  icon: string;
  imageKey: string;
  damagePerLevel: number;
  baseCost: Record<string, number>;
  loreKey: string;
};

export type ExpeditionConfig = {
  id: string;
  nameKey: string;
  icon: string;
  durationMs: number;
  metalRewards: Record<string, number>;
  xpReward: number;
  loreKey: string;
};

export type ModuleConfig = {
  id: string;
  nameKey: string;
  icon: string;
  loreKey: string;
  cost: Record<string, number>;
  ultNameKey: string;
  ultDescriptionKey: string;
  ultDurationMs: number;
  hitsToCharge: number;
};

export type ModulesConfig = {
  definitions: ModuleConfig[];
  maxLevel: number;
};

export type ShopItemConfig = {
  id: string;
  name: string;
  icon: string;
  category: string;
  creditCost: number;
  lore: string;
  boostEffect?: { stat: string; multiplier: number; durationMs: number };
  metalReward?: { metalId: string; amount: number }[];
  lootPool?: { metalId: string; min: number; max: number; chance: number }[];
};

export type ShopConfig = {
  items: ShopItemConfig[];
  metalTiers: Record<string, number>;
};

export type ResearchConfig = {
  id: string;
  nameKey: string;
  icon: string;
  branch: string;
  requiredLevel: number;
  energyCost: number;
  requires: string[];
  effect: { type: string; value: number; metalId?: string };
  loreKey: string;
};

export type PlayerConfig = {
  xpThresholds: number[];
  maxLevel: number;
  titles: string[];
};

export type AchievementTargetConfig =
  | { type: string; value: number }
  | { type: 'battleCondition'; conditionKey: string }
  | { type: 'metalAtLeast'; metalId: string; value: number };

export type AchievementConfig = {
  id: number;
  nameKey: string;
  icon: string;
  target: AchievementTargetConfig;
  loreKey: string;
};

export type AchievementsConfig = {
  claimCredits: number;
  data: AchievementConfig[];
};

export type PlanetOverrideConfig = {
  id: number;
  sectorId: number;
  nameKey: string;
  icon: string;
  imageKey: string;
  unlocked: boolean;
  cost: number;
  bonus: number;
  resource: string;
  color: string;
  loreKey: string;
};

export type PlanetZoneThemeConfig = {
  zoneIndex: number;
  namePrefixKey: string;
  iconPool: string[];
  resourcePoolKeys: string[];
  colorPool: string[];
  loreKey: string;
  bonusBase: number;
  bonusSectorScale: number;
};

export type PlanetsConfig = {
  overrides: PlanetOverrideConfig[];
  zoneThemes: PlanetZoneThemeConfig[];
};

export type AlienZoneConfig = {
  baseHP: number;
  baseXP: number;
  zoneStart: number;
  sectorScale: number;
  namePoolKeys: string[];
  iconPool: string[];
  loreKey: string;
};

export type HardcodedAlienConfig = {
  planetId: number;
  nameKey: string;
  icon: string;
  imageKey: string;
  loreKey: string;
  ability?: { type: string; intervalMs: number; durationMs: number };
};

export type AliensConfig = {
  battleDurationMs: number;
  zoneData: AlienZoneConfig[];
  hardcodedAliens: HardcodedAlienConfig[];
};

export type MetalConfig = {
  id: string;
  nameKey: string;
  icon: string;
  imageKey: string;
};

export type MetalDropConfig = { metalId: string; chance: number };

export type MetalsConfig = {
  metals: MetalConfig[];
  planetDropTable: Record<string | number, MetalDropConfig[]>;
};

export type ZoneConfig = {
  index: number;
  nameKey: string;
  icon: string;
  loreKey: string;
  sectorScale: number;
  minLevel: number;
};

export type SectorsConfig = {
  zones: ZoneConfig[];
  planetsPerSector: number;
  sectorsPerZone: number;
  totalSectors: number;
  totalPlanets: number;
};

export type RemoteGameConfig = {
  version: number;
  generatedAt: number;
  monetizationEnabled: boolean;
  formulaConstants: FormulaConstantsConfig;
  upgrades: UpgradeConfig[];
  ships: ShipConfig[];
  cannons: CannonConfig[];
  modules: ModulesConfig;
  expeditions: ExpeditionConfig[];
  shop: ShopConfig;
  research: ResearchConfig[];
  player: PlayerConfig;
  achievements: AchievementsConfig;
  planets: PlanetsConfig;
  aliens: AliensConfig;
  metals: MetalsConfig;
  sectors: SectorsConfig;
};

let _cachedConfig: RemoteGameConfig | null = null;

/** Returns the cached remote config, or null if not yet loaded. */
export function getCachedRemoteConfig(): RemoteGameConfig | null {
  return _cachedConfig;
}

/** Formula constants — throws if config is not loaded. */
export function getFormulaConstants(): FormulaConstantsConfig {
  if (!_cachedConfig) throw new Error('Game config not loaded');
  return _cachedConfig.formulaConstants;
}

/** Load config from AsyncStorage (fast, no network). */
export async function loadRemoteConfigFromCache(): Promise<RemoteGameConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CONFIG_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    _cachedConfig = parsed as RemoteGameConfig;
    invalidatePlanetsCache();
    invalidateAliensCache();
    return _cachedConfig;
  } catch {
    return null;
  }
}

/** Fetch fresh config from server and persist to AsyncStorage. */
export async function fetchAndCacheRemoteConfig(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const res = await fetch(REMOTE_CONFIG_URL, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`);
  const data: unknown = await res.json();
  if (typeof data !== 'object' || data === null) throw new Error('Config response is not an object');
  await AsyncStorage.setItem(REMOTE_CONFIG_KEY, JSON.stringify(data));
  _cachedConfig = data as RemoteGameConfig;
  invalidatePlanetsCache();
  invalidateAliensCache();
}
