/**
 * Canonical DTO types shared between mobile, server, and future clients.
 *
 * These mirror the actual runtime types in mobile/cosmo-miner/src/game/types.ts
 * and the wire format produced by cloudSave.ts / grants.ts.
 *
 * Naming convention:
 *   - Dto suffix = safe to serialize/deserialize across the network
 *   - No Zod runtime validators here — keep the package dependency-free.
 *     Server-side validation lives in each route handler.
 */

// ── Boost ─────────────────────────────────────────────────────────────────────

/**
 * Mirrors mobile BoostStat union (SHOP.ts).
 * Stored as a plain string on the wire for forward-compatibility.
 */
export type BoostStatDto =
  | 'clickMultiplier'
  | 'passiveMultiplier'
  | 'metalDropBonus'
  | 'xpMultiplier'
  | 'damageMultiplier'
  | (string & {}); // allow unknown future stats without breaking deserialization

/**
 * Effect shape stored inside an ActiveBoost.
 * Mirrors mobile BoostEffect (SHOP.ts): { stat, multiplier, durationMs }.
 */
export type BoostEffectDto = {
  stat: BoostStatDto;
  multiplier: number;
  durationMs: number;
};

/**
 * Mirrors mobile ActiveBoost (types.ts).
 * instanceId = deterministic "grant_<seq>" string (grants.ts).
 */
export type ActiveBoostDto = {
  instanceId: string;
  shopItemId: string;
  effect: BoostEffectDto;
  expiresAt: number;
};

// ── Achievements ──────────────────────────────────────────────────────────────

/**
 * Mirrors mobile AchievementsState (types.ts).
 * AchievementId is a numeric literal in game-data (ACHIEVEMENTS.ts ids: 1, 2, 3, …).
 * Stored as numbers in the save state, not strings.
 */
export type AchievementsStateDto = {
  unlockedIds: number[];
  claimedIds: number[];
};

// ── Save envelope ─────────────────────────────────────────────────────────────

/**
 * Minimal game state shape stored inside a V2 save envelope.
 *
 * Key decisions:
 *   - upgrades: Record<string, number> — JSON object keys are always strings even
 *     though UpgradeId is a number in TypeScript.
 *   - achievements: AchievementsStateDto — { unlockedIds, claimedIds } arrays.
 *   - activeBoosts: ActiveBoostDto[] — full shape with instanceId + effect.
 *   - All domain-specific ids typed as string for cross-package portability.
 */
export type GameStateDto = {
  energy?: number;
  totalEarned?: number;
  clicks?: number;
  playerXP?: number;
  credits?: number;
  unlockedPlanetIds?: string[];
  selectedPlanetId?: string;
  /** JSON keys are strings even for numeric UpgradeId */
  upgrades?: Record<string, number>;
  metals?: Record<string, number>;
  discoveredMetals?: string[];
  achievements?: AchievementsStateDto;
  activeBoosts?: ActiveBoostDto[];
  fleet?: {
    ownedShips?: Array<{
      shipId: string;
      broken?: boolean;
      cannons?: Record<string, number>;
      equippedModuleId?: string | null;
    }>;
    selectedShipId?: string | null;
  };
  battle?: Record<string, unknown> | null;
  research?: Record<string, unknown>;
  expeditions?: unknown[];
  tabsUnlocked?: Record<string, boolean>;
  moduleLevels?: Record<string, number>;
  chosenCharacterId?: string | null;
  metalDealDone?: boolean;
  battlesWon?: number;
  battleWinStreak?: number;
};

/** V2 save envelope — the canonical on-wire and at-rest format. */
export type GameplaySaveEnvelopeV2Dto = {
  version: 2;
  savedAt: number;
  appliedGrantSeq: number;
  state: GameStateDto;
};

// ── Grant payloads ────────────────────────────────────────────────────────────

export type GrantKind =
  | 'credits_grant'
  | 'metal_grant'
  | 'booster_grant'
  | 'loot_box_reward_grant'
  | (string & {}); // forward-compatible

export type CreditsGrantPayload = { amount: number };
export type MetalGrantPayload = { metalId: string; quantity: number };

/**
 * Booster grant payload (server → mobile, grants.ts).
 * effectType maps to BoostStat on the client side.
 * multiplier/bonus are optional depending on the boost type.
 */
export type BoosterGrantPayload = {
  shopItemId: string;
  effectType: string;
  multiplier?: number;
  bonus?: number;
  durationMs: number;
};

export type LootBoxRewardGrantPayload = { rolledMetals: Record<string, number> };

export type GrantPayload =
  | CreditsGrantPayload
  | MetalGrantPayload
  | BoosterGrantPayload
  | LootBoxRewardGrantPayload
  | Record<string, unknown>; // forward-compatible

/**
 * Wire-format grant DTO.
 * Mirrors mobile cloudSave.ts GrantDto exactly:
 *   { id, seq, kind, payload: Record<string, unknown>, createdAt: string }
 */
export type GrantDto = {
  id: string;
  seq: number;
  kind: GrantKind;
  payload: Record<string, unknown>;
  createdAt: string; // ISO-8601 from server
};

// ── Telegram summary ──────────────────────────────────────────────────────────

/** Server-computed summary returned by GET /telegram/me */
export type TelegramGameSummaryDto = {
  playerXP: number;
  level: number;
  xpProgressFraction: number;
  totalEarned: number;
  credits: number;
  unlockedPlanets: number;
  saveRev: number;
};

// ── Shop catalog SKUs ─────────────────────────────────────────────────────────

/**
 * All canonical shop item ids.
 *
 * Sources:
 *   - Server DB (server/prisma/seed.ts ShopItem rows) — authoritative for purchases
 *   - Mobile in-game credit shop (SHOP_DATA in game-config/src/shop.ts)
 *   - Mobile IAP credit packs (mobile/cosmo-miner/src/game/CREDIT_PACKS.ts)
 *
 * Server SKU set (seed.ts):
 *   boosters: booster_mining_1h, booster_xp_1h, booster_metal_1h, booster_battle_30m
 *   metals:   metal_iron, metal_titan, metal_iridium, metal_void, metal_echo
 *   loot:     loot_box_basic, loot_box_advanced, loot_box_premium
 *   premium:  premium_sector_skip, premium_research_reset
 *   credits:  credits_100, credits_1000, credits_10000
 *
 * Mobile-only credit packs (CREDIT_PACKS.ts, IAP — no server ShopItem row):
 *   credits_ad, credits_300, credits_800, credits_2000
 *
 * Mobile-only credit shop item not in server seed:
 *   converter
 */
export type ShopItemIdCanonical =
  // ── Server + mobile credit shop (SHOP_DATA + seed.ts) ────────────────────
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
  | 'converter'
  // ── Server credit packs (seed.ts, purchaseable via Telegram Stars) ────────
  | 'credits_100'
  | 'credits_1000'
  | 'credits_10000'
  // ── Server premium unlocks (seed.ts, deliveryMode: unsupported in P0) ─────
  | 'premium_sector_skip'
  | 'premium_research_reset'
  // ── Mobile-only IAP credit packs (CREDIT_PACKS.ts, no server ShopItem) ───
  | 'credits_ad'
  | 'credits_300'
  | 'credits_800'
  | 'credits_2000';
