/**
 * Feature flags — controlled via environment variables.
 * All defaults are "safe for production" (restrictive or backward-compatible).
 *
 * P0 flags:
 *   SAVE_V2_ENABLED=false         → server rejects V2 save envelopes (rollback path)
 *   GRANT_SYNC_ENABLED=false      → grant-sync API returns 503 (drain before migration)
 *   TELEGRAM_SHOP_SYNC_ONLY=false → expose all active shop items, not just grant_sync ones
 *
 * P1 flags:
 *   DOMAIN_CANONICAL_ENABLED=false   → server does not use @cosmo/game-config calculators
 *   SAVE_TABLE_V2_ENABLED=false      → dual-read stays on UserSave only (no GameplaySave)
 *   WALLET_ENABLED=false             → credit ops stay in save JSON (no Wallet table)
 *   TELEGRAM_SUMMARY_CANONICAL=false → /telegram/me returns raw state fields, no level calc
 */

// ── P0 ────────────────────────────────────────────────────────────────────────
export const SAVE_V2_ENABLED = process.env.SAVE_V2_ENABLED !== 'false';
export const GRANT_SYNC_ENABLED = process.env.GRANT_SYNC_ENABLED !== 'false';
export const TELEGRAM_SHOP_SYNC_ONLY = process.env.TELEGRAM_SHOP_SYNC_ONLY !== 'false';

// ── P1 ────────────────────────────────────────────────────────────────────────

/**
 * When true, /telegram/me computes level and xpProgressFraction using
 * canonical calculators from @cosmo/game-config instead of raw state fields.
 * Default: true (safe — calculators produce identical results for valid saves).
 */
export const TELEGRAM_SUMMARY_CANONICAL =
  process.env.TELEGRAM_SUMMARY_CANONICAL !== 'false';

/**
 * When true, save reads/writes prefer the GameplaySave table over UserSave.
 * Dual-read (fallback to UserSave) is used during the migration window.
 * Default: false (off until migration is complete).
 */
export const SAVE_TABLE_V2_ENABLED =
  process.env.SAVE_TABLE_V2_ENABLED === 'true';

/**
 * When true, credit operations use the dedicated Wallet table for atomic updates.
 * Default: false (off until Wallet backfill is complete).
 */
export const WALLET_ENABLED =
  process.env.WALLET_ENABLED === 'true';

/**
 * When true, config and domain routes source data from @cosmo/game-config.
 * Default: true (already done for P0 config route).
 */
export const DOMAIN_CANONICAL_ENABLED =
  process.env.DOMAIN_CANONICAL_ENABLED !== 'false';
