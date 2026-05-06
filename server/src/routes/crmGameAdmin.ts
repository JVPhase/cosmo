import type { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { listGameConfigKeys } from './config';
import { validateGameplayEnvelope } from '../lib/saveEnvelope';

const STARS_SHOP_TYPES = [
  'currency_pack',
  'metal_pack',
  'booster',
  'premium_unlock',
] as const;

const DELIVERY_MODES = ['grant_sync', 'unsupported', 'server_only'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  return value.trim();
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readRequiredInt(value: unknown, min = 0): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min)
    return null;
  return value;
}

function readNullableInt(value: unknown, min = 0): number | null | undefined {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min)
    return undefined;
  return value;
}

function validateStarsShopMetadata(
  type: string,
  metadata: Record<string, unknown>,
): string | null {
  const deliveryMode = metadata.deliveryMode;
  if (
    typeof deliveryMode !== 'string' ||
    !DELIVERY_MODES.includes(deliveryMode as (typeof DELIVERY_MODES)[number])
  ) {
    return 'metadata.deliveryMode must be one of: grant_sync, unsupported, server_only';
  }

  switch (type) {
    case 'currency_pack': {
      const creditAmount = metadata.creditAmount;
      if (
        typeof creditAmount !== 'number' ||
        !Number.isInteger(creditAmount) ||
        creditAmount <= 0
      ) {
        return 'currency_pack requires metadata.creditAmount > 0';
      }
      return null;
    }

    case 'metal_pack': {
      const metalId = metadata.metalId;
      const quantity = metadata.quantity;
      if (typeof metalId !== 'string' || metalId.trim() === '') {
        return 'metal_pack requires metadata.metalId';
      }
      if (
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return 'metal_pack requires metadata.quantity > 0';
      }
      return null;
    }

    case 'booster': {
      const effectType = metadata.effectType;
      const durationMs = metadata.durationMs;
      const multiplier = metadata.multiplier;
      const bonus = metadata.bonus;

      if (typeof effectType !== 'string' || effectType.trim() === '') {
        return 'booster requires metadata.effectType';
      }
      if (
        typeof durationMs !== 'number' ||
        !Number.isInteger(durationMs) ||
        durationMs <= 0
      ) {
        return 'booster requires metadata.durationMs > 0';
      }
      const hasMultiplier =
        typeof multiplier === 'number' && Number.isFinite(multiplier);
      const hasBonus = typeof bonus === 'number' && Number.isFinite(bonus);
      if (!hasMultiplier && !hasBonus) {
        return 'booster requires metadata.multiplier or metadata.bonus';
      }
      return null;
    }

    case 'premium_unlock': {
      const effect = metadata.effect;
      if (typeof effect !== 'string' || effect.trim() === '') {
        return 'premium_unlock requires metadata.effect';
      }
      if (deliveryMode === 'grant_sync') {
        return 'premium_unlock cannot use deliveryMode=grant_sync in the current mobile flow';
      }
      return null;
    }

    default:
      return `Unsupported shop item type: ${type}`;
  }
}

type StarsShopItemInput = {
  id: string;
  type: string;
  name: string;
  description: string;
  priceStars: number;
  priceCredits: number | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
};

