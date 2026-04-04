/**
 * In-app purchase service using expo-in-app-purchases.
 *
 * Usage:
 *   1. Call `initIAP()` once at app startup (before showing shop).
 *   2. Call `getProducts()` to fetch current store prices.
 *   3. Call `purchasePack(productId)` to trigger a purchase flow.
 *      The returned promise resolves with the number of credits earned,
 *      or rejects with an error message.
 *   4. Call `disconnectIAP()` when the app goes to background / unmounts.
 *
 * The native module is loaded lazily via require() so Expo Go / missing native
 * builds do not evaluate it at startup. (Dynamic import() can still surface
 * native errors in ways that confuse Fast Refresh.)
 */

import { IAP_PRODUCT_IDS, CREDIT_PACKS } from "../game/CREDIT_PACKS";

export type IAPProduct = {
  productId: string;
  title: string;
  price: string;
  priceAmountMicros: string;
  priceCurrencyCode: string;
};

type IAPModule = typeof import("expo-in-app-purchases");

let iapModule: IAPModule | null = null;
let iapImportFailed = false;
let connected = false;
let purchaseResolve: ((credits: number) => void) | null = null;
let purchaseReject: ((reason: string) => void) | null = null;

function loadIAPModule(): IAPModule | null {
  if (iapImportFailed) return null;
  if (iapModule) return iapModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    iapModule = require("expo-in-app-purchases") as IAPModule;
    return iapModule;
  } catch (e) {
    iapImportFailed = true;
    console.warn("[IAP] Native module unavailable (use a dev build for IAP):", e);
    return null;
  }
}

export async function initIAP(): Promise<void> {
  if (connected) return;
  const InAppPurchases = loadIAPModule();
  if (!InAppPurchases) return;
  try {
    await InAppPurchases.connectAsync();
    connected = true;

    InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        for (const purchase of results) {
          if (!purchase.acknowledged) {
            const pack = CREDIT_PACKS.find((p) => p.productId === purchase.productId);
            const credits = pack?.credits ?? 0;
            // Finish (consume) the transaction so it can be purchased again
            InAppPurchases.finishTransactionAsync(purchase, true);
            purchaseResolve?.(credits);
            purchaseResolve = null;
            purchaseReject = null;
          }
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        purchaseReject?.("cancelled");
        purchaseResolve = null;
        purchaseReject = null;
      } else {
        purchaseReject?.(`IAP error: ${errorCode}`);
        purchaseResolve = null;
        purchaseReject = null;
      }
    });
  } catch (e) {
    // Simulator / store unavailable — keep iapModule for retry semantics if needed
    console.warn("[IAP] initIAP failed:", e);
  }
}

export async function getProducts(): Promise<IAPProduct[]> {
  const InAppPurchases = iapModule;
  if (!connected || !InAppPurchases) return [];
  try {
    const { responseCode, results } = await InAppPurchases.getProductsAsync(IAP_PRODUCT_IDS);
    if (responseCode !== InAppPurchases.IAPResponseCode.OK || !results) return [];
    return results.map((p) => ({
      productId: p.productId,
      title: p.title,
      price: p.price,
      priceAmountMicros: String(p.priceAmountMicros),
      priceCurrencyCode: p.priceCurrencyCode,
    }));
  } catch {
    return [];
  }
}

/**
 * Triggers purchase flow for a given IAP product ID.
 * Resolves with credits earned, rejects with reason string.
 */
export function purchasePack(productId: string): Promise<number> {
  const InAppPurchases = iapModule;
  return new Promise((resolve, reject) => {
    if (!connected || !InAppPurchases) {
      reject("IAP not initialised");
      return;
    }
    purchaseResolve = resolve;
    purchaseReject = reject;
    InAppPurchases.purchaseItemAsync(productId).catch((e) => {
      purchaseResolve = null;
      purchaseReject = null;
      reject(String(e));
    });
  });
}

export async function disconnectIAP(): Promise<void> {
  const InAppPurchases = iapModule;
  if (!connected || !InAppPurchases) return;
  try {
    await InAppPurchases.disconnectAsync();
    connected = false;
  } catch {
    // ignore
  }
}
