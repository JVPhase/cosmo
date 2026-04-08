/**
 * Telegram Mini App routes:
 *   POST /telegram/auth          — validate initData, create/find user, return JWT
 *   GET  /telegram/me            — profile + game summary for the current TG user
 *   GET  /telegram/shop          — shop catalog (Stars prices)
 *   POST /telegram/shop/invoice  — create a Stars invoice link
 *   POST /telegram/shop/buy-credits — spend in-game credits on a shop item
 *   GET  /telegram/inventory     — current user's owned items
 *   POST /telegram/webhook       — Telegram bot webhook (pre_checkout + successful_payment)
 */
import type { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import { issueTokens } from '../lib/tokens';
import type { JwtPayload } from '../plugins/jwt';
import {
  validateInitData,
  createStarsInvoiceLink,
  answerPreCheckoutQuery,
  verifyWebhookSecret,
} from '../lib/telegram';
import { fulfillPurchase, failPurchase } from '../lib/fulfillment';
import { getUserInventory } from '../lib/inventory';

// ── helpers ───────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} environment variable is required`);
  return v;
}

// ── routes ────────────────────────────────────────────────────────────────────

export async function telegramRoutes(app: FastifyInstance) {
  /**
   * POST /telegram/auth
   * Body: { initData: string }
   *
   * Validates Telegram Mini App initData on the server (HMAC-SHA256).
   * Creates a new User + TelegramUser row on first login, updates on subsequent.
   * Returns { accessToken, refreshToken, userId, isNewUser }.
   */
  app.post(
    '/auth',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { initData } = (req.body ?? {}) as { initData?: unknown };
      if (typeof initData !== 'string' || !initData) {
        return reply.status(400).send({ error: 'initData is required' });
      }

      const botToken = requireEnv('TELEGRAM_BOT_TOKEN');

      let parsed;
      try {
        parsed = validateInitData(initData, botToken);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid initData';
        return reply.status(401).send({ error: message });
      }

      if (!parsed.user?.id) {
        return reply.status(400).send({ error: 'initData contains no user' });
      }

      const tgId = BigInt(parsed.user.id);

      // Find or create user record
      let telegramUser = await prisma.telegramUser.findUnique({
        where: { telegramId: tgId },
        include: { user: true },
      });

      let isNewUser = false;

      if (!telegramUser) {
        // First login — create User + TelegramUser atomically
        const newUser = await prisma.user.create({
          data: {
            // No email for Telegram-only accounts
            telegramUser: {
              create: {
                telegramId: tgId,
                firstName: parsed.user.first_name,
                lastName: parsed.user.last_name ?? null,
                username: parsed.user.username ?? null,
                photoUrl: parsed.user.photo_url ?? null,
                languageCode: parsed.user.language_code ?? null,
                isPremium: parsed.user.is_premium ?? false,
              },
            },
          },
          include: { telegramUser: true },
        });
        telegramUser = newUser.telegramUser!;
        (telegramUser as typeof telegramUser & { user: typeof newUser }).user = newUser;
        isNewUser = true;
      } else {
        // Update mutable profile fields (name, username can change in Telegram)
        await prisma.telegramUser.update({
          where: { telegramId: tgId },
          data: {
            firstName: parsed.user.first_name,
            lastName: parsed.user.last_name ?? null,
            username: parsed.user.username ?? null,
            photoUrl: parsed.user.photo_url ?? null,
            isPremium: parsed.user.is_premium ?? false,
          },
        });
      }

      const userId = telegramUser.userId;
      const tokens = await issueTokens(app, userId);

      return reply.status(isNewUser ? 201 : 200).send({
        ...tokens,
        userId,
        isNewUser,
      });
    },
  );

  /**
   * GET /telegram/me
   * Returns the Telegram user's profile and a summary of their game save.
   */
  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as JwtPayload;

    const [tgUser, save] = await Promise.all([
      prisma.telegramUser.findUnique({ where: { userId } }),
      prisma.userSave.findUnique({ where: { userId } }),
    ]);

    if (!tgUser) {
      return reply.status(404).send({ error: 'Not a Telegram account' });
    }

    // Extract lightweight game summary without sending the entire save blob
    const saveData = (save?.data ?? {}) as Record<string, unknown>;
    const gameSummary = {
      playerXP: (saveData.playerXP as number) ?? 0,
      totalEarned: (saveData.totalEarned as string) ?? '0',
      credits: (saveData.credits as number) ?? 0,
      unlockedPlanets: ((saveData.unlockedPlanetIds as string[]) ?? []).length,
      saveRev: save?.rev ?? 0,
    };

    return {
      telegramId: tgUser.telegramId.toString(),
      firstName: tgUser.firstName,
      lastName: tgUser.lastName,
      username: tgUser.username,
      photoUrl: tgUser.photoUrl,
      isPremium: tgUser.isPremium,
      gameSummary,
    };
  });

  /**
   * GET /telegram/shop
   * Returns active shop items. Unauthenticated — catalog is public.
   */
  app.get('/shop', async (_req, reply) => {
    const items = await prisma.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { type: 'asc' }],
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        priceStars: true,
        priceCredits: true,
        metadata: true,
      },
    });

    reply.header('Cache-Control', 'public, max-age=300');
    return { items };
  });

  /**
   * POST /telegram/shop/invoice
   * Body: { shopItemId: string }
   *
   * Creates a pending Purchase record and returns a Telegram Stars invoice URL.
   * The frontend passes this URL to WebApp.openInvoice().
   */
  app.post('/shop/invoice', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as JwtPayload;
    const { shopItemId } = (req.body ?? {}) as { shopItemId?: unknown };

    if (typeof shopItemId !== 'string') {
      return reply.status(400).send({ error: 'shopItemId is required' });
    }

    const item = await prisma.shopItem.findUnique({ where: { id: shopItemId, isActive: true } });
    if (!item) return reply.status(404).send({ error: 'Shop item not found' });
    if (!item.priceStars) {
      return reply.status(400).send({ error: 'Item is not available for Stars purchase' });
    }

    // Create a pending purchase — fulfilled on successful_payment webhook
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        shopItemId,
        paymentMethod: 'stars',
        starsAmount: item.priceStars,
        status: 'pending',
        metadata: { initiatedAt: new Date().toISOString() },
      },
    });

    const botToken = requireEnv('TELEGRAM_BOT_TOKEN');
    let invoiceUrl: string;
    try {
      invoiceUrl = await createStarsInvoiceLink(botToken, {
        title: item.name,
        description: item.description,
        // Payload is the purchase ID — we resolve it in the webhook
        payload: purchase.id,
        priceStars: item.priceStars,
      });
    } catch (err: unknown) {
      // Roll back the pending purchase so we don't accumulate orphans
      await prisma.purchase.delete({ where: { id: purchase.id } });
      const msg = err instanceof Error ? err.message : 'Failed to create invoice';
      return reply.status(502).send({ error: msg });
    }

    return { invoiceUrl, purchaseId: purchase.id };
  });

  /**
   * POST /telegram/shop/buy-credits
   * Body: { shopItemId: string }
   *
   * Purchases an item using in-game credits. Deducts credits from the save,
   * fulfils the purchase, and returns updated inventory.
   */
  app.post('/shop/buy-credits', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { userId } = req.user as JwtPayload;
    const { shopItemId } = (req.body ?? {}) as { shopItemId?: unknown };

    if (typeof shopItemId !== 'string') {
      return reply.status(400).send({ error: 'shopItemId is required' });
    }

    const item = await prisma.shopItem.findUnique({ where: { id: shopItemId, isActive: true } });
    if (!item) return reply.status(404).send({ error: 'Shop item not found' });
    if (!item.priceCredits) {
      return reply.status(400).send({ error: 'Item is not available for credits purchase' });
    }

    // Atomic credit deduction + purchase record creation
    const save = await prisma.userSave.findUnique({ where: { userId } });
    const saveData = (save?.data ?? {}) as Record<string, unknown>;
    const currentCredits = (saveData.credits as number) ?? 0;

    if (currentCredits < item.priceCredits) {
      return reply.status(402).send({ error: 'Insufficient credits' });
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const newCredits = currentCredits - item.priceCredits!;
      const newRev = (save?.rev ?? 0) + 1;

      if (save) {
        await tx.userSave.update({
          where: { userId },
          data: {
            data: { ...(saveData as object), credits: newCredits },
            rev: newRev,
          },
        });
      } else {
        await tx.userSave.create({
          data: { userId, data: { credits: newCredits }, rev: newRev },
        });
      }

      return tx.purchase.create({
        data: {
          userId,
          shopItemId,
          paymentMethod: 'credits',
          creditsAmount: item.priceCredits,
          status: 'pending',
        },
      });
    });

    const result = await fulfillPurchase(purchase.id);
    if (!result.ok) {
      return reply.status(500).send({ error: result.reason });
    }

    const inventory = await getUserInventory(userId);
    return { ok: true, inventory };
  });

  /**
   * GET /telegram/purchase/:purchaseId/result
   * Returns the completed purchase record including server-rolled results.
   *
   * For loot_box: metadata contains { rolledMetals: {...} }
   * For premium_unlock: metadata contains { appliedPlanets? } or { energyRefund?, nodesReset? }
   *
   * Polls up to 5 s if the purchase is still pending (webhook may not have fired yet).
   */
  app.get(
    '/purchase/:purchaseId/result',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { userId } = req.user as JwtPayload;
      const { purchaseId } = req.params as { purchaseId: string };

      // Wait up to 5 seconds for webhook fulfillment
      let purchase = null;
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        purchase = await prisma.purchase.findUnique({
          where: { id: purchaseId },
          include: { shopItem: true },
        });
        if (!purchase) break;
        if (purchase.status === 'completed') break;
        if (purchase.status === 'failed' || purchase.status === 'refunded') break;
        // Still pending — wait 500 ms and retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!purchase) return reply.status(404).send({ error: 'Purchase not found' });
      if (purchase.userId !== userId) return reply.status(403).send({ error: 'Forbidden' });

      return {
        purchaseId: purchase.id,
        status: purchase.status,
        type: purchase.shopItem.type,
        shopItemId: purchase.shopItemId,
        metadata: (purchase.metadata as Record<string, unknown>) ?? {},
        itemMetadata: (purchase.shopItem.metadata as Record<string, unknown>) ?? {},
      };
    },
  );

  /**
   * GET /telegram/inventory
   * Returns the authenticated user's owned items.
   */
  app.get('/inventory', { preHandler: [app.authenticate] }, async (req) => {
    const { userId } = req.user as JwtPayload;
    const inventory = await getUserInventory(userId);
    return { inventory };
  });

  /**
   * POST /telegram/webhook
   * Telegram bot webhook — receives pre_checkout_query and successful_payment updates.
   *
   * Security: verified via X-Telegram-Bot-Api-Secret-Token header.
   * Register webhook: POST https://api.telegram.org/bot<TOKEN>/setWebhook
   *   { "url": "https://your-server/telegram/webhook",
   *     "secret_token": "<TELEGRAM_WEBHOOK_SECRET>" }
   */
  app.post('/webhook', async (req, reply) => {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
    const headerSecret = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;

    if (webhookSecret && !verifyWebhookSecret(headerSecret, webhookSecret)) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const update = req.body as TelegramUpdate;
    const botToken = requireEnv('TELEGRAM_BOT_TOKEN');

    // ── pre_checkout_query — must respond within 10 seconds ──────────────────
    if (update.pre_checkout_query) {
      const pcq = update.pre_checkout_query;
      const purchaseId = pcq.invoice_payload;

      const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });

      if (!purchase || purchase.status !== 'pending') {
        // Reject — order no longer valid
        await answerPreCheckoutQuery(botToken, pcq.id, false, 'Order expired or invalid');
      } else {
        await answerPreCheckoutQuery(botToken, pcq.id, true);
      }

      return reply.status(200).send({ ok: true });
    }

    // ── successful_payment — fulfill the purchase ─────────────────────────────
    if (update.message?.successful_payment) {
      const sp = update.message.successful_payment;
      const purchaseId = sp.invoice_payload;
      const chargeId = sp.telegram_payment_charge_id;

      // Check idempotency by charge ID first (handles webhook retries)
      const existing = await prisma.purchase.findFirst({
        where: { telegramPaymentChargeId: chargeId },
      });
      if (existing?.status === 'completed') {
        return reply.status(200).send({ ok: true }); // already delivered
      }

      const result = await fulfillPurchase(purchaseId, chargeId);
      if (!result.ok) {
        app.log.error({ purchaseId, chargeId, reason: result.reason }, 'Fulfillment failed');
        // Still return 200 — Telegram will not retry on 200
        return reply.status(200).send({ ok: true, warning: result.reason });
      }

      return reply.status(200).send({ ok: true });
    }

    // Unknown update type — ack and ignore
    return reply.status(200).send({ ok: true });
  });
}

// ── Telegram update types (minimal surface we need) ───────────────────────────

interface TelegramUpdate {
  update_id: number;
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    currency: string;
    total_amount: number;
    invoice_payload: string;
  };
  message?: {
    message_id: number;
    from?: { id: number };
    successful_payment?: {
      currency: string;
      total_amount: number;
      invoice_payload: string;
      telegram_payment_charge_id: string;
      provider_payment_charge_id: string;
    };
  };
}
