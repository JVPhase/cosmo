/**
 * Rate-limit and slow-down configuration per route group.
 *
 * Limits are scaled up in non-production environments (×10) so tests and
 * local development are never throttled unintentionally.
 *
 * Usage in a route:
 *   import { LIMITS } from '../lib/rateLimitConfig'
 *   app.post('/login', { config: { rateLimit: LIMITS.authLogin } }, handler)
 */

/** How much to relax limits outside production. */
const ENV_SCALE = process.env.NODE_ENV === 'production' ? 1 : 10

export interface SlowDownConfig {
  /** Requests within the window above which delay starts. */
  threshold: number
  /** Milliseconds added per request over the threshold. */
  delayMs: number
  /** Maximum total delay in milliseconds. */
  maxDelayMs: number
  /** Counting window in milliseconds. */
  timeWindow: number
}

export interface RouteLimit {
  max: number
  timeWindow: string
  /**
   * Number of 429 responses before the IP is temporarily banned.
   * Undefined = no ban.
   */
  ban?: number
  /**
   * Slow-down profile applied BEFORE the hard rate limit.
   * Adds artificial latency to discourage rapid retries without a hard block.
   */
  slowDown?: SlowDownConfig
}

/**
 * Central registry of per-route rate limits.
 * Import individual entries and pass them as `config.rateLimit` on the route.
 */
export const LIMITS = {
  /** POST /auth/register */
  authRegister: {
    max: 5 * ENV_SCALE,
    timeWindow: '1 minute',
    ban: 3,
    slowDown: {
      threshold: 3,
      delayMs: 500,
      maxDelayMs: 5_000,
      timeWindow: 60_000,
    },
  },

  /** POST /auth/login */
  authLogin: {
    max: 5 * ENV_SCALE,
    timeWindow: '1 minute',
    ban: 3,
    slowDown: {
      threshold: 3,
      delayMs: 1_000,
      maxDelayMs: 10_000,
      timeWindow: 60_000,
    },
  },

  /** POST /auth/oauth (Google / Apple token exchange) */
  authOauth: {
    max: 10 * ENV_SCALE,
    timeWindow: '1 minute',
  },

  /** POST /auth/refresh */
  authRefresh: {
    max: 20 * ENV_SCALE,
    timeWindow: '1 minute',
  },

  /**
   * POST /telegram/auth
   * Telegram initData validation — first touchpoint for new users.
   */
  telegramAuth: {
    max: 10 * ENV_SCALE,
    timeWindow: '1 minute',
    ban: 5,
    slowDown: {
      threshold: 5,
      delayMs: 300,
      maxDelayMs: 3_000,
      timeWindow: 60_000,
    },
  },

  /**
   * POST /telegram/webhook
   * Telegram sends many webhook events; only restrict the absolute burst.
   * Verification is handled via X-Telegram-Bot-Api-Secret-Token.
   */
  telegramWebhook: {
    max: 300,
    timeWindow: '1 minute',
  },

  /** Global fallback applied at app level. */
  global: {
    max: 120 * ENV_SCALE,
    timeWindow: '1 minute',
  },
} as const satisfies Record<string, RouteLimit>
