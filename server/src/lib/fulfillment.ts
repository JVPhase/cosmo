/**
 * Purchase fulfillment — idempotent delivery of purchased items to inventory.
 *
 * Call `fulfillPurchase(purchaseId)` from:
 *   - The Telegram Stars webhook `successful_payment` handler
 *   - Credits purchase completion (in-game)
 *
 * The function is idempotent: calling it twice for the same purchaseId is safe.
 *
 * Item-type routing:
 *   currency_pack   → UserSave.data.credits (instant balance, picked up on next sync)
 *   metal_pack      → Inventory
 *   booster         → Inventory
 *   loot_box        → rolls metals server-side; result stored in purchase.metadata;
 *                     grants metals directly to UserSave (same as currency_pack pattern)
 *   premium_unlock  → applies effect directly to UserSave:
 *                       unlockNextSector → adds next-sector planet IDs to unlockedPlanetIds
 *                       resetResearch    → clears research map, refunds spent energy
 */
import { RESEARCH_DATA, PLANETS_PER_SECTOR } from '@cosmo/game-config';
import type { Prisma } from '@prisma/client';
import prisma from './prisma';
import { addToInventory } from './inventory';

export type FulfillResult =
  | { ok: true; alreadyFulfilled: boolean }
  | { ok: false; reason: string };

// ── Loot box roll ─────────────────────────────────────────────────────────────

type MetalId = 'iron' | 'titan' | 'iridium' | 'voidCrystal' | 'echoShard';

interface LootRollResult {
  rolledMetals: Partial<Record<MetalId, number>>;
}

const LOOT_TABLES: Record<
  string,
  { metal: MetalId; min: number; max: number; weight: number }[]
