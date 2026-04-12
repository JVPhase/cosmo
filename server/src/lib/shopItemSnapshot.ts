export interface ShopItemSnapshot {
  id: string
  type: string
  name: string
  description: string
  priceStars: number | null
  priceCredits: number | null
  metadata: Record<string, unknown>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function makeShopItemSnapshot(item: {
  id: string
  type: string
  name: string
  description: string
  priceStars: number | null
  priceCredits: number | null
  metadata: unknown
}): ShopItemSnapshot {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    description: item.description,
    priceStars: item.priceStars,
    priceCredits: item.priceCredits,
    metadata: isPlainObject(item.metadata) ? item.metadata : {}
  }
}

export function readShopItemSnapshot(value: unknown): ShopItemSnapshot | null {
  if (!isPlainObject(value)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.description !== 'string'
  ) {
    return null
  }
  if (value.priceStars !== null && typeof value.priceStars !== 'number') return null
  if (value.priceCredits !== null && typeof value.priceCredits !== 'number') return null
  if (!isPlainObject(value.metadata)) return null

  return {
    id: value.id,
    type: value.type,
    name: value.name,
    description: value.description,
    priceStars: (value.priceStars as number | null | undefined) ?? null,
    priceCredits: (value.priceCredits as number | null | undefined) ?? null,
    metadata: value.metadata
  }
}
