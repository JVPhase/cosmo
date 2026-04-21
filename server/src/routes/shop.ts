/**
 * Public shop routes:
 *   GET /shop/iap-packs  — IAP pack catalog (rewarded-ad + Apple/Google IAP)
 *
 * Unauthenticated — catalog is public; no sensitive data exposed.
 */
import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';

export async function shopRoutes(app: FastifyInstance) {
  /**
   * GET /shop/iap-packs
   * Returns active IAP packs ordered by sortOrder.
   * The `name` and `lore` fields are i18n keys resolved client-side
   * via the `config` namespace (e.g. t('config.iap_pack.credits_ad.name')).
   */
  app.get('/iap-packs', async (_req, reply) => {
    const packs = await prisma.iapPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        kind: true,
        icon: true,
        credits: true,
        name: true,
        lore: true,
        productId: true,
        basePrice: true,
      },
    });

    reply.header('Cache-Control', 'public, max-age=300');
    return { packs };
  });
}