> = {
  basic: [
    { metal: 'iron', min: 10, max: 40, weight: 50 },
    { metal: 'titan', min: 3, max: 12, weight: 35 },
    { metal: 'iridium', min: 1, max: 4, weight: 15 },
  ],
  advanced: [
    { metal: 'iron', min: 20, max: 80, weight: 30 },
    { metal: 'titan', min: 8, max: 25, weight: 30 },
    { metal: 'iridium', min: 3, max: 10, weight: 20 },
    { metal: 'voidCrystal', min: 1, max: 4, weight: 10 },
    { metal: 'echoShard', min: 1, max: 4, weight: 10 },
  ],
  premium: [
    { metal: 'voidCrystal', min: 4, max: 10, weight: 50 },
    { metal: 'echoShard', min: 4, max: 10, weight: 50 },
  ],
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollLootBox(tier: string): LootRollResult {
  const table = LOOT_TABLES[tier] ?? LOOT_TABLES.basic;
  const total = table.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;

  // Pick one primary metal by weighted random
  const picked = table.find((e) => {
    roll -= e.weight;
    return roll <= 0;
  }) ?? table[table.length - 1];

  const qty = randInt(picked.min, picked.max);

  // Premium crates always give both metals in doubled quantity
  if (tier === 'premium') {
    return {
      rolledMetals: {
        voidCrystal: randInt(4, 10),
        echoShard: randInt(4, 10),
      },
    };
  }

  return { rolledMetals: { [picked.metal]: qty } };
}

// ── Premium unlock helpers ────────────────────────────────────────────────────

/**
 * Returns the planet IDs for the next locked sector.
 * A sector is "next" if ALL planets of the preceding sector are in unlockedPlanetIds
 * but not all of its own planets are unlocked yet.
 *
 * Returns empty array if no unlockable sector found (player has unlocked everything
 * or can't proceed without grinding level requirements — we still grant it as a skip).
 */
function computeNextSectorPlanets(unlockedPlanetIds: number[]): number[] {
  const unlocked = new Set(unlockedPlanetIds);
  const planetsPerSector = PLANETS_PER_SECTOR;

  // Walk sectors 1..100; find first sector that isn't fully unlocked
  for (let sector = 1; sector <= 100; sector++) {
    const start = (sector - 1) * planetsPerSector + 1;
    const sectorPlanets = Array.from(
      { length: planetsPerSector },
      (_, i) => start + i,
    );
    const allUnlocked = sectorPlanets.every((id) => unlocked.has(id));
    if (!allUnlocked) {
      return sectorPlanets.filter((id) => !unlocked.has(id));
    }
  }
  return [];
}

/**
 * Computes the total energy spent on completed research nodes.
 */
function computeResearchEnergyRefund(researchMap: Record<string, boolean>): number {
  return RESEARCH_DATA.filter((node) => researchMap[node.id]).reduce(
    (sum, node) => sum + node.energyCost,
    0,
  );
}

// ── Main fulfillment ──────────────────────────────────────────────────────────

/**
 * Fulfills a purchase and grants items to the user's inventory / save.
 * Marks the purchase as `completed` and records `fulfilledAt`.
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
    return { ok: false, reason: `Purchase is in terminal state: ${purchase.status}` };
  }

  // Wrap in a transaction so all mutations are atomic
  await prisma.$transaction(async (tx) => {
    // Record Telegram charge ID if provided (Stars flow)
    if (telegramPaymentChargeId) {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { telegramPaymentChargeId },
      });
    }

    const item = purchase.shopItem;
    const meta = (item.metadata as Record<string, unknown>) ?? {};

    if (item.type === 'currency_pack') {
      // Credit packs go directly to UserSave.data.credits, not inventory.
      const creditAmount = (meta.creditAmount as number) ?? 0;
      if (creditAmount > 0) {
        const save = await tx.userSave.findUnique({ where: { userId: purchase.userId } });
        const saveData = (save?.data ?? {}) as Record<string, unknown>;
        const current = (saveData.credits as number) ?? 0;
        const nextRev = (save?.rev ?? 0) + 1;

        await tx.userSave.upsert({
          where: { userId: purchase.userId },
          create: {
            userId: purchase.userId,
            data: { credits: current + creditAmount },
            rev: nextRev,
          },
          update: {
            data: { ...(saveData as object), credits: current + creditAmount },
            rev: nextRev,
          },
        });
      }
    } else if (item.type === 'loot_box') {
      // Roll server-side, store result in purchase.metadata, apply metals to save.
      const tier = (meta.tier as string) ?? 'basic';
      const rollResult = rollLootBox(tier);

      // Persist the roll result so the client can query it
      const existingMeta = (purchase.metadata as Record<string, unknown>) ?? {};
      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          metadata: { ...existingMeta, ...rollResult },
        },
      });

      // Grant metals directly to UserSave (same pattern as currency_pack)
      const save = await tx.userSave.findUnique({ where: { userId: purchase.userId } });
      const saveData = (save?.data ?? {}) as Record<string, unknown>;
      const currentMetals = (saveData.metals as Record<string, number>) ?? {};
      const newMetals = { ...currentMetals };
      for (const [metalId, qty] of Object.entries(rollResult.rolledMetals)) {
        newMetals[metalId] = (newMetals[metalId] ?? 0) + (qty as number);
      }
      const nextRev = (save?.rev ?? 0) + 1;

      await tx.userSave.upsert({
        where: { userId: purchase.userId },
        create: {
          userId: purchase.userId,
          data: { metals: newMetals },
          rev: nextRev,
        },
        update: {
          data: { ...(saveData as object), metals: newMetals },
          rev: nextRev,
        },
      });
    } else if (item.type === 'premium_unlock') {
      const effect = meta.effect as string | undefined;
      const save = await tx.userSave.findUnique({ where: { userId: purchase.userId } });
      const saveData = (save?.data ?? {}) as Record<string, unknown>;
      const nextRev = (save?.rev ?? 0) + 1;
      let updatedSaveData: Record<string, unknown> = { ...(saveData as object) };

      if (effect === 'unlockNextSector') {
        const currentUnlocked = (saveData.unlockedPlanetIds as number[]) ?? [1];
        const toUnlock = computeNextSectorPlanets(currentUnlocked);
        const newUnlocked = Array.from(new Set([...currentUnlocked, ...toUnlock]));

        updatedSaveData = { ...updatedSaveData, unlockedPlanetIds: newUnlocked };

        // Store unlocked planets in purchase metadata for client to read
        const existingMeta = (purchase.metadata as Record<string, unknown>) ?? {};
        await tx.purchase.update({
          where: { id: purchaseId },
          data: { metadata: { ...existingMeta, appliedPlanets: toUnlock } },
        });
      } else if (effect === 'resetResearch') {
        const researchMap = (saveData.research as Record<string, boolean>) ?? {};
        const energyRefund = computeResearchEnergyRefund(researchMap);
        const currentEnergy = (saveData.energy as number) ?? 0;

        updatedSaveData = {
          ...updatedSaveData,
          research: {},
          energy: currentEnergy + energyRefund,
        };

        const existingMeta = (purchase.metadata as Record<string, unknown>) ?? {};
        await tx.purchase.update({
          where: { id: purchaseId },
          data: { metadata: { ...existingMeta, energyRefund, nodesReset: Object.keys(researchMap).length } },
        });
      }

      await tx.userSave.upsert({
        where: { userId: purchase.userId },
        create: {
          userId: purchase.userId,
          data: updatedSaveData as Prisma.InputJsonValue,
          rev: nextRev,
        },
        update: {
          data: updatedSaveData as Prisma.InputJsonValue,
          rev: nextRev,
        },
      });
    } else {
      // All other item types (booster, metal_pack, etc.) go to inventory
      await addToInventory(
        purchase.userId,
        item.id,
        item.type,
        1,
        { purchaseId: purchase.id, ...meta },
      );
    }

    // Mark fulfilled
    await tx.purchase.update({
      where: { id: purchaseId },
      data: { status: 'completed', fulfilledAt: new Date() },
    });
  });

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
