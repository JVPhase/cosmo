/**
 * Rewarded ad service — mock implementation.
 *
 * Replace `watchRewardedAd` body with real AdMob/Unity Ads SDK call
 * when ready. The contract: resolves `true` if the ad was watched in full,
 * `false` if skipped or failed.
 *
 * To integrate Google AdMob later:
 *   npx expo install react-native-google-mobile-ads
 *   Replace the body of watchRewardedAd with:
 *
 *   import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
 *   const ad = RewardedAd.createForAdRequest(YOUR_AD_UNIT_ID);
 *   return new Promise((resolve) => {
 *     ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => resolve(true));
 *     ad.addAdEventListener(RewardedAdEventType.CLOSED, () => resolve(false));
 *     ad.load();
 *   });
 */

const AD_MOCK_DELAY_MS = 2000;

/** Shows a rewarded ad. Returns true if reward was earned. */
export async function watchRewardedAd(): Promise<boolean> {
  // Mock: simulate a 2-second ad, always rewards.
  await new Promise<void>((resolve) => setTimeout(resolve, AD_MOCK_DELAY_MS));
  return true;
}
