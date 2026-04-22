import type { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma'

export async function dialoguesRoutes(app: FastifyInstance) {
  app.get('/dialogues', async (_req, reply) => {
    const [dialogueRow, charactersRow] = await Promise.all([
      prisma.gameConfig.findUnique({ where: { key: 'dialogues' } }),
      prisma.gameConfig.findUnique({ where: { key: 'characters' } }),
    ])
    if (!dialogueRow) {
      return reply.status(404).send({ error: 'dialogues_not_seeded' })
    }
    reply.header('Cache-Control', 'no-store')
    return {
      version: 1,
      characters: charactersRow?.data ?? [],
      sectorDialogues: dialogueRow.data,
    }
  })
}
