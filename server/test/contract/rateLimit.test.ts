/**
 * Contract tests: rate limiting and slow-down middleware.
 *
 * These tests build an isolated app with intentionally tight limits so the
 * full rate-limit → slow-down → ban cycle can be exercised quickly without
 * hammering the real per-route numbers.
 *
 * Run:
 *   pnpm test:contract  (uses .env.test)
 *
 * NOTE: slow-down tests assert that responses are delayed, which makes them
 * inherently time-sensitive.  They are skipped in CI by default (set
 * RUN_SLOW_TESTS=1 to enable).
 */
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import Fastify, { type FastifyInstance } from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { makeSlowDown, ipKey } from '../../src/plugins/slowDown'
import { blockMetrics } from '../../src/lib/blockMetrics'

// ── helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal Fastify app with a single POST /test route. */
async function buildTestApp(opts: {
  rateLimitMax: number
  ban?: number
  slowDownThreshold?: number
  slowDownDelay?: number
}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  await app.register(rateLimit, {
    global: true,
    max: opts.rateLimitMax,
    timeWindow: '1 minute',
    ban: opts.ban,
    keyGenerator: (req) => req.ip,
  })

  const preHandler =
    opts.slowDownThreshold !== undefined
      ? [
          makeSlowDown(
            {
              threshold: opts.slowDownThreshold,
              delayMs: opts.slowDownDelay ?? 50,
              maxDelayMs: 300,
              timeWindow: 60_000,
            },
            ipKey,
          ),
        ]
      : []

  app.post('/test', { preHandler }, async () => ({ ok: true }))

  await app.ready()
  return app
}

/** Fire N sequential inject requests and return all status codes. */
async function fireN(app: FastifyInstance, n: number): Promise<number[]> {
  const statuses: number[] = []
  for (let i = 0; i < n; i++) {
    const res = await app.inject({ method: 'POST', url: '/test' })
    statuses.push(res.statusCode)
  }
  return statuses
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Rate limiting — hard block', () => {
  let app: FastifyInstance

  before(async () => {
    app = await buildTestApp({ rateLimitMax: 3 })
  })

  after(async () => {
    await app.close()
  })

  it('allows requests up to the max', async () => {
    const statuses = await fireN(app, 3)
    assert.ok(
      statuses.every((s) => s === 200),
      `Expected all 200, got: ${statuses}`,
    )
  })

  it('returns 429 once the limit is exceeded', async () => {
    const res = await app.inject({ method: 'POST', url: '/test' })
    assert.equal(res.statusCode, 429)
  })

  it('429 response includes Retry-After header', async () => {
    const res = await app.inject({ method: 'POST', url: '/test' })
    assert.equal(res.statusCode, 429)
    assert.ok(
      res.headers['retry-after'] !== undefined,
      'Expected Retry-After header on 429',
    )
  })

  it('429 response body has error message', async () => {
    const res = await app.inject({ method: 'POST', url: '/test' })
    assert.equal(res.statusCode, 429)
    const body = res.json<{ message?: string }>()
    assert.ok(typeof body.message === 'string', 'Expected message field in 429 body')
  })
})

describe('Rate limiting — ban', () => {
  let app: FastifyInstance

  before(async () => {
    // max=2, ban after 2 excessive requests
    app = await buildTestApp({ rateLimitMax: 2, ban: 2 })
  })

  after(async () => {
    await app.close()
  })

  it('returns 429 (not 403/503) before ban threshold', async () => {
    // Exhaust the limit first
    await fireN(app, 2)
    const res = await app.inject({ method: 'POST', url: '/test' })
    assert.equal(res.statusCode, 429)
  })

  it('returns 403 after ban threshold is reached', async () => {
    // One more request to trigger the ban (already 1 over from previous test)
    const res = await app.inject({ method: 'POST', url: '/test' })
    // @fastify/rate-limit returns 403 when banned
    assert.equal(res.statusCode, 403)
  })
})

describe('Slow-down middleware', { skip: !process.env.RUN_SLOW_TESTS }, () => {
  let app: FastifyInstance

  before(async () => {
    app = await buildTestApp({
      rateLimitMax: 100,
      slowDownThreshold: 2,
      slowDownDelay: 80,
    })
  })

  after(async () => {
    await app.close()
  })

  it('does not add delay for requests under the threshold', async () => {
    const start = Date.now()
    await fireN(app, 2)
    const elapsed = Date.now() - start
    // Two unthrottled requests should complete well under 200 ms
    assert.ok(elapsed < 200, `Expected < 200 ms, got ${elapsed} ms`)
  })

  it('adds measurable delay for requests over the threshold', async () => {
    // Two more requests: 3rd and 4th are both over threshold=2
    const start = Date.now()
    await fireN(app, 2)
    const elapsed = Date.now() - start
    // Each excess request adds at least 80 ms
    assert.ok(elapsed >= 80, `Expected >= 80 ms delay, got ${elapsed} ms`)
  })
})

describe('Block metrics', () => {
  let app: FastifyInstance

  before(async () => {
    app = await buildTestApp({ rateLimitMax: 1 })
  })

  after(async () => {
    await app.close()
  })

  it('records a rate_limit event after exceeding the limit', async () => {
    // Drain any stale state from previous test suites
    blockMetrics.drainRecent()

    // One allowed request, then one blocked
    await app.inject({ method: 'POST', url: '/test' })
    await app.inject({ method: 'POST', url: '/test' })

    const summary = blockMetrics.getSummary()
    assert.ok(
      (summary.totals.rate_limit ?? 0) >= 1,
      `Expected at least 1 rate_limit event, got: ${JSON.stringify(summary.totals)}`,
    )
  })
})

describe('Composite rate-limit key (IP + userId)', () => {
  let app: FastifyInstance

  before(async () => {
    app = await buildTestApp({ rateLimitMax: 2 })
    // Override keyGenerator to be IP+userId composite
    // (the global app already does this; this verifies two users share no bucket)
  })

  after(async () => {
    await app.close()
  })

  it('two different users sharing an IP are not grouped into the same bucket', async () => {
    // Build a fresh app that uses composite keys
    const compositeApp = Fastify({ logger: false })
    await compositeApp.register(rateLimit, {
      global: true,
      max: 2,
      timeWindow: '1 minute',
      keyGenerator: (req) => {
        const userId =
          (req.headers['x-user-id'] as string | undefined) ?? 'anon'
        return `${req.ip}:${userId}`
      },
    })
    compositeApp.post('/test', async () => ({ ok: true }))
    await compositeApp.ready()

    // User A exhausts their bucket
    await compositeApp.inject({
      method: 'POST', url: '/test', headers: { 'x-user-id': 'user-a' },
    })
    await compositeApp.inject({
      method: 'POST', url: '/test', headers: { 'x-user-id': 'user-a' },
    })
    const blockedA = await compositeApp.inject({
      method: 'POST', url: '/test', headers: { 'x-user-id': 'user-a' },
    })
    assert.equal(blockedA.statusCode, 429, 'user-a should be blocked')

    // User B, same IP, should NOT be blocked
    const okB = await compositeApp.inject({
      method: 'POST', url: '/test', headers: { 'x-user-id': 'user-b' },
    })
    assert.equal(okB.statusCode, 200, 'user-b should still be allowed')

    await compositeApp.close()
  })
})
