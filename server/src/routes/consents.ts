import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import type { JwtPayload } from '../plugins/jwt';

const VALID_CONSENT_TYPES = new Set([
  'privacy_policy',
  'terms_of_service',
  'telegram_data',
  'marketing',
]);

export async function consentsRoutes(app: FastifyInstance) {
  // POST /consents — record or re-grant a consent
  app.post(
    '/',
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const { userId } = req.user as JwtPayload;
      const body = (req.body ?? {}) as {
        consentType?: unknown;
        version?: unknown;
        metadata?: unknown;
      };

      if (typeof body.consentType !== 'string' || !VALID_CONSENT_TYPES.has(body.consentType)) {
        return reply.status(400).send({ error: 'invalid consentType' });
      }
      if (typeof body.version !== 'string' || !body.version.trim()) {
        return reply.status(400).send({ error: 'version is required' });
      }

      const consent = await prisma.userConsent.upsert({
        where: { userId_consentType: { userId, consentType: body.consentType } },
        create: {
          userId,
          consentType: body.consentType,
          version: body.version.trim(),
          revokedAt: null,
          ipAddress: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
          metadata: typeof body.metadata === 'object' && body.metadata !== null
            ? (body.metadata as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
        update: {
          version: body.version.trim(),
          grantedAt: new Date(),
          revokedAt: null,
          ipAddress: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
          metadata: typeof body.metadata === 'object' && body.metadata !== null
            ? (body.metadata as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
      });

      return reply.status(201).send(consent);
    },
  );

  // GET /consents — list all consents for the current user
  app.get(
    '/',
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const { userId } = req.user as JwtPayload;
      const consents = await prisma.userConsent.findMany({
        where: { userId },
        select: {
          consentType: true,
          version: true,
          grantedAt: true,
          revokedAt: true,
        },
        orderBy: { grantedAt: 'desc' },
      });
      return reply.send(consents);
    },
  );

  // DELETE /consents/:consentType — revoke a specific consent
  app.delete(
    '/:consentType',
    { onRequest: [app.authenticate] },
    async (req, reply) => {
      const { userId } = req.user as JwtPayload;
      const { consentType } = req.params as { consentType: string };

      if (!VALID_CONSENT_TYPES.has(consentType)) {
        return reply.status(400).send({ error: 'invalid consentType' });
      }

      const existing = await prisma.userConsent.findUnique({
        where: { userId_consentType: { userId, consentType } },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'consent not found' });
      }
      if (existing.revokedAt !== null) {
        return reply.status(409).send({ error: 'consent already revoked' });
      }

      const updated = await prisma.userConsent.update({
        where: { userId_consentType: { userId, consentType } },
        data: { revokedAt: new Date() },
        select: { consentType: true, version: true, grantedAt: true, revokedAt: true },
      });

      return reply.send(updated);
    },
  );
}
