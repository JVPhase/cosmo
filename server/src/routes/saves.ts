import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import type { JwtPayload } from '../plugins/jwt';

export async function savesRoutes(app: FastifyInstance) {
  // GET /saves — fetch latest snapshot for the authenticated user
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as JwtPayload;
    const save = await prisma.userSave.findUnique({ where: { userId } });
    if (!save) return { save: null };
    return {
      save: {
        data: save.data,
        rev: save.rev,
        updatedAt: save.updatedAt.toISOString(),
      },
    };
  });

  // PUT /saves — upsert game snapshot
  // Body: { data: StoredGameV1, rev?: number }
  // If `rev` is provided and doesn't match the server's current rev → 409 Conflict.
  // Client should then decide: discard local or force-push (omit rev).
  app.put('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as JwtPayload;
    const body = (req.body ?? {}) as { data?: unknown; rev?: unknown };

    if (typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
      return reply.status(400).send({ error: 'data must be a non-null object' });
    }

    const existing = await prisma.userSave.findUnique({ where: { userId } });

    // Optimistic concurrency: if client sends rev, it must match server
    if (existing && typeof body.rev === 'number' && body.rev !== existing.rev) {
      return reply.status(409).send({
        error: 'conflict',
        serverRev: existing.rev,
        serverUpdatedAt: existing.updatedAt.toISOString(),
      });
    }

    const nextRev = (existing?.rev ?? 0) + 1;
    const save = await prisma.userSave.upsert({
      where: { userId },
      create: { userId, data: body.data as object, rev: nextRev },
      update: { data: body.data as object, rev: nextRev },
    });

    return { rev: save.rev, updatedAt: save.updatedAt.toISOString() };
  });
}
