/**
 * Rewarded ad service — Google AdMob integration.
 *
 * Lazy-loaded (require()) so Expo Go and web builds, where the native module
 * is unavailable, fall back gracefully to a no-ad reject.
 *
 * AdMob unit IDs:
 *   - Internal Testing / dev: `TestIds.REWARDED` (always-fill Google demo ads).
 *   - Production: `EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID` from EAS Secrets.
 *
 * Test mode is forced when `__DEV__` OR `EXPO_PUBLIC_USE_TEST_ADS=true`.
 * The first Internal Testing release uses TestIds even in the production
 * profile — real IDs land before Production track promotion.
 */

import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

const NATIVE_AVAILABLE =
  Platform.OS !== "web" &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

const USE_TEST_ADS =
  __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";

type AdMobModule = typeof import("react-native-google-mobile-ads");

let admobModule: AdMobModule | null = null;
let admobImportFailed = false;
let initialized = false;

function loadAdMob(): AdMobModule | null {
  if (admobImportFailed) return null;
  if (admobModule) return admobModule;
  if (!NATIVE_AVAILABLE) {
    admobImportFailed = true;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    admobModule = require("react-native-google-mobile-ads") as AdMobModule;
    return admobModule;
  } catch (e) {
    admobImportFailed = true;
    console.warn("[Ads] AdMob native module unavailable:", e);
    return null;
  }
}

function getRewardedUnitId(): string | null {
  const mod = admobModule;
  if (!mod) return null;
  if (USE_TEST_ADS) return mod.TestIds.REWARDED;
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID ?? null;
  }
  return null;
}

/** Initialise AdMob SDK. Call once at app startup. No-op outside native. */
export async function initAds(): Promise<void> {
  if (initialized) return;
  const mod = loadAdMob();
  if (!mod) return;
  try {
    await mod.default().initialize();
    initialized = true;
  } catch (e) {
    console.warn("[Ads] initialize failed:", e);
  }
}

/** Shows a rewarded ad. Returns true if the user earned the reward. */
export async function watchRewardedAd(): Promise<boolean> {
  const mod = loadAdMob();
  if (!mod) return false;
  if (!initialized) {
    await initAds();
    if (!initialized) return false;
  }

  const unitId = getRewardedUnitId();
  if (!unitId) {
    console.warn("[Ads] No rewarded unit ID configured");
    return false;
  }

  return new Promise<boolean>((resolve) => {
    const ad = mod.RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    let earned = false;
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const unsubLoaded = ad.addAdEventListener(
      mod.AdEventType.LOADED,
      () => {
        ad.show().catch((e) => {
          console.warn("[Ads] show() failed:", e);
          settle(false);
        });
      },
    );

    const unsubEarned = ad.addAdEventListener(
      mod.RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
      },
    );

    const unsubClosed = ad.addAdEventListener(
      mod.AdEventType.CLOSED,
      () => {
        unsubLoaded();
        unsubEarned();
        unsubClosed();
        unsubError();
        settle(earned);
      },
    );

    const unsubError = ad.addAdEventListener(mod.AdEventType.ERROR, (err) => {
      console.warn("[Ads] rewarded ad error:", err);
      unsubLoaded();
      unsubEarned();
      unsubClosed();
      unsubError();
      settle(false);
    });

    ad.load();
  });
}
