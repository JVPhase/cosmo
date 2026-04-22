/** Credit packs available for purchase via IAP or rewarded ads */

export type CreditPackId =
  | "credits_ad"        // free via rewarded ad
  | "credits_100"       // $0.99
  | "credits_300"       // $1.99
  | "credits_800"       // $4.99
  | "credits_2000";     // $9.99

export type CreditPackKind = "ad" | "iap";

export type CreditPack = {
  id: CreditPackId;
  kind: CreditPackKind;
  name: string;
  icon: string;
  credits: number;
  lore: string;
  /** IAP product ID (only for kind === "iap") */
  productId?: string;
  /** Display price string, e.g. "$0.99" — overridden at runtime by store price */
  basePrice?: string;
};

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: "credits_ad",
    kind: "ad",
    name: "iap_pack.credits_ad.name",
    icon: "📺",
    credits: 30,
    lore: "iap_pack.credits_ad.lore",
  },
  {
    id: "credits_100",
    kind: "iap",
    name: "iap_pack.credits_100.name",
    icon: "💳",
    credits: 100,
    productId: "cosmo_credits_100",
    basePrice: "$0.99",
    lore: "iap_pack.credits_100.lore",
  },
  {
    id: "credits_300",
    kind: "iap",
    name: "iap_pack.credits_300.name",
    icon: "💰",
    credits: 300,
    productId: "cosmo_credits_300",
    basePrice: "$1.99",
    lore: "iap_pack.credits_300.lore",
  },
  {
    id: "credits_800",
    kind: "iap",
    name: "iap_pack.credits_800.name",
    icon: "🌟",
    credits: 800,
    productId: "cosmo_credits_800",
    basePrice: "$4.99",
    lore: "iap_pack.credits_800.lore",
  },
  {
    id: "credits_2000",
    kind: "iap",
    name: "iap_pack.credits_2000.name",
    icon: "🏦",
    credits: 2000,
    productId: "cosmo_credits_2000",
    basePrice: "$9.99",
    lore: "iap_pack.credits_2000.lore",
  },
] as const;

export function getCreditPackById(id: CreditPackId): CreditPack {
  const pack = CREDIT_PACKS.find((p) => p.id === id);
  if (!pack) throw new Error(`Unknown credit pack id: ${id}`);
  return pack;
}

export const IAP_PRODUCT_IDS = CREDIT_PACKS
  .filter((p) => p.kind === "iap")
  .map((p) => p.productId!);
