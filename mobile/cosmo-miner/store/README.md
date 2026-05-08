# Google Play store assets

Source artifacts for the Google Play Console listing. Edit here, then upload to Console.

## Layout

- `texts/{en,ru}/short.txt` — short description (max 80 chars)
- `texts/{en,ru}/full.txt` — full description (max 4000 chars)
- `graphics/` — app icon (512×512), feature graphic (1024×500)
- `screenshots/` — phone screenshots (1080×1920 or 1080×2340; 2–8 images)
- Privacy policy is canonical at [`docs/legal/privacy-policy-android-en.md`](../../../docs/legal/privacy-policy-android-en.md) and [`docs/legal/privacy-policy-android-ru.md`](../../../docs/legal/privacy-policy-android-ru.md). The hostable HTML version is [`docs/privacy-policy.html`](../../../docs/privacy-policy.html) (single page with EN/RU toggle).

## Required graphics (NOT yet generated)

- `graphics/feature-graphic.png` — 1024×500 PNG, **mandatory** for Play Store.
- `graphics/icon-512.png` — 512×512 PNG, can be re-rendered from `assets/icon.png`.
- `screenshots/phone-{1..N}.png` — capture from a dev build via `adb shell screencap`.

## Capturing phone screenshots

```sh
# 1. Build a dev client and run on emulator
cd mobile/cosmo-miner
yarn android

# 2. From host machine
adb shell screencap -p /sdcard/cosmo-1.png
adb pull /sdcard/cosmo-1.png store/screenshots/phone-1.png
adb shell rm /sdcard/cosmo-1.png
```

Capture key flows: main mining tab, ship upgrade screen, expedition map, battle, shop (Google Play Billing tab — without Telegram Stars; the latter is excluded from the Android bundle).

## Publishing the privacy policy

The HTML page is already at [`docs/privacy-policy.html`](../../../docs/privacy-policy.html). To publish:

1. GitHub: repo Settings → Pages → Source: `main` / folder `/docs`.
2. Resulting URL: `https://<github-user>.github.io/<repo>/privacy-policy.html`.
3. Paste that URL into Play Console → App content → Privacy Policy and into the Data safety form.

The page supports `#en` / `#ru` hash anchors for direct-language deep links and remembers the user's choice in `localStorage`.
