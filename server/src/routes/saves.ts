/**
 * Save routes:
 *   GET /saves  — fetch latest snapshot
 *   PUT /saves  — upsert game snapshot (optimistic concurrency via rev)
 *
 * Accepted formats:
 *   V2 (preferred): { version: 2, savedAt: number, appliedGrantSeq: number, state: GameStateInit }
 *   V1 (legacy):    { version: 1, savedAt?: number, state: GameStateInit }
 *
 * Server never modifies the state contents — it stores the blob as-is.
 * mobile is the sole writer of gameplay state.
 */
import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import type { JwtPayload } from '../plugins/jwt';
import { SAVE_V2_ENABLED } from '../lib/features';

function validateEnvelope(data: unknown): { ok: true } | { ok: false; reason: string } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, reason: 'data must be a non-null object' };
  }
  const d = data as Record<string, unknown>;

  // V2 envelope — strict validation
  if (d.version === 2) {
    if (!SAVE_V2_ENABLED) {
      return { ok: false, reason: 'V2 save envelopes are not accepted on this server' };
    }
    if (typeof d.savedAt !== 'number') {
      return { ok: false, reason: 'v2 envelope requires savedAt: number' };
    }
    if (typeof d.appliedGrantSeq !== 'number') {
      return { ok: false, reason: 'v2 envelope requires appliedGrantSeq: number' };
    }
    if (typeof d.state !== 'object' || d.state === null || Array.isArray(d.state)) {
      return { ok: false, reason: 'v2 envelope requires state: object' };
    }
    return { ok: true };
  }

  // V1 envelope — relaxed, legacy rollout support
  if (d.version === 1) {
    if (typeof d.state !== 'object' || d.state === null || Array.isArray(d.state)) {
      return { ok: false, reason: 'v1 envelope requires state: object' };
    }
    return { ok: true };
  }

  // No version — reject; all clients must send a versioned envelope
  return { ok: false, reason: 'data.version must be 1 or 2' };
}

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
  // Body: { data: GameplaySaveEnvelopeV2 | GameplaySaveEnvelopeV1, rev?: number }
  // If `rev` is provided and doesn't match the server's current rev → 409 Conflict.
  // Client should then decide: discard local or force-push (omit rev).
  app.put('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as JwtPayload;
    const body = (req.body ?? {}) as { data?: unknown; rev?: unknown };

    const validation = validateEnvelope(body.data);
    if (!validation.ok) {
      return reply.status(400).send({ error: validation.reason });
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
