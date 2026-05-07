import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';

const CONFIG_KEYS = [
  'formulaConstants',
  'upgrades',
  'sectors',
  'expeditions',
  'shop',
  'research',
  'player',
  'modules',
  'cannons',
  'metals',
  'ships',
  'aliens',
  'achievements',
  'planets',
] as const;

/** Keys managed via GameConfig / CRM admin. */
export function listGameConfigKeys(): string[] {
  return [...CONFIG_KEYS];
}

async function buildConfigPayload() {
  const rows = await prisma.gameConfig.findMany({
    where: { key: { in: [...CONFIG_KEYS] } },
  });
  const db: Record<string, unknown> = Object.fromEntries(rows.map((r) => [r.key, r.data]));

  const missing = (CONFIG_KEYS as readonly string[]).filter((k) => !(k in db));
  if (missing.length > 0) {
    throw new Error(
      `Missing game config keys in DB: ${missing.join(', ')}. Run: pnpm prisma db seed`,
    );
  }

  const payload = {
    version: 1,
    monetizationEnabled: process.env.MONETIZATION_ENABLED !== 'false',
    formulaConstants: db['formulaConstants'],
    upgrades: db['upgrades'],
    sectors: db['sectors'],
    expeditions: db['expeditions'],
    shop: db['shop'],
    research: db['research'],
    player: db['player'],
    modules: db['modules'],
    cannons: db['cannons'],
    metals: db['metals'],
    ships: db['ships'],
    aliens: db['aliens'],
    achievements: db['achievements'],
    planets: db['planets'],
  };
  const generatedAt = parseInt(
    crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12),
    16,
  );
  return { ...payload, generatedAt };
}

export async function configRoutes(app: FastifyInstance) {
  app.get('/config', async (_req, reply) => {
    reply.header('Cache-Control', 'no-cache');
    return buildConfigPayload();
  });

  app.get('/health', async () => ({ status: 'ok' }));
}
