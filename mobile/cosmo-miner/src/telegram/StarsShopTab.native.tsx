/**
 * Native (Android/iOS) stub for the Telegram Stars shop tab.
 *
 * Telegram Stars is an alternative payment method for digital goods, which
 * Google Play Payments Policy forbids. Metro selects this `.native.tsx` for
 * Android/iOS builds so the real implementation in `StarsShopTab.web.tsx`
 * (and its server API client, copy strings, and runtime imports) never
 * lands in the APK/AAB.
 *
 * Type signatures mirror the web module so consumer modules compile unchanged.
 * The component renders nothing — the parent (ShopScreen) gates the tab on
 * `isTelegramRuntime()` which always returns false on native, so this stub
 * is unreachable at runtime.
 */

export interface StarShopItem {
  id: string;
  type: string;
  name: string;
  description: string;
  priceStars: number;
  metadata: Record<string, unknown>;
}

export interface StarsPurchaseResult {
  purchaseId: string;
  status?: string;
  type: string;
  shopItemId: string;
  metadata: Record<string, unknown>;
  itemMetadata: Record<string, unknown>;
}

export interface StarsPurchasedItem {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  purchaseId?: string;
  purchaseResult?: StarsPurchaseResult;
}

interface StarsShopTabProps {
  onPurchaseApplied: (item: StarsPurchasedItem) => Promise<boolean> | boolean;
}

export function StarsShopTab(_: StarsShopTabProps): null {
  return null;
}
