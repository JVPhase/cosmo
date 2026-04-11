import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma'
import { listGameConfigKeys } from './config'
import { validateGameplayEnvelope } from '../lib/saveEnvelope'

const CONFIG_KEY_HINTS: Record<string, string> = {
  formulaConstants: 'Формулы и константы прогрессии',
  upgrades: 'Апгрейды клика / пассива',
  sectors: 'Сектора, зоны, планеты (карта)',
  expeditions: 'Экспедиции',
  shop: 'Магазин и металл-тиры',
  research: 'Исследования',
  player: 'XP, макс. уровень',
  modules: 'Модули корабля',
  cannons: 'Пушки',
  metals: 'Таблица дропа металлов',
  ships: 'Корабли',
  aliens: 'Чужие / бои',
  achievements: 'Ачивки и награды за claim',
  planets: 'Оверрайды планет и темы зон'
}

export function registerCrmGameAdminRoutes(app: FastifyInstance) {
  app.get('/dialogues', async (_req, reply) => {
    const row = await prisma.gameConfig.findUnique({ where: { key: 'dialogues' } })
    if (!row) return reply.status(404).send({ error: 'dialogues_not_seeded' })
    return {
      key: row.key,
      data: row.data,
      version: row.version,
      updatedAt: row.updatedAt.toISOString()
    }
  })

  app.put('/dialogues', async (req, reply) => {
    const body = (req.body ?? {}) as { data?: unknown }
    if (body.data === undefined) {
      return reply.status(400).send({ error: 'body.data is required' })
    }
    const row = await prisma.gameConfig.upsert({
      where: { key: 'dialogues' },
      create: { key: 'dialogues', data: body.data as object, version: 1 },
      update: { data: body.data as object, version: { increment: 1 } }
    })
    return {
      key: row.key,
      version: row.version,
      updatedAt: row.updatedAt.toISOString()
    }
  })

  app.get('/game-config/keys', async () => {
    const keys = listGameConfigKeys()
    const rows = await prisma.gameConfig.findMany({
      select: { key: true, updatedAt: true, version: true }
    })
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]))
    return {
      keys: keys.map((key) => ({
        key,
        hint: CONFIG_KEY_HINTS[key] ?? '',
        overridden: Boolean(byKey[key]),
        updatedAt: byKey[key]?.updatedAt.toISOString() ?? null,
        version: byKey[key]?.version ?? null
      }))
    }
  })

  app.get('/game-config/:key', async (req, reply) => {
    const { key } = req.params as { key: string }
    if (!listGameConfigKeys().includes(key)) {
      return reply.status(404).send({ error: 'unknown config key' })
    }
    const row = await prisma.gameConfig.findUnique({ where: { key } })
    return {
      key,
      overridden: Boolean(row),
      data: row?.data ?? null,
      version: row?.version ?? null,
      updatedAt: row?.updatedAt.toISOString() ?? null
    }
  })

  app.put('/game-config/:key', async (req, reply) => {
    const { key } = req.params as { key: string }
    if (!listGameConfigKeys().includes(key)) {
      return reply.status(404).send({ error: 'unknown config key' })
    }
    const body = (req.body ?? {}) as { data?: unknown }
    if (body.data === undefined) {
      return reply.status(400).send({ error: 'body.data is required' })
    }
    const row = await prisma.gameConfig.upsert({
      where: { key },
      create: { key, data: body.data as object, version: 1 },
      update: { data: body.data as object, version: { increment: 1 } }
    })
    return {
      key: row.key,
      version: row.version,
      updatedAt: row.updatedAt.toISOString()
    }
  })

  app.delete('/game-config/:key', async (req, reply) => {
    const { key } = req.params as { key: string }
    if (!listGameConfigKeys().includes(key)) {
      return reply.status(404).send({ error: 'unknown config key' })
    }
    const result = await prisma.gameConfig.deleteMany({ where: { key } })
    if (result.count === 0) {
      return reply.status(404).send({ error: 'no override stored for this key' })
    }
    return reply.status(204).send()
  })

  app.get('/players/search', async (req, reply) => {
    const q = (req.query as { q?: string }).q?.trim() ?? ''
    const limitRaw = (req.query as { limit?: string }).limit
    const limit = Math.min(50, Math.max(1, parseInt(limitRaw ?? '20', 10) || 20))

    if (q.length < 2) {
      return reply.status(400).send({ error: 'query q must be at least 2 characters' })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { telegramUser: { username: { contains: q, mode: 'insensitive' } } },
          { id: { startsWith: q } }
        ]
      },
      take: limit,
      select: {
        id: true,
        email: true,
        createdAt: true,
        telegramUser: { select: { username: true, telegramId: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      users: users.map((u) => ({
        ...u,
        telegramUser: u.telegramUser
          ? {
              username: u.telegramUser.username,
              telegramId: u.telegramUser.telegramId.toString()
            }
          : null
      }))
    }
  })

  app.get('/players/:userId/game-state', async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        telegramUser: { select: { username: true, telegramId: true } }
      }
    })
    if (!user) return reply.status(404).send({ error: 'user not found' })

    const userOut = {
      ...user,
      telegramUser: user.telegramUser
        ? {
            username: user.telegramUser.username,
            telegramId: user.telegramUser.telegramId.toString()
          }
        : null
    }

    const [userSave, gameplaySave, wallet] = await Promise.all([
      prisma.userSave.findUnique({ where: { userId } }),
      prisma.gameplaySave.findUnique({ where: { userId } }),
      prisma.wallet.findUnique({ where: { userId } })
    ])

    return {
      user: userOut,
      userSave: userSave
        ? { data: userSave.data, rev: userSave.rev, updatedAt: userSave.updatedAt.toISOString() }
        : null,
      gameplaySave: gameplaySave
        ? {
            data: gameplaySave.data,
            rev: gameplaySave.rev,
            updatedAt: gameplaySave.updatedAt.toISOString()
          }
        : null,
      wallet: wallet
        ? { credits: wallet.credits.toString(), updatedAt: wallet.updatedAt.toISOString() }
        : null
    }
  })

  app.put('/players/:userId/user-save', async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!exists) return reply.status(404).send({ error: 'user not found' })

    const body = (req.body ?? {}) as { data?: unknown }
    const v = validateGameplayEnvelope(body.data)
    if (!v.ok) return reply.status(400).send({ error: v.reason })

    const existing = await prisma.userSave.findUnique({ where: { userId } })
    const nextRev = (existing?.rev ?? 0) + 1
    const save = await prisma.userSave.upsert({
      where: { userId },
      create: { userId, data: body.data as object, rev: nextRev },
      update: { data: body.data as object, rev: nextRev }
    })
    return { rev: save.rev, updatedAt: save.updatedAt.toISOString() }
  })

  app.put('/players/:userId/gameplay-save', async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!exists) return reply.status(404).send({ error: 'user not found' })

    const body = (req.body ?? {}) as { data?: unknown }
    const v = validateGameplayEnvelope(body.data)
    if (!v.ok) return reply.status(400).send({ error: v.reason })

    const existing = await prisma.gameplaySave.findUnique({ where: { userId } })
    const nextRev = (existing?.rev ?? 0) + 1
    const save = await prisma.gameplaySave.upsert({
      where: { userId },
      create: { userId, data: body.data as object, rev: nextRev },
      update: { data: body.data as object, rev: nextRev }
    })
    return { rev: save.rev, updatedAt: save.updatedAt.toISOString() }
  })

  app.put('/players/:userId/wallet', async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!exists) return reply.status(404).send({ error: 'user not found' })

    const body = (req.body ?? {}) as { credits?: unknown }
    const raw = body.credits
    if (typeof raw !== 'number' && typeof raw !== 'string') {
      return reply.status(400).send({ error: 'credits must be a number or numeric string' })
    }
    const n = BigInt(String(Math.trunc(Number(raw))))
    if (n < 0n) return reply.status(400).send({ error: 'credits must be non-negative' })

    const w = await prisma.wallet.upsert({
      where: { userId },
      create: { userId, credits: n },
      update: { credits: n }
    })
    return { credits: w.credits.toString(), updatedAt: w.updatedAt.toISOString() }
  })
}
