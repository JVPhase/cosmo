/**
 * Grant sync API:
 *   GET  /sync/grants?afterSeq=<n>  — returns pending grants after cursor
 *   POST /sync/grants/ack           — acknowledges grants up to a seq cursor
 *
 * mobile bootstrap flow:
 *   1. Load local + cloud save, pick newer
 *   2. Read appliedGrantSeq from envelope
 *   3. GET /sync/grants?afterSeq=appliedGrantSeq
 *   4. Apply grants to state
 *   5. Save full snapshot locally + push to /saves
 *   6. Only on success: POST /sync/grants/ack { upToSeq }
 */
import type { FastifyInstance } from 'fastify';
import type { JwtPayload } from '../plugins/jwt';
import { getPendingGrants, ackGrants } from '../lib/grants';
import { GRANT_SYNC_ENABLED } from '../lib/features';

export async function syncRoutes(app: FastifyInstance) {
  /**
   * GET /sync/grants?afterSeq=<n>
   * Returns all un-acked grants with seq > afterSeq, ordered by seq.
   * afterSeq defaults to 0 (fetch all pending grants).
   */
  app.get('/grants', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!GRANT_SYNC_ENABLED) {
      return reply.status(503).send({ error: 'Grant sync is temporarily unavailable' });
    }
    const { userId } = req.user as JwtPayload;
    const query = (req.query ?? {}) as { afterSeq?: unknown };
    const afterSeq = typeof query.afterSeq === 'string' ? parseInt(query.afterSeq, 10) : 0;

    if (isNaN(afterSeq) || afterSeq < 0) {
      return reply.status(400).send({ error: 'afterSeq must be a non-negative integer' });
    }

    const grants = await getPendingGrants(userId, afterSeq);
    return { grants };
  });

  /**
   * POST /sync/grants/ack
   * Body: { upToSeq: number }
   * Marks all un-acked grants with seq <= upToSeq as acknowledged.
   * mobile must only call this after a successful save/push.
   */
  app.post('/grants/ack', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!GRANT_SYNC_ENABLED) {
      return reply.status(503).send({ error: 'Grant sync is temporarily unavailable' });
    }
    const { userId } = req.user as JwtPayload;
    const body = (req.body ?? {}) as { upToSeq?: unknown };

    if (typeof body.upToSeq !== 'number' || !Number.isInteger(body.upToSeq) || body.upToSeq < 1) {
      return reply.status(400).send({ error: 'upToSeq must be a positive integer' });
    }

    await ackGrants(userId, body.upToSeq);
    return { ok: true };
  });
}
