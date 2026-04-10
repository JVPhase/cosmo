/**
 * Feature flags — controlled via environment variables.
 * All defaults are "safe for production" (restrictive or backward-compatible).
 *
 * Set to "false" to disable a flag:
 *   SAVE_V2_ENABLED=false         → server rejects V2 save envelopes (rollback path)
 *   GRANT_SYNC_ENABLED=false      → grant-sync API returns 503 (drain before migration)
 *   TELEGRAM_SHOP_SYNC_ONLY=false → expose all active shop items, not just grant_sync ones
 */
export const SAVE_V2_ENABLED = process.env.SAVE_V2_ENABLED !== 'false';
export const GRANT_SYNC_ENABLED = process.env.GRANT_SYNC_ENABLED !== 'false';
export const TELEGRAM_SHOP_SYNC_ONLY = process.env.TELEGRAM_SHOP_SYNC_ONLY !== 'false';
