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
    name: "Рекламный контракт",
    icon: "📺",
    credits: 30,
    lore: "Посмотрите рекламу — получите 30 кредитов. Отдел маркетинга доволен. Вы — по-разному.",
  },
  {
    id: "credits_100",
    kind: "iap",
    name: "Малый фонд",
    icon: "💳",
    credits: 100,
    productId: "cosmo_credits_100",
    basePrice: "$0.99",
    lore: "100 кредитов. Бухгалтерия МММРДР оформила чек в трёх экземплярах. Один — вам.",
  },
  {
    id: "credits_300",
    kind: "iap",
    name: "Корпоративный счёт",
    icon: "💰",
    credits: 300,
    productId: "cosmo_credits_300",
    basePrice: "$1.99",
    lore: "300 кредитов. Финансовый отдел одобрил. Юридический — тоже, но с оговорками.",
  },
  {
    id: "credits_800",
    kind: "iap",
    name: "Звёздный капитал",
    icon: "🌟",
    credits: 800,
    productId: "cosmo_credits_800",
    basePrice: "$4.99",
    lore: "800 кредитов. Межгалактическая биржа зафиксировала транзакцию. Курс не изменился.",
  },
  {
    id: "credits_2000",
    kind: "iap",
    name: "Галактический резерв",
    icon: "🏦",
    credits: 2000,
    productId: "cosmo_credits_2000",
    basePrice: "$9.99",
    lore: "2000 кредитов. Центральный банк Галактики запросил пояснения. Вы их не дали.",
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