function parseStarsShopItemInput(
  body: unknown,
  opts: { requireId: boolean; id?: string },
): { ok: true; data: StarsShopItemInput } | { ok: false; error: string } {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'body must be an object' };
  }

  const id = opts.requireId ? readNonEmptyString(body.id) : (opts.id ?? '');
  if (!id) return { ok: false, error: 'id is required' };

  const type = readNonEmptyString(body.type);
  if (
    !type ||
    !STARS_SHOP_TYPES.includes(type as (typeof STARS_SHOP_TYPES)[number])
  ) {
    return {
      ok: false,
      error: `type must be one of: ${STARS_SHOP_TYPES.join(', ')}`,
    };
  }

  const name = readNonEmptyString(body.name);
  if (!name) return { ok: false, error: 'name is required' };

  const description = readNonEmptyString(body.description);
  if (!description) return { ok: false, error: 'description is required' };

  const priceStars = readRequiredInt(body.priceStars, 1);
  if (priceStars === null) {
    return { ok: false, error: 'priceStars must be a positive integer' };
  }

  const priceCredits = readNullableInt(body.priceCredits, 0);
  if (priceCredits === undefined) {
    return {
      ok: false,
      error: 'priceCredits must be null or a non-negative integer',
    };
  }

  const sortOrder = readRequiredInt(body.sortOrder, 0);
  if (sortOrder === null) {
    return { ok: false, error: 'sortOrder must be a non-negative integer' };
  }

  if (!isPlainObject(body.metadata)) {
    return { ok: false, error: 'metadata must be a JSON object' };
  }

  const metadata = body.metadata;
  const metadataError = validateStarsShopMetadata(type, metadata);
  if (metadataError) {
    return { ok: false, error: metadataError };
  }

  return {
    ok: true,
    data: {
      id,
      type,
      name,
      description,
      priceStars,
      priceCredits,
      metadata,
      isActive: readBoolean(body.isActive, true),
      sortOrder,
    },
  };
}

const CONFIG_KEY_HINTS: Record<string, string> = {
  formulaConstants: 'Формулы и константы прогрессии',
  upgrades: 'Апгрейды клика / пассива',
  sectors: 'Сектора, зоны, планеты (карта)',
  expeditions: 'Экспедиции',
  shop: 'Магазин и металл-тиры',
  research: 'Исследования',
  player: 'XP, макс. уровень',
  modules: 'Модули корабля',
  cannons: 'Пушки',
  metals: 'Таблица дропа металлов',
  ships: 'Корабли',
  aliens: 'Чужие / бои',
  achievements: 'Ачивки и награды за claim',
  planets: 'Оверрайды планет и темы зон',
};

