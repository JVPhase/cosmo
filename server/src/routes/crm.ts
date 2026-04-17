import type { FastifyInstance, FastifyReply } from 'fastify'
import * as argon2 from 'argon2'
import prisma from '../lib/prisma'
import type { JwtPayload } from '../plugins/jwt'
import { registerCrmGameAdminRoutes } from './crmGameAdmin'
import { registerCrmLocaleRoutes } from './crmLocales'

const CRM_ROLES = ['admin', 'member', 'viewer'] as const
type CrmRole = (typeof CRM_ROLES)[number]

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return null
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!email) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function readPassword(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.length >= 8 ? value : null
}

function readCrmRole(value: unknown): CrmRole | null {
  if (typeof value !== 'string') return null
  return CRM_ROLES.includes(value as CrmRole) ? (value as CrmRole) : null
}

async function requireCrmAccess(userId: string, reply: FastifyReply): Promise<boolean> {
  const crmUser = await prisma.crmUser.findUnique({
    where: { userId },
    select: { role: true }
  })

  if (!crmUser) {
    await reply.status(403).send({ error: 'crm_access_required' })
    return false
  }

  return true
}

async function requireCrmAdmin(userId: string, reply: FastifyReply): Promise<boolean> {
  const crmUser = await prisma.crmUser.findUnique({
    where: { userId },
    select: { role: true }
  })

  if (!crmUser) {
    await reply.status(403).send({ error: 'crm_access_required' })
    return false
  }

  if (crmUser?.role !== 'admin') {
    await reply.status(403).send({ error: 'admin_only' })
    return false
  }

  return true
}

