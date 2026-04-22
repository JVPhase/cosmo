import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';

const VALID_APPS = ['mobile', 'crm'] as const;
const VALID_NAMESPACES = ['ui', 'alerts', 'intro', 'story', 'dialogues', 'config'] as const;
const VALID_LOCALES = /^[a-z]{2}(-[A-Z]{2})?$/;
// Translation key: dot-separated segments of [a-z0-9_-], e.g. "tabs.game", "story.entry_01.text"
const VALID_KEY = /^[a-z0-9_.:-]{1,120}$/;
// Template variable placeholder like {count}, {name}
const PLACEHOLDER_RE = /\{[a-z_]+\}/g;

type Messages = Record<string, string | null>;

function asMessages(raw: unknown): Messages {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: Messages = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = typeof v === 'string' ? v : null;
  }
  return out;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function extractPlaceholders(text: string): Set<string> {
  return new Set(text.match(PLACEHOLDER_RE) ?? []);
}

/**
 * Validate that all non-empty translations share the same placeholder set
 * as the base locale value.
 */
function validatePlaceholderConsistency(
  baseValue: string,
  otherValues: string[],
): string | null {
  const basePH = extractPlaceholders(baseValue);
  if (basePH.size === 0) return null;
  for (const v of otherValues) {
    if (!v) continue;
    const vPH = extractPlaceholders(v);
    for (const ph of basePH) {
      if (!vPH.has(ph)) return `translation is missing placeholder ${ph}`;
    }
    for (const ph of vPH) {
      if (!basePH.has(ph)) return `translation has extra placeholder ${ph} not in base`;
    }
  }
  return null;
}

