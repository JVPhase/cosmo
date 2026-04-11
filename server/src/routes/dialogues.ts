import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma'

export async function dialoguesRoutes(app: FastifyInstance) {
  app.get('/dialogues', async (_req, reply) => {
    const row = await prisma.gameConfig.findUnique({ where: { key: 'dialogues' } })
    if (!row) {
      return reply.status(404).send({ error: 'dialogues_not_seeded' })
    }
    reply.header('Cache-Control', 'no-store')
    return row.data
  })
}
