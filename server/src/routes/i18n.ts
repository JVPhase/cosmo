import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';

const FALLBACK_LOCALE = 'ru';
const VALID_APPS = ['mobile', 'crm'] as const;
const VALID_NAMESPACES = ['ui', 'alerts', 'intro', 'story', 'dialogues', 'config'] as const;
const VALID_LOCALES = /^[a-z]{2}(-[A-Z]{2})?$/;

type Messages = Record<string, string>;

/**
 * Merge fallback and target bundles.
 * Keys present in `target` take priority; remaining keys from `fallback` fill the gaps.
 */
function mergeFallback(fallback: Messages, target: Messages): Messages {
  return { ...fallback, ...target };
}

function asMessages(raw: unknown): Messages {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: Messages = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

export async function i18nRoutes(app: FastifyInstance) {
  /**
   * GET /i18n/mobile?locale=ru&ns=ui,alerts
   *
   * Returns bundles for the requested namespaces.
   * Applies fallback: target → ru → empty.
   * No authentication required — public read-only.
   */
  app.get('/i18n/mobile', async (req, reply) => {
    const query = req.query as { locale?: string; ns?: string };
    const locale = (query.locale ?? FALLBACK_LOCALE).trim().toLowerCase();
    const nsParam = (query.ns ?? '').trim();

    if (!VALID_LOCALES.test(locale)) {
      return reply.status(400).send({ error: 'invalid locale format' });
    }

    const requestedNs = nsParam
      ? nsParam
          .split(',')
          .map((n) => n.trim())
          .filter((n) => VALID_NAMESPACES.includes(n as (typeof VALID_NAMESPACES)[number]))
      : [...VALID_NAMESPACES];

    if (requestedNs.length === 0) {
      return reply.status(400).send({ error: 'no valid namespaces requested' });
    }

    // Fetch both fallback (ru) and requested locale in a single query
    const localesToFetch = locale === FALLBACK_LOCALE ? [FALLBACK_LOCALE] : [FALLBACK_LOCALE, locale];

    const rows = await prisma.localeBundle.findMany({
      where: {
        app: 'mobile',
        namespace: { in: requestedNs },
        locale: { in: localesToFetch },
      },
      select: { namespace: true, locale: true, messages: true, version: true },
    });

    // Index by namespace+locale
    const index = new Map<string, { messages: Messages; version: number }>();
    for (const row of rows) {
      index.set(`${row.namespace}:${row.locale}`, {
        messages: asMessages(row.messages),
        version: row.version,
      });
    }

    // Build response bundles with fallback applied
    const bundles: Record<string, { version: number; messages: Messages }> = {};
    for (const ns of requestedNs) {
      const fallbackBundle = index.get(`${ns}:${FALLBACK_LOCALE}`);
      const targetBundle = locale !== FALLBACK_LOCALE ? index.get(`${ns}:${locale}`) : undefined;

      const fallbackMessages = fallbackBundle?.messages ?? {};
      const targetMessages = targetBundle?.messages ?? {};

      bundles[ns] = {
        version: targetBundle?.version ?? fallbackBundle?.version ?? 0,
        messages: locale === FALLBACK_LOCALE ? fallbackMessages : mergeFallback(fallbackMessages, targetMessages),
      };
    }

    reply.header('Cache-Control', 'public, max-age=300');
    return {
      locale,
      generatedAt: Date.now(),
      bundles,
    };
  });

  /**
   * GET /i18n/mobile/locales
   *
   * Lists available locale codes for mobile.
   * Used by clients to discover supported locales.
   */
  app.get('/i18n/mobile/locales', async (_req, reply) => {
    const rows = await prisma.localeBundle.findMany({
      where: { app: 'mobile' },
      select: { locale: true },
      distinct: ['locale'],
    });
    reply.header('Cache-Control', 'public, max-age=3600');
    return { locales: rows.map((r) => r.locale) };
  });
}
