import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import cors from '@fastify/cors'
import { jwtPlugin } from './plugins/jwt'
import { configRoutes } from './routes/config'
import { authRoutes } from './routes/auth'
import { oauthRoutes } from './routes/oauth'
import { savesRoutes } from './routes/saves'
import { telegramRoutes } from './routes/telegram'
import { syncRoutes } from './routes/sync'
import { crmRoutes } from './routes/crm'
import { consentsRoutes } from './routes/consents'
import { dialoguesRoutes } from './routes/dialogues'
import { i18nRoutes } from './routes/i18n'
import { LIMITS } from './lib/rateLimitConfig'
import { blockMetrics } from './lib/blockMetrics'

const app = Fastify({ logger: true })

/**
 * Decode userId from a Bearer JWT without verifying the signature.
 * Used only for rate-limit key generation — actual auth verification
 * still happens in the route preHandler.
 */
function jwtUserId(authHeader: string | undefined): string {
  if (!authHeader?.startsWith('Bearer ')) return 'anon'
  try {
    const payload = JSON.parse(
      Buffer.from(authHeader.slice(7).split('.')[1], 'base64url').toString(),
    ) as { userId?: string }
    return payload.userId ?? 'anon'
  } catch {
    return 'anon'
  }
}

function corsOriginConfig() {
  const configuredOrigins = [
    process.env.APP_ORIGIN,
    process.env.CORS_ALLOWED_ORIGINS,
  ]
    .flatMap((value) => value?.split(',') ?? [])
    .map((value) => value.trim())
    .filter(Boolean)

  if (configuredOrigins.length === 0) return true

  const allowedOrigins = new Set(configuredOrigins)

  return (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
    if (!origin || allowedOrigins.has(origin)) {
      cb(null, true)
      return
    }

    cb(new Error(`Origin ${origin} is not allowed`), false)
  }
}

async function main() {
  // Global rate limit with composite key: IP + userId + telegramId.
  // Per-route configs (via config.rateLimit) override max/timeWindow on top.
  await app.register(rateLimit, {
    global: true,
    max: LIMITS.global.max,
    timeWindow: LIMITS.global.timeWindow,

    keyGenerator(req) {
      const userId = jwtUserId(req.headers.authorization)
      // Telegram user ID may be forwarded by the Mini App client as a header
      // after authentication; fall back to empty string when absent.
      const tgId = (req.headers['x-telegram-user-id'] as string | undefined) ?? ''
      return `${req.ip}:${userId}:${tgId}`
    },

    onExceeding(req, key) {
      blockMetrics.record(req, key, 'rate_limit')
    },

    onBanReach(req, key) {
      blockMetrics.record(req, key, 'ban')
      req.log.error({ key, url: req.url }, '[anti-bot] IP banned after repeated rate-limit violations')
    },
  })

  await app.register(cors, {
    origin: corsOriginConfig(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-User-Id'],
  })

  // JWT decorator + app.authenticate helper
  await app.register(jwtPlugin)

  // Routes
  await app.register(configRoutes)
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(oauthRoutes, { prefix: '/auth' })
  await app.register(savesRoutes, { prefix: '/saves' })
  await app.register(telegramRoutes, { prefix: '/telegram' })
  await app.register(syncRoutes, { prefix: '/sync' })
  await app.register(crmRoutes, { prefix: '/crm' })
  await app.register(consentsRoutes, { prefix: '/consents' })
  await app.register(dialoguesRoutes)
  await app.register(i18nRoutes)

  // Internal metrics endpoint — restrict in production to internal network / admin token.
  app.get('/metrics/blocks', async (_req, reply) => {
    if (process.env.NODE_ENV === 'production') {
      const adminToken = process.env.METRICS_ADMIN_TOKEN
      if (adminToken && _req.headers['x-admin-token'] !== adminToken) {
        return reply.status(403).send({ error: 'Forbidden' })
      }
    }
    return blockMetrics.getSummary()
  })

  const address = await app.listen({ port: 3000, host: '0.0.0.0' })
  app.log.info(`Cosmo server running at ${address}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
