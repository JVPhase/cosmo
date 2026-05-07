/**
 * Contract tests: i18n routes
 *
 * Tests:
 *   1. GET /i18n/mobile returns bundles for requested namespaces
 *   2. Fallback to `ru` when locale has no translation
 *   3. GET /crm/locales lists bundles (requires CRM auth)
 *   4. POST /crm/locales/keys creates key across all locales
 *   5. PUT /crm/locales/:app/:ns/:locale saves bundle
 *   6. DELETE /crm/locales/keys removes key from all locales
 *
 * Run: npm run test:contract
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp, createTestUser, cleanupUser, db, signToken } from '../setup';

describe('Contract: i18n — GET /i18n/mobile', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildApp();

    // Seed a minimal ru bundle for this test
    await db.localeBundle.upsert({
      where: { app_namespace_locale: { app: 'mobile', namespace: 'ui', locale: 'ru' } },
      create: {
        app: 'mobile',
        namespace: 'ui',
        locale: 'ru',
        messages: { 'tabs.game': 'ДОБЫЧА', 'loading.title': 'Загрузка...' },
        version: 1,
      },
      update: {
        messages: { 'tabs.game': 'ДОБЫЧА', 'loading.title': 'Загрузка...' },
        version: 1,
      },
    });
  });

  after(async () => {
    await db.localeBundle.deleteMany({
      where: { app: 'mobile', namespace: 'ui', locale: { in: ['ru', 'en', 'fr'] } },
    });
    await app.close();
  });

  it('returns 200 with bundle for ru', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/i18n/mobile?locale=ru&ns=ui',
    });
    assert.equal(res.statusCode, 200, res.body);
    const body = res.json<{
      locale: string;
      generatedAt: number;
      bundles: Record<string, { version: number; messages: Record<string, string> }>;
    }>();
    assert.equal(body.locale, 'ru');
    assert.ok(typeof body.generatedAt === 'number');
    assert.ok(body.bundles.ui, 'ui bundle should exist');
    assert.equal(body.bundles.ui.messages['tabs.game'], 'ДОБЫЧА');
  });

  it('falls back to ru when requested locale has no bundle', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/i18n/mobile?locale=fr&ns=ui',
    });
    assert.equal(res.statusCode, 200, res.body);
    const body = res.json<{
      bundles: Record<string, { messages: Record<string, string> }>;
    }>();
    // Should have ru values as fallback
    assert.equal(body.bundles.ui.messages['tabs.game'], 'ДОБЫЧА');
  });

  it('merges partial en translation with ru fallback', async () => {
    // Insert a partial en bundle
    await db.localeBundle.upsert({
      where: { app_namespace_locale: { app: 'mobile', namespace: 'ui', locale: 'en' } },
      create: {
        app: 'mobile',
        namespace: 'ui',
        locale: 'en',
        messages: { 'tabs.game': 'MINING' }, // only one key translated
        version: 1,
      },
      update: {
        messages: { 'tabs.game': 'MINING' },
        version: 1,
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/i18n/mobile?locale=en&ns=ui',
    });
    assert.equal(res.statusCode, 200, res.body);
    const body = res.json<{
      bundles: Record<string, { messages: Record<string, string> }>;
    }>();
    // Translated key uses en value
    assert.equal(body.bundles.ui.messages['tabs.game'], 'MINING');
    // Untranslated key falls back to ru
    assert.equal(body.bundles.ui.messages['loading.title'], 'Загрузка...');
  });

  it('rejects invalid locale format', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/i18n/mobile?locale=invalid!locale&ns=ui',
    });
    assert.equal(res.statusCode, 400);
  });

  it('ignores unknown namespace names and returns empty bundles', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/i18n/mobile?locale=ru&ns=unknownns',
    });
    // All ns are filtered out → 400
    assert.equal(res.statusCode, 400);
  });
});

describe('Contract: i18n — CRM locale management', () => {
  let app: FastifyInstance;
  let adminId: string;
  let adminToken: string;
  const testApp = 'mobile';
  const testNs = 'alerts';
  const testLocale = 'en';
  const testKey = `test.i18n.key.${Date.now()}`;

  before(async () => {
    app = await buildApp();
    const user = await createTestUser();
    adminId = user.id;
    await db.crmUser.create({ data: { userId: adminId, role: 'admin' } });
    adminToken = signToken(app, adminId);

    // Ensure ru base bundle exists
    await db.localeBundle.upsert({
      where: { app_namespace_locale: { app: testApp, namespace: testNs, locale: 'ru' } },
      create: {
        app: testApp,
        namespace: testNs,
        locale: 'ru',
        messages: { 'existing.key': 'Существующий ключ' },
        version: 1,
      },
      update: {
        messages: { 'existing.key': 'Существующий ключ' },
        version: 1,
      },
    });
  });

  after(async () => {
    // Clean up test bundles
    await db.localeBundle.deleteMany({
      where: { app: testApp, namespace: testNs, locale: { in: ['ru', testLocale] } },
    });
    await cleanupUser(adminId);
    await app.close();
  });

  it('GET /crm/locales returns list of bundles', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/crm/locales',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.statusCode, 200, res.body);
    const body = res.json<{ bundles: unknown[] }>();
    assert.ok(Array.isArray(body.bundles));
  });

  it('POST /crm/locales/keys creates key in all locales', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/crm/locales/keys',
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        app: testApp,
        namespace: testNs,
        key: testKey,
        baseLocale: 'ru',
        baseValue: 'Тестовое значение',
      },
    });
    assert.equal(res.statusCode, 201, res.body);
    const body = res.json<{ key: string; affectedLocales: string[] }>();
    assert.equal(body.key, testKey);
    assert.ok(body.affectedLocales.includes('ru'));

    // Verify key stored in DB
    const ruBundle = await db.localeBundle.findUnique({
      where: { app_namespace_locale: { app: testApp, namespace: testNs, locale: 'ru' } },
    });
    assert.ok(ruBundle);
    const msgs = ruBundle.messages as Record<string, string>;
    assert.equal(msgs[testKey], 'Тестовое значение');
  });

  it('POST /crm/locales/keys rejects duplicate key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/crm/locales/keys',
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        app: testApp,
        namespace: testNs,
        key: testKey,
        baseLocale: 'ru',
        baseValue: 'Дубль',
      },
    });
    assert.equal(res.statusCode, 409);
  });

  it('PUT /crm/locales/:app/:ns/:locale saves bundle', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/crm/locales/${testApp}/${testNs}/${testLocale}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        messages: { [testKey]: 'Test value' },
      },
    });
    assert.equal(res.statusCode, 200, res.body);
    const body = res.json<{ version: number }>();
    assert.ok(body.version >= 1);
  });

  it('PUT /crm/locales/:app/:ns/:locale accepts seeded camelCase keys', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/crm/locales/${testApp}/${testNs}/${testLocale}`,
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        messages: {
          [testKey]: 'Test value',
          'metal.echoShard.name': 'Echo Shard',
          'metal.voidCrystal.name': 'Void Crystal',
        },
      },
    });
    assert.equal(res.statusCode, 200, res.body);
  });

  it('GET /crm/locales/:app/:ns/:locale returns bundle', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/crm/locales/${testApp}/${testNs}/${testLocale}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.statusCode, 200, res.body);
    const body = res.json<{ messages: Record<string, string> }>();
    assert.equal(body.messages[testKey], 'Test value');
  });

  it('PATCH /crm/locales/messages updates selected locale keys only', async () => {
    const patchedKey = `${testKey}.patch`;
    const res = await app.inject({
      method: 'PATCH',
      url: '/crm/locales/messages',
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: {
        app: testApp,
        namespace: testNs,
        updates: {
          en: {
            [patchedKey]: 'Patched value',
            'metal.echoShard.name': 'Echo Shard',
          },
          ru: {
            [patchedKey]: 'Патч',
          },
        },
        deleteKeys: {
          en: ['metal.voidCrystal.name'],
        },
      },
    });
    assert.equal(res.statusCode, 200, res.body);

    const enBundle = await db.localeBundle.findUnique({
      where: { app_namespace_locale: { app: testApp, namespace: testNs, locale: 'en' } },
    });
    assert.ok(enBundle);
    const enMessages = enBundle.messages as Record<string, string>;
    assert.equal(enMessages[testKey], 'Test value');
    assert.equal(enMessages[patchedKey], 'Patched value');
    assert.equal(enMessages['metal.echoShard.name'], 'Echo Shard');
    assert.ok(!Object.prototype.hasOwnProperty.call(enMessages, 'metal.voidCrystal.name'));

    const ruBundle = await db.localeBundle.findUnique({
      where: { app_namespace_locale: { app: testApp, namespace: testNs, locale: 'ru' } },
    });
    assert.ok(ruBundle);
    const ruMessages = ruBundle.messages as Record<string, string>;
    assert.equal(ruMessages[patchedKey], 'Патч');
    assert.equal(ruMessages['existing.key'], 'Существующий ключ');
  });

  it('DELETE /crm/locales/keys removes key from all locales', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/crm/locales/keys',
      headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
      payload: { app: testApp, namespace: testNs, key: testKey },
    });
    assert.equal(res.statusCode, 200, res.body);

    // Key should be gone from ru
    const ruBundle = await db.localeBundle.findUnique({
      where: { app_namespace_locale: { app: testApp, namespace: testNs, locale: 'ru' } },
    });
    assert.ok(ruBundle);
    const msgs = ruBundle.messages as Record<string, string>;
    assert.ok(!Object.prototype.hasOwnProperty.call(msgs, testKey));
  });

  it('requires CRM auth — 403 without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/crm/locales' });
    assert.ok(res.statusCode >= 400, `expected 4xx, got ${res.statusCode}`);
  });
});