export function registerCrmLocaleRoutes(app: FastifyInstance) {
  /**
   * GET /crm/locales
   * List all bundles (metadata only, no messages).
   */
  app.get('/locales', async () => {
    const bundles = await prisma.localeBundle.findMany({
      select: {
        id: true,
        app: true,
        namespace: true,
        locale: true,
        version: true,
        updatedAt: true,
        messages: true,
      },
      orderBy: [{ app: 'asc' }, { namespace: 'asc' }, { locale: 'asc' }],
    });

    return {
      bundles: bundles.map((b) => {
        const msgs = asMessages(b.messages);
        const total = Object.keys(msgs).length;
        const translated = Object.values(msgs).filter((v) => v && v.trim()).length;
        return {
          id: b.id,
          app: b.app,
          namespace: b.namespace,
          locale: b.locale,
          version: b.version,
          updatedAt: b.updatedAt.toISOString(),
          keyCount: total,
          translatedCount: translated,
        };
      }),
    };
  });

  /**
   * GET /crm/locales/:app/:namespace/:locale
   * Full bundle with all messages.
   */
  app.get('/locales/:app/:namespace/:locale', async (req, reply) => {
    const { app: appParam, namespace, locale } = req.params as {
      app: string;
      namespace: string;
      locale: string;
    };

    const row = await prisma.localeBundle.findUnique({
      where: { app_namespace_locale: { app: appParam, namespace, locale } },
    });

    if (!row) {
      return reply.status(404).send({ error: 'bundle not found' });
    }

    return {
      id: row.id,
      app: row.app,
      namespace: row.namespace,
      locale: row.locale,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
      messages: asMessages(row.messages),
    };
  });

  /**
   * PUT /crm/locales/:app/:namespace/:locale
   * Replace the messages object wholesale (full bundle save).
   * Increments version.
   */
  app.put('/locales/:app/:namespace/:locale', async (req, reply) => {
    const { app: appParam, namespace, locale } = req.params as {
      app: string;
      namespace: string;
      locale: string;
    };

    if (!VALID_APPS.includes(appParam as (typeof VALID_APPS)[number])) {
      return reply.status(400).send({ error: `app must be one of: ${VALID_APPS.join(', ')}` });
    }
    if (!VALID_NAMESPACES.includes(namespace as (typeof VALID_NAMESPACES)[number])) {
      return reply.status(400).send({ error: `namespace must be one of: ${VALID_NAMESPACES.join(', ')}` });
    }
    if (!VALID_LOCALES.test(locale)) {
      return reply.status(400).send({ error: 'invalid locale format' });
    }

    const body = (req.body ?? {}) as { messages?: unknown };
    if (!isPlainObject(body.messages)) {
      return reply.status(400).send({ error: 'body.messages must be a JSON object' });
    }

    // Validate that all keys are valid
    for (const key of Object.keys(body.messages)) {
      if (!VALID_KEY.test(key)) {
        return reply.status(400).send({ error: `invalid key: "${key}"` });
      }
    }

    const row = await prisma.localeBundle.upsert({
      where: { app_namespace_locale: { app: appParam, namespace, locale } },
      create: { app: appParam, namespace, locale, messages: body.messages as object, version: 1 },
      update: { messages: body.messages as object, version: { increment: 1 } },
    });

    return {
      id: row.id,
      app: row.app,
      namespace: row.namespace,
      locale: row.locale,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  /**
   * POST /crm/locales/keys
   * Create a new translation key across all existing locales for the given app+namespace.
   * - Sets baseValue for baseLocale
   * - Sets "" (empty string) for all other locales
   * - Creates the bundle row if it doesn't exist yet
   * - Increments version on all affected bundles
   */
  app.post('/locales/keys', async (req, reply) => {
    const body = (req.body ?? {}) as {
      app?: unknown;
      namespace?: unknown;
      key?: unknown;
      baseLocale?: unknown;
      baseValue?: unknown;
    };

    const appVal = typeof body.app === 'string' ? body.app.trim() : '';
    const nsVal = typeof body.namespace === 'string' ? body.namespace.trim() : '';
    const key = typeof body.key === 'string' ? body.key.trim() : '';
    const baseLocale = typeof body.baseLocale === 'string' ? body.baseLocale.trim() : '';
    const baseValue = typeof body.baseValue === 'string' ? body.baseValue : '';

    if (!VALID_APPS.includes(appVal as (typeof VALID_APPS)[number])) {
      return reply.status(400).send({ error: `app must be one of: ${VALID_APPS.join(', ')}` });
    }
    if (!VALID_NAMESPACES.includes(nsVal as (typeof VALID_NAMESPACES)[number])) {
      return reply.status(400).send({ error: `namespace must be one of: ${VALID_NAMESPACES.join(', ')}` });
    }
    if (!VALID_KEY.test(key)) {
      return reply.status(400).send({ error: 'invalid key format (use lowercase dots/underscores, max 120 chars)' });
    }
    if (!VALID_LOCALES.test(baseLocale)) {
      return reply.status(400).send({ error: 'invalid baseLocale format' });
    }
    if (!baseValue) {
      return reply.status(400).send({ error: 'baseValue is required' });
    }

    // Find all existing bundles for this app+namespace
    const existingBundles = await prisma.localeBundle.findMany({
      where: { app: appVal, namespace: nsVal },
    });

    // Check key uniqueness across base locale
    const baseBundle = existingBundles.find((b) => b.locale === baseLocale);
    if (baseBundle) {
      const msgs = asMessages(baseBundle.messages);
      if (Object.prototype.hasOwnProperty.call(msgs, key)) {
        return reply.status(409).send({ error: `key "${key}" already exists in ${baseLocale}` });
      }
    }

    // Determine all locales to touch (existing + baseLocale if not yet present)
    const localesToTouch = new Set(existingBundles.map((b) => b.locale));
    localesToTouch.add(baseLocale);

    // Apply updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const locale of localesToTouch) {
        const value = locale === baseLocale ? baseValue : '';
        const existing = existingBundles.find((b) => b.locale === locale);

        if (existing) {
          const msgs = asMessages(existing.messages);
          msgs[key] = value;
          await tx.localeBundle.update({
            where: { id: existing.id },
            data: { messages: msgs as object, version: { increment: 1 } },
          });
        } else {
          await tx.localeBundle.create({
            data: {
              app: appVal,
              namespace: nsVal,
              locale,
              messages: { [key]: value } as object,
              version: 1,
            },
          });
        }
      }
    });

    return reply.status(201).send({
      key,
      app: appVal,
      namespace: nsVal,
      baseLocale,
      affectedLocales: [...localesToTouch],
    });
  });

  /**
   * PATCH /crm/locales/keys
   * Rename a key across all locales of an app+namespace.
   */
  app.patch('/locales/keys', async (req, reply) => {
    const body = (req.body ?? {}) as {
      app?: unknown;
      namespace?: unknown;
      oldKey?: unknown;
      newKey?: unknown;
    };

    const appVal = typeof body.app === 'string' ? body.app.trim() : '';
    const nsVal = typeof body.namespace === 'string' ? body.namespace.trim() : '';
    const oldKey = typeof body.oldKey === 'string' ? body.oldKey.trim() : '';
    const newKey = typeof body.newKey === 'string' ? body.newKey.trim() : '';

    if (!appVal || !nsVal) return reply.status(400).send({ error: 'app and namespace are required' });
    if (!VALID_KEY.test(oldKey)) return reply.status(400).send({ error: 'invalid oldKey' });
    if (!VALID_KEY.test(newKey)) return reply.status(400).send({ error: 'invalid newKey' });
    if (oldKey === newKey) return reply.status(400).send({ error: 'oldKey and newKey are the same' });

    const bundles = await prisma.localeBundle.findMany({
      where: { app: appVal, namespace: nsVal },
    });

    if (bundles.length === 0) {
      return reply.status(404).send({ error: 'no bundles found for app+namespace' });
    }

    await prisma.$transaction(async (tx) => {
      for (const bundle of bundles) {
        const msgs = asMessages(bundle.messages);
        if (!Object.prototype.hasOwnProperty.call(msgs, oldKey)) continue;
        msgs[newKey] = msgs[oldKey] ?? '';
        delete msgs[oldKey];
        await tx.localeBundle.update({
          where: { id: bundle.id },
          data: { messages: msgs as object, version: { increment: 1 } },
        });
      }
    });

    return { ok: true, oldKey, newKey, app: appVal, namespace: nsVal };
  });

  /**
   * DELETE /crm/locales/keys
   * Remove a key from all locale bundles for the given app+namespace.
   */
  app.delete('/locales/keys', async (req, reply) => {
    const body = (req.body ?? {}) as {
      app?: unknown;
      namespace?: unknown;
      key?: unknown;
    };

    const appVal = typeof body.app === 'string' ? body.app.trim() : '';
    const nsVal = typeof body.namespace === 'string' ? body.namespace.trim() : '';
    const key = typeof body.key === 'string' ? body.key.trim() : '';

    if (!appVal || !nsVal) return reply.status(400).send({ error: 'app and namespace are required' });
    if (!VALID_KEY.test(key)) return reply.status(400).send({ error: 'invalid key' });

    const bundles = await prisma.localeBundle.findMany({
      where: { app: appVal, namespace: nsVal },
    });

    if (bundles.length === 0) {
      return reply.status(404).send({ error: 'no bundles found' });
    }

    await prisma.$transaction(async (tx) => {
      for (const bundle of bundles) {
        const msgs = asMessages(bundle.messages);
        if (!Object.prototype.hasOwnProperty.call(msgs, key)) continue;
        delete msgs[key];
        await tx.localeBundle.update({
          where: { id: bundle.id },
          data: { messages: msgs as object, version: { increment: 1 } },
        });
      }
    });

    return reply.status(200).send({ ok: true, key, app: appVal, namespace: nsVal });
  });
}
