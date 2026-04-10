/**
 * Slow-down preHandler factory.
 *
 * Instead of immediately returning 429, this adds an artificial delay that
 * grows with each successive request over the threshold.  Legitimate clients
 * hitting the API normally won't notice; rapid-fire bots incur increasing
 * latency before they hit the hard rate-limit block.
 *
 * Usage:
 *   import { makeSlowDown, ipUserKey } from '../plugins/slowDown'
 *   import { LIMITS } from '../lib/rateLimitConfig'
 *
 *   const loginSlowDown = makeSlowDown(LIMITS.authLogin.slowDown!, ipUserKey)
 *
 *   app.post('/login', {
 *     config: { rateLimit: LIMITS.authLogin },
 *     preHandler: [loginSlowDown],
 *   }, handler)
 */
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { SlowDownConfig } from '../lib/rateLimitConfig'
import { blockMetrics } from '../lib/blockMetrics'

interface SlowEntry {
  count: number
  windowStart: number
}

/**
 * Pre-built key generators.  Use one of these (or write your own) when calling
 * makeSlowDown().
 */
export function ipUserKey(req: FastifyRequest): string {
  const userId = _decodeUserId(req) ?? 'anon'
  return `${req.ip}:${userId}`
}

export function ipKey(req: FastifyRequest): string {
  return req.ip
}

/**
 * Creates a Fastify preHandler that applies progressive slow-down.
 *
 * The returned handler is stateful (owns an in-memory Map) — create it once
 * per route, not per-request.
 */
export function makeSlowDown(
  config: SlowDownConfig,
  keyGen: (req: FastifyRequest) => string = ipUserKey,
): (req: FastifyRequest, reply: FastifyReply) => Promise<void> {
  const store = new Map<string, SlowEntry>()

  // Evict stale entries periodically so memory doesn't grow unbounded.
  const cleanup = setInterval(() => {
    const horizon = Date.now() - config.timeWindow
    for (const [key, entry] of store) {
      if (entry.windowStart < horizon) store.delete(key)
    }
  }, config.timeWindow).unref()

  // Allow tests / graceful shutdown to clean up.
  if (typeof cleanup.unref === 'function') cleanup.unref()

  return async function slowDownHandler(
    req: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const key = keyGen(req)
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || now - entry.windowStart > config.timeWindow) {
      entry = { count: 0, windowStart: now }
    }
    entry.count++
    store.set(key, entry)

    if (entry.count > config.threshold) {
      const excess = entry.count - config.threshold
      const delay = Math.min(excess * config.delayMs, config.maxDelayMs)
      blockMetrics.record(req, key, 'slow_down')
      await sleep(delay)
    }
  }
}

// ── internal helpers ─────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function _decodeUserId(req: FastifyRequest): string | null {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const payload = JSON.parse(
      Buffer.from(auth.slice(7).split('.')[1], 'base64url').toString(),
    ) as { userId?: string }
    return payload.userId ?? null
  } catch {
    return null
  }
}
