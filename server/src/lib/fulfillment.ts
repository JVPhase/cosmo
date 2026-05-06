/**
 * Purchase fulfillment — idempotent delivery via Grant records.
 *
 * Call `fulfillPurchase(purchaseId)` from:
 *   - The Telegram Stars webhook `successful_payment` handler
 *   - Credits purchase completion (in-game)
 *
 * The function is idempotent: calling it twice for the same purchaseId is safe.
 *
 * Item-type routing (P0):
 *   currency_pack       → Grant(credits_grant)
 *   metal_pack          → Grant(metal_grant)
 *   booster             → Grant(booster_grant)
 *   premium_unlock      → NOT delivered via grant (unsupported in P0); logged, not failed
 *
 * Server NEVER writes gameplay fields directly to userSave.
 * All delivery goes through Grant → mobile apply → mobile save → ack.
 */
import prisma from './prisma';
import { nextGrantSeq, createGrantInTx } from './grants';
import type { GrantKind } from './grants';
import { addToInventory } from './inventory';
import { makeShopItemSnapshot, readShopItemSnapshot } from './shopItemSnapshot';

export type FulfillResult =
  | { ok: true; alreadyFulfilled: boolean }
  | { ok: false; reason: string };

// ── Main fulfillment ──────────────────────────────────────────────────────────

/**
 * Fulfills a purchase by creating a Grant record.
 * Marks the purchase as `completed` and records `fulfilledAt`.
 * All mutations are in one atomic transaction.
 */
export async function fulfillPurchase(
  purchaseId: string,
  telegramPaymentChargeId?: string,
): Promise<FulfillResult> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { shopItem: true },
  });

  if (!purchase) return { ok: false, reason: 'Purchase not found' };

  // Idempotency guard — already delivered
  if (purchase.status === 'completed') {
    return { ok: true, alreadyFulfilled: true };
  }

  if (purchase.status === 'failed' || purchase.status === 'refunded') {
    return {
      ok: false,
      reason: `Purchase is in terminal state: ${purchase.status}`,
    };
  }

  // Captured outside the transaction so we can write the inventory audit record
  // after the transaction commits (best-effort; does not affect delivery state).
  let fulfilledGrantKind: GrantKind | null = null;
  const purchaseMeta = (purchase.metadata as Record<string, unknown>) ?? {};
  const item =
    readShopItemSnapshot(purchaseMeta.shopItemSnapshot) ??
    makeShopItemSnapshot(purchase.shopItem);

  await prisma.$transaction(async (tx) => {
    // Record Telegram charge ID if provided (Stars flow) — idempotency key
    if (telegramPaymentChargeId) {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { telegramPaymentChargeId },
      });
    }

    const meta = item.metadata ?? {};
    const userId = purchase.userId;

    // Allocate seq inside the transaction for strict monotonicity
    const seq = await nextGrantSeq(tx, userId);

    let grantKind: GrantKind | null = null;
    let grantPayload: Record<string, unknown> = {};

    if (item.type === 'currency_pack') {
      const creditAmount = (meta.creditAmount as number) ?? 0;
      if (creditAmount > 0) {
        grantKind = 'credits_grant';
        grantPayload = { amount: creditAmount };
      }
    } else if (item.type === 'metal_pack') {
      const metalId = meta.metalId as string | undefined;
      const quantity = (meta.quantity as number) ?? 0;
      if (metalId && quantity > 0) {
        grantKind = 'metal_grant';
        grantPayload = { metalId, quantity };
      }
    } else if (item.type === 'booster') {
      grantKind = 'booster_grant';
      grantPayload = {
        shopItemId: item.id,
        effectType: meta.effectType ?? '',
        ...(meta.multiplier !== undefined
          ? { multiplier: meta.multiplier }
          : {}),
        ...(meta.bonus !== undefined ? { bonus: meta.bonus } : {}),
        durationMs: meta.durationMs ?? 3_600_000,
      };
    } else if (item.type === 'premium_unlock') {
      // premium_unlock has no deterministic mobile apply path in P0.
      // Do not create a grant; log a warning and mark the purchase completed.
      // The item remains hidden in the catalog (deliveryMode: 'unsupported').
    }

    if (grantKind) {
      await createGrantInTx(tx, {
        userId,
        seq,
        kind: grantKind,
        payload: grantPayload,
        source: 'purchase',
        purchaseId: purchase.id,
      });
      fulfilledGrantKind = grantKind;
    }

    // Mark purchase fulfilled — inside the same transaction
    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: 'completed', fulfilledAt: new Date() },
    });
  });

  // Inventory audit: write a read-model record after the transaction commits.
  // Best-effort — failure here does not affect grant delivery or gameplay state.
  if (fulfilledGrantKind) {
    addToInventory(purchase.userId, item.id, item.type, 1, {
      grantKind: fulfilledGrantKind,
      purchaseId: purchase.id,
    }).catch(() => {
      // Audit write failure is non-fatal; the grant is already delivered.
    });
  }

  return { ok: true, alreadyFulfilled: false };
}

/**
 * Marks a purchase as failed (e.g. user cancelled, Stars refunded).
 */
export async function failPurchase(purchaseId: string): Promise<void> {
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: 'failed' },
  });
}