export function registerCrmGameAdminRoutes(app: FastifyInstance) {
  app.get('/dialogues', async (_req, reply) => {
    const row = await prisma.gameConfig.findUnique({
      where: { key: 'dialogues' },
    });
    if (!row) return reply.status(404).send({ error: 'dialogues_not_seeded' });
    return {
      key: row.key,
      data: row.data,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  app.put('/dialogues', async (req, reply) => {
    const body = (req.body ?? {}) as { data?: unknown };
    if (body.data === undefined) {
      return reply.status(400).send({ error: 'body.data is required' });
    }
    const row = await prisma.gameConfig.upsert({
      where: { key: 'dialogues' },
      create: { key: 'dialogues', data: body.data as object, version: 1 },
      update: { data: body.data as object, version: { increment: 1 } },
    });
    return {
      key: row.key,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  app.get('/game-config/keys', async () => {
    const keys = listGameConfigKeys();
    const rows = await prisma.gameConfig.findMany({
      select: { key: true, updatedAt: true, version: true },
    });
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
    return {
      keys: keys.map((key) => ({
        key,
        hint: CONFIG_KEY_HINTS[key] ?? '',
        overridden: Boolean(byKey[key]),
        updatedAt: byKey[key]?.updatedAt.toISOString() ?? null,
        version: byKey[key]?.version ?? null,
      })),
    };
  });

  app.get('/game-config/:key', async (req, reply) => {
    const { key } = req.params as { key: string };
    if (!listGameConfigKeys().includes(key)) {
      return reply.status(404).send({ error: 'unknown config key' });
    }
    const row = await prisma.gameConfig.findUnique({ where: { key } });
    return {
      key,
      overridden: Boolean(row),
      data: row?.data ?? null,
      version: row?.version ?? null,
      updatedAt: row?.updatedAt.toISOString() ?? null,
    };
  });

  app.put('/game-config/:key', async (req, reply) => {
    const { key } = req.params as { key: string };
    if (!listGameConfigKeys().includes(key)) {
      return reply.status(404).send({ error: 'unknown config key' });
    }
    const body = (req.body ?? {}) as { data?: unknown };
    if (body.data === undefined) {
      return reply.status(400).send({ error: 'body.data is required' });
    }
    const row = await prisma.gameConfig.upsert({
      where: { key },
      create: { key, data: body.data as object, version: 1 },
      update: { data: body.data as object, version: { increment: 1 } },
    });
    return {
      key: row.key,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  app.delete('/game-config/:key', async (req, reply) => {
    const { key } = req.params as { key: string };
    if (!listGameConfigKeys().includes(key)) {
      return reply.status(404).send({ error: 'unknown config key' });
    }
    const result = await prisma.gameConfig.deleteMany({ where: { key } });
    if (result.count === 0) {
      return reply
        .status(404)
        .send({ error: 'no override stored for this key' });
    }
    return reply.status(204).send();
  });

  app.get('/stars-shop/items', async () => {
    const items = await prisma.shopItem.findMany({
      where: { priceStars: { not: null } },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        priceStars: true,
        priceCredits: true,
        metadata: true,
        isActive: true,
        sortOrder: true,
        updatedAt: true,
      },
    });

    return {
      items: items.map((item) => {
        const metadata = (item.metadata as Record<string, unknown>) ?? {};
        return {
          ...item,
          deliveryMode:
            typeof metadata.deliveryMode === 'string'
              ? metadata.deliveryMode
              : null,
          updatedAt: item.updatedAt.toISOString(),
        };
      }),
    };
  });

  app.get('/stars-shop/items/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = await prisma.shopItem.findUnique({ where: { id } });
    if (!item || item.priceStars === null) {
      return reply.status(404).send({ error: 'stars shop item not found' });
    }
    return {
      ...item,
      metadata: (item.metadata as Record<string, unknown>) ?? {},
      updatedAt: item.updatedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    };
  });

  app.post('/stars-shop/items', async (req, reply) => {
    const parsed = parseStarsShopItemInput(req.body, { requireId: true });
    if (!parsed.ok) {
      return reply.status(400).send({ error: parsed.error });
    }

    const existing = await prisma.shopItem.findUnique({
      where: { id: parsed.data.id },
    });
    if (existing) {
      return reply
        .status(409)
        .send({ error: 'shop item with this id already exists' });
    }

    const created = await prisma.shopItem.create({
      data: {
        ...parsed.data,
        metadata: parsed.data.metadata as Prisma.InputJsonValue,
      },
    });

    return reply.status(201).send({
      ...created,
      metadata: (created.metadata as Record<string, unknown>) ?? {},
      updatedAt: created.updatedAt.toISOString(),
      createdAt: created.createdAt.toISOString(),
    });
  });

  app.put('/stars-shop/items/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.shopItem.findUnique({ where: { id } });
    if (!existing || existing.priceStars === null) {
      return reply.status(404).send({ error: 'stars shop item not found' });
    }

    const parsed = parseStarsShopItemInput(req.body, { requireId: false, id });
    if (!parsed.ok) {
      return reply.status(400).send({ error: parsed.error });
    }

    const updated = await prisma.shopItem.update({
      where: { id },
      data: {
        ...parsed.data,
        metadata: parsed.data.metadata as Prisma.InputJsonValue,
      },
    });

    return {
      ...updated,
      metadata: (updated.metadata as Record<string, unknown>) ?? {},
      updatedAt: updated.updatedAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    };
  });

  app.get('/players/search', async (req, reply) => {
    const q = (req.query as { q?: string }).q?.trim() ?? '';
    const limitRaw = (req.query as { limit?: string }).limit;
    const limit = Math.min(
      50,
      Math.max(1, parseInt(limitRaw ?? '20', 10) || 20),
    );

    if (q.length < 2) {
      return reply
        .status(400)
        .send({ error: 'query q must be at least 2 characters' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { telegramUser: { username: { contains: q, mode: 'insensitive' } } },
          { id: { startsWith: q } },
        ],
      },
      take: limit,
      select: {
        id: true,
        email: true,
        createdAt: true,
        telegramUser: { select: { username: true, telegramId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      users: users.map((u) => ({
        ...u,
        telegramUser: u.telegramUser
          ? {
              username: u.telegramUser.username,
              telegramId: u.telegramUser.telegramId.toString(),
            }
          : null,
      })),
    };
  });

  app.get('/players/:userId/game-state', async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        telegramUser: { select: { username: true, telegramId: true } },
      },
    });
    if (!user) return reply.status(404).send({ error: 'user not found' });

    const userOut = {
      ...user,
      telegramUser: user.telegramUser
        ? {
            username: user.telegramUser.username,
            telegramId: user.telegramUser.telegramId.toString(),
          }
        : null,
    };

    const [userSave, gameplaySave, wallet] = await Promise.all([
      prisma.userSave.findUnique({ where: { userId } }),
      prisma.gameplaySave.findUnique({ where: { userId } }),
      prisma.wallet.findUnique({ where: { userId } }),
    ]);

    return {
      user: userOut,
      userSave: userSave
        ? {
            data: userSave.data,
            rev: userSave.rev,
            updatedAt: userSave.updatedAt.toISOString(),
          }
        : null,
      gameplaySave: gameplaySave
        ? {
            data: gameplaySave.data,
            rev: gameplaySave.rev,
            updatedAt: gameplaySave.updatedAt.toISOString(),
          }
        : null,
      wallet: wallet
        ? {
            credits: wallet.credits.toString(),
            updatedAt: wallet.updatedAt.toISOString(),
          }
        : null,
    };
  });

  app.put('/players/:userId/user-save', async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const exists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) return reply.status(404).send({ error: 'user not found' });

    const body = (req.body ?? {}) as { data?: unknown };
    const v = validateGameplayEnvelope(body.data);
    if (!v.ok) return reply.status(400).send({ error: v.reason });

    const existing = await prisma.userSave.findUnique({ where: { userId } });
    const nextRev = (existing?.rev ?? 0) + 1;
    const save = await prisma.userSave.upsert({
      where: { userId },
      create: { userId, data: body.data as object, rev: nextRev },
      update: { data: body.data as object, rev: nextRev },
    });
    return { rev: save.rev, updatedAt: save.updatedAt.toISOString() };
  });

  app.put('/players/:userId/gameplay-save', async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const exists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) return reply.status(404).send({ error: 'user not found' });

    const body = (req.body ?? {}) as { data?: unknown };
    const v = validateGameplayEnvelope(body.data);
    if (!v.ok) return reply.status(400).send({ error: v.reason });

    const existing = await prisma.gameplaySave.findUnique({
      where: { userId },
    });
    const nextRev = (existing?.rev ?? 0) + 1;
    const save = await prisma.gameplaySave.upsert({
      where: { userId },
      create: { userId, data: body.data as object, rev: nextRev },
      update: { data: body.data as object, rev: nextRev },
    });
    return { rev: save.rev, updatedAt: save.updatedAt.toISOString() };
  });

  app.put('/players/:userId/wallet', async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const exists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) return reply.status(404).send({ error: 'user not found' });

    const body = (req.body ?? {}) as { credits?: unknown };
    const raw = body.credits;
    if (typeof raw !== 'number' && typeof raw !== 'string') {
      return reply
        .status(400)
        .send({ error: 'credits must be a number or numeric string' });
    }
    const n = BigInt(String(Math.trunc(Number(raw))));
    if (n < 0n)
      return reply.status(400).send({ error: 'credits must be non-negative' });

    const w = await prisma.wallet.upsert({
      where: { userId },
      create: { userId, credits: n },
      update: { credits: n },
    });
    return {
      credits: w.credits.toString(),
      updatedAt: w.updatedAt.toISOString(),
    };
  });
}