export async function crmRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    if (req.method === 'OPTIONS') return
    await app.authenticate(req, reply)
    const { userId } = req.user as JwtPayload
    if (!(await requireCrmAccess(userId, reply))) return
  })

  app.get('/me', async (req) => {
    const { userId } = req.user as JwtPayload
    const crmUser = await prisma.crmUser.findUnique({ where: { userId } })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true }
    })
    return { user, crm: crmUser }
  })

  app.get('/users', async (req, reply) => {
    const { userId } = req.user as JwtPayload
    if (!(await requireCrmAdmin(userId, reply))) return

    const users = await prisma.crmUser.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        }
      }
    })

    return {
      items: users.map((entry) => ({
        userId: entry.userId,
        email: entry.user.email,
        role: entry.role,
        createdAt: entry.user.createdAt.toISOString()
      }))
    }
  })

  app.post('/users', async (req, reply) => {
    const { userId } = req.user as JwtPayload
    if (!(await requireCrmAdmin(userId, reply))) return

    const body = (req.body ?? {}) as Record<string, unknown>
    const email = normalizeEmail(body.email)
    if (!email) return reply.status(400).send({ error: 'invalid email format' })

    const password = readPassword(body.password)
    if (!password) {
      return reply.status(400).send({ error: 'password must be at least 8 characters' })
    }

    const role = readCrmRole(body.role) ?? 'member'

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({ error: 'email already registered' })
    }

    const passwordHash = await argon2.hash(password)
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        crmUser: {
          create: { role }
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        crmUser: {
          select: { role: true }
        }
      }
    })

    return reply.status(201).send({
      userId: created.id,
      email: created.email,
      role: created.crmUser?.role ?? role,
      createdAt: created.createdAt.toISOString()
    })
  })

  app.get('/overview', async () => {
    const [leadCount, accountCount, dealCount, recentActivities] = await Promise.all([
      prisma.crmLead.count(),
      prisma.crmAccount.count(),
      prisma.crmDeal.count(),
      prisma.crmActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { account: true, lead: true, deal: true }
      })
    ])

    const pipeline = await prisma.crmDeal.groupBy({
      by: ['stage'],
      _sum: { value: true },
      _count: { _all: true }
    })

    return {
      counts: { leads: leadCount, accounts: accountCount, deals: dealCount },
      pipeline: pipeline.map((item) => ({
        stage: item.stage,
        value: item._sum.value ?? 0,
        deals: item._count._all
      })),
      recentActivities
    }
  })

  // Accounts
  app.get('/accounts', async () => {
    return prisma.crmAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, email: true } } }
    })
  })

  app.post('/accounts', async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>
    const name = asString(body.name)
    if (!name) return reply.status(400).send({ error: 'name is required' })

    const account = await prisma.crmAccount.create({
      data: {
        name,
        industry: asOptionalString(body.industry),
        region: asOptionalString(body.region),
        status: asOptionalString(body.status) ?? 'Active',
        health: asOptionalString(body.health) ?? 'Stable',
        arr: asNumber(body.arr),
        ownerId: asOptionalString(body.ownerId)
      }
    })

    return reply.status(201).send(account)
  })

  app.patch('/accounts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = (req.body ?? {}) as Record<string, unknown>
    const updated = await prisma.crmAccount.update({
      where: { id },
      data: {
        name: asOptionalString(body.name) ?? undefined,
        industry: asOptionalString(body.industry) ?? undefined,
        region: asOptionalString(body.region) ?? undefined,
        status: asOptionalString(body.status) ?? undefined,
        health: asOptionalString(body.health) ?? undefined,
        arr: body.arr === null ? null : asNumber(body.arr) ?? undefined
      }
    })
    return reply.send(updated)
  })

  app.delete('/accounts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.crmAccount.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Leads
  app.get('/leads', async () => {
    return prisma.crmLead.findMany({
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, email: true } }, convertedAccount: true }
    })
  })

  app.post('/leads', async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>
    const name = asString(body.name)
    if (!name) return reply.status(400).send({ error: 'name is required' })

    const lead = await prisma.crmLead.create({
      data: {
        name,
        email: asOptionalString(body.email),
        company: asOptionalString(body.company),
        source: asOptionalString(body.source),
        status: asOptionalString(body.status) ?? 'New',
        score: asNumber(body.score),
        ownerId: asOptionalString(body.ownerId)
      }
    })

    return reply.status(201).send(lead)
  })

  app.patch('/leads/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = (req.body ?? {}) as Record<string, unknown>
    const updated = await prisma.crmLead.update({
      where: { id },
      data: {
        name: asOptionalString(body.name) ?? undefined,
        email: asOptionalString(body.email) ?? undefined,
        company: asOptionalString(body.company) ?? undefined,
        source: asOptionalString(body.source) ?? undefined,
        status: asOptionalString(body.status) ?? undefined,
        score: body.score === null ? null : asNumber(body.score) ?? undefined,
        convertedAccountId:
          body.convertedAccountId === null
            ? null
            : asOptionalString(body.convertedAccountId) ?? undefined
      }
    })
    return reply.send(updated)
  })

  app.delete('/leads/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.crmLead.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Deals
  app.get('/deals', async () => {
    return prisma.crmDeal.findMany({
      orderBy: { createdAt: 'desc' },
      include: { account: true, owner: { select: { id: true, email: true } } }
    })
  })

  app.post('/deals', async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>
    const name = asString(body.name)
    if (!name) return reply.status(400).send({ error: 'name is required' })

    const deal = await prisma.crmDeal.create({
      data: {
        name,
        stage: asOptionalString(body.stage) ?? 'Qualified',
        value: asNumber(body.value),
        closeDate: body.closeDate ? new Date(String(body.closeDate)) : null,
        ownerId: asOptionalString(body.ownerId),
        accountId: asOptionalString(body.accountId)
      }
    })

    return reply.status(201).send(deal)
  })

  app.patch('/deals/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = (req.body ?? {}) as Record<string, unknown>
    const updated = await prisma.crmDeal.update({
      where: { id },
      data: {
        name: asOptionalString(body.name) ?? undefined,
        stage: asOptionalString(body.stage) ?? undefined,
        value: body.value === null ? null : asNumber(body.value) ?? undefined,
        closeDate: body.closeDate === null ? null : body.closeDate ? new Date(String(body.closeDate)) : undefined,
        accountId: body.accountId === null ? null : asOptionalString(body.accountId) ?? undefined
      }
    })
    return reply.send(updated)
  })

  app.delete('/deals/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.crmDeal.delete({ where: { id } })
    return reply.status(204).send()
  })

  // Activities
  app.get('/activities', async () => {
    return prisma.crmActivity.findMany({
      orderBy: { createdAt: 'desc' },
      include: { account: true, lead: true, deal: true, owner: { select: { id: true, email: true } } }
    })
  })

  app.post('/activities', async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>
    const title = asString(body.title)
    if (!title) return reply.status(400).send({ error: 'title is required' })

    const activity = await prisma.crmActivity.create({
      data: {
        title,
        type: asOptionalString(body.type) ?? 'Note',
        notes: asOptionalString(body.notes),
        dueAt: body.dueAt ? new Date(String(body.dueAt)) : null,
        doneAt: body.doneAt ? new Date(String(body.doneAt)) : null,
        accountId: asOptionalString(body.accountId),
        leadId: asOptionalString(body.leadId),
        dealId: asOptionalString(body.dealId),
        ownerId: asOptionalString(body.ownerId)
      }
    })

    return reply.status(201).send(activity)
  })

  app.patch('/activities/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = (req.body ?? {}) as Record<string, unknown>
    const updated = await prisma.crmActivity.update({
      where: { id },
      data: {
        title: asOptionalString(body.title) ?? undefined,
        type: asOptionalString(body.type) ?? undefined,
        notes: body.notes === null ? null : asOptionalString(body.notes) ?? undefined,
        dueAt: body.dueAt === null ? null : body.dueAt ? new Date(String(body.dueAt)) : undefined,
        doneAt: body.doneAt === null ? null : body.doneAt ? new Date(String(body.doneAt)) : undefined,
        accountId: body.accountId === null ? null : asOptionalString(body.accountId) ?? undefined,
        leadId: body.leadId === null ? null : asOptionalString(body.leadId) ?? undefined,
        dealId: body.dealId === null ? null : asOptionalString(body.dealId) ?? undefined
      }
    })
    return reply.send(updated)
  })

  app.delete('/activities/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.crmActivity.delete({ where: { id } })
    return reply.status(204).send()
  })

  registerCrmGameAdminRoutes(app)
  registerCrmLocaleRoutes(app)
}
