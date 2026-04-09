/**
 * Server-side inventory management.
 * All mutations go through here to keep business logic centralised.
 */
import type { Prisma } from '@prisma/client';
import prisma from './prisma';

export interface InventoryEntry {
  itemId: string;
  itemType: string;
  quantity: number;
  metadata: Record<string, unknown> | null;
}

/** Returns all inventory items for a user. */
export async function getUserInventory(userId: string): Promise<InventoryEntry[]> {
  const rows = await prisma.inventory.findMany({ where: { userId } });
  return rows.map((r) => ({
    itemId: r.itemId,
    itemType: r.itemType,
    quantity: r.quantity,
    metadata: r.metadata as Record<string, unknown> | null,
  }));
}

/**
 * Adds `quantity` units of `itemId` to the user's inventory.
 * Uses upsert so concurrent calls are safe.
 */
export async function addToInventory(
  userId: string,
  itemId: string,
  itemType: string,
  quantity: number,
  metadata?: Record<string, unknown>,
): Promise<InventoryEntry> {
  const row = await prisma.inventory.upsert({
    where: { userId_itemId: { userId, itemId } },
    create: {
      userId,
      itemId,
      itemType,
      quantity,
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
    update: {
      quantity: { increment: quantity },
      // Merge metadata for time-limited items (e.g. extend booster expiry)
      ...(metadata !== undefined ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });
  return {
    itemId: row.itemId,
    itemType: row.itemType,
    quantity: row.quantity,
    metadata: row.metadata as Record<string, unknown> | null,
  };
}

/**
 * Consumes `quantity` units from inventory.
 * Returns false if insufficient stock.
 */
export async function consumeFromInventory(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<boolean> {
  const row = await prisma.inventory.findUnique({
    where: { userId_itemId: { userId, itemId } },
  });
  if (!row || row.quantity < quantity) return false;

  if (row.quantity === quantity) {
    await prisma.inventory.delete({ where: { userId_itemId: { userId, itemId } } });
  } else {
    await prisma.inventory.update({
      where: { userId_itemId: { userId, itemId } },
      data: { quantity: { decrement: quantity } },
    });
  }
  return true;
}
