/**
 * Grant creation and delivery helpers.
 *
 * Grants are the single channel for server → mobile gameplay delivery.
 * mobile applies grants in seq order, saves, then acks upToSeq.
 *
 * Supported kinds (P0):
 *   credits_grant       — { amount: number }
 *   metal_grant         — { metalId: string, quantity: number }
 *   booster_grant       — { shopItemId: string, effectType: string, multiplier?: number, bonus?: number, durationMs: number }
 */
import prisma from './prisma';

export type GrantKind = 'credits_grant' | 'metal_grant' | 'booster_grant';

export interface GrantDto {
  id: string;
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/**
 * Allocates the next seq for a user within a transaction.
 * Must be called inside a prisma.$transaction block with the tx client.
 */
export async function nextGrantSeq(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
): Promise<number> {
  const last = await tx.grant.findFirst({
    where: { userId },
    orderBy: { seq: 'desc' },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}

/**
 * Creates a single grant inside an existing transaction.
 * seq must be pre-allocated via nextGrantSeq().
 */
export async function createGrantInTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  {
    userId,
    seq,
    kind,
    payload,
    source,
    purchaseId,
  }: {
    userId: string;
    seq: number;
    kind: GrantKind;
    payload: Record<string, unknown>;
    source?: string;
    purchaseId?: string;
  },
) {
  return tx.grant.create({
    data: {
      userId,
      seq,
      kind,
      payload: payload as object,
      source: source ?? null,
      purchaseId: purchaseId ?? null,
    },
  });
}

/**
 * Returns pending (un-acked) grants after the given cursor, ordered by seq.
 */
export async function getPendingGrants(
  userId: string,
  afterSeq: number,
): Promise<GrantDto[]> {
  const grants = await prisma.grant.findMany({
    where: { userId, seq: { gt: afterSeq }, ackedAt: null },
    orderBy: { seq: 'asc' },
  });
  return grants.map((g) => ({
    id: g.id,
    seq: g.seq,
    kind: g.kind,
    payload: g.payload as Record<string, unknown>,
    createdAt: g.createdAt.toISOString(),
  }));
}

/**
 * Marks all grants up to upToSeq as acknowledged.
 */
export async function ackGrants(
  userId: string,
  upToSeq: number,
): Promise<void> {
  await prisma.grant.updateMany({
    where: { userId, seq: { lte: upToSeq }, ackedAt: null },
    data: { ackedAt: new Date() },
  });
}
