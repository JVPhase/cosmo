/**
 * Fastify app factory for contract tests.
 * Builds a fully wired app without calling app.listen().
 * Inject() can be called immediately after buildApp() resolves.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { jwtPlugin } from '../../src/plugins/jwt';
import { configRoutes } from '../../src/routes/config';
import { crmRoutes } from '../../src/routes/crm';
import { savesRoutes } from '../../src/routes/saves';
import { telegramRoutes } from '../../src/routes/telegram';
import { syncRoutes } from '../../src/routes/sync';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  // High rate limit so tests never get throttled
  await app.register(rateLimit, { max: 100_000, timeWindow: '1 minute' });
  await app.register(jwtPlugin);
  await app.register(configRoutes);
  await app.register(crmRoutes, { prefix: '/crm' });
  await app.register(savesRoutes, { prefix: '/saves' });
  await app.register(telegramRoutes, { prefix: '/telegram' });
  await app.register(syncRoutes, { prefix: '/sync' });
  await app.ready();
  return app;
}
