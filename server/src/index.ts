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

const app = Fastify({ logger: true })

async function main() {
  // Global rate limit (auth routes apply a stricter per-route limit on top)
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' })

  await app.register(
    cors,
    {
      origin: true,
      credentials: true
    }
  )

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

  const address = await app.listen({ port: 3000, host: '0.0.0.0' })
  app.log.info(`Cosmo server running at ${address}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
