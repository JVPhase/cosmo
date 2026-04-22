import type { MetalId } from './METALS';
import { getCachedRemoteConfig, getFormulaConstants } from './remoteConfig';

export type BoostStat =
  | 'clickMultiplier'
  | 'passiveMultiplier'
  | 'metalDropBonus'
  | 'xpMultiplier'
  | 'damageMultiplier';

export type BoostEffect = {
  stat: BoostStat;
  multiplier: number;
  durationMs: number;
};

export type ShopCategory = 'boosters' | 'metals' | 'lootboxes' | 'converter';

export type LootEntry = {
  metalId: MetalId;
  min: number;
  max: number;
  chance: number;
};

export type ShopItem = {
  id: ShopItemId;
  nameKey: string;
  icon: string;
  category: ShopCategory;
  creditCost: number;
  loreKey: string;
  boostEffect?: BoostEffect;
  metalReward?: { metalId: MetalId; amount: number }[];
  lootPool?: LootEntry[];
};

export type ShopItemId =
  | 'booster_mining_1h'
  | 'booster_xp_1h'
  | 'booster_metal_1h'
  | 'booster_battle_30m'
  | 'loot_box_basic'
  | 'loot_box_advanced'
  | 'loot_box_premium'
  | 'metal_iron'
  | 'metal_titan'
  | 'metal_iridium'
  | 'metal_void'
  | 'metal_echo'
  | 'converter';

export function getShopItems(): ShopItem[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.shop.items as unknown as ShopItem[];
}

export function getShopItemById(id: ShopItemId): ShopItem {
  const item = getShopItems().find((x) => x.id === id);
  if (!item) throw new Error(`Unknown shop item id: ${id}`);
  return item;
}

export function getMetalTier(metalId: MetalId): number {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return (config.shop.metalTiers as Record<string, number>)[metalId] ?? 0;
}

export function getConversionRate(from: MetalId, to: MetalId): number {
  const diff = getMetalTier(to) - getMetalTier(from);
  if (diff <= 0) return 0;
  return Math.pow(getFormulaConstants().METAL_CONVERSION_RATE, diff);
}

export function getConverterCreditCost(from: MetalId, to: MetalId): number {
  const diff = getMetalTier(to) - getMetalTier(from);
  if (diff <= 0) return 0;
  return getFormulaConstants().CONVERTER_FEE_PER_TIER * diff;
}

export function rollLootBox(pool: LootEntry[]): Partial<Record<MetalId, number>> {
  const result: Partial<Record<MetalId, number>> = {};
  for (const entry of pool) {
    if (Math.random() < entry.chance) {
      const amount = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
      result[entry.metalId] = (result[entry.metalId] ?? 0) + amount;
    }
  }
  return result;
}
