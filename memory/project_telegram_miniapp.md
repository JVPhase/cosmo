---
name: Telegram Mini App Implementation
description: Tracks the unified Telegram Mini App architecture — telegram/cosmo-tg deleted, mobile/cosmo-miner is now the single client for both native and Telegram web
type: project
---

Telegram Mini App is now unified into `mobile/cosmo-miner`. The separate `telegram/cosmo-tg/` Vite app has been **deleted**.

**Architecture:** One client, two runtime targets. Telegram is a runtime/build target + extra commerce layer, not a separate app.

**Telegram adapter layer (all in `mobile/cosmo-miner/src/telegram/`):**
- `runtime.ts` — `isTelegramRuntime()`, `getTelegramWebApp()`, `bootstrapTelegram()` (Platform-guarded, no-op on native)
- `auth.ts` — `telegramAuthIfNeeded()`: POST /telegram/auth with initData → storeTokens(), runs before cloud sync in App.tsx init
- `StarsShopTab.tsx` — Stars shop tab shown only in Telegram runtime; supports `currency_pack`, `metal_pack`, `booster` SKUs (loot_box and premium_unlock excluded — no client application path); has 401→token-refresh retry wrapper; `onPurchaseApplied` callback updates live game state immediately after payment

**Game state mutations added to useGame.ts:**
- `grantMetals(patch)` — adds metals without credit cost (for Stars metal_pack)
- `activateBoost(boost)` — activates booster without credit cost (for Stars booster)

**Purchase → gameplay flow (end-to-end):**
- `currency_pack`: server writes to UserSave.data.credits; client calls `game.addCredits(creditAmount)`
- `metal_pack`: server writes to Inventory; client calls `game.grantMetals({metalId: qty})`
- `booster`: server writes to Inventory; client calls `game.activateBoost(...)`

**Stars tab in ShopScreen:** shown only when `isTelegramRuntime()` is true (runtime check, no native impact).

**Backend routes still active:** POST /telegram/auth, GET /telegram/me, GET /telegram/shop, POST /telegram/shop/invoice, POST /telegram/shop/buy-credits, GET /telegram/inventory, POST /telegram/webhook

**Required env vars:** TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET (server), EXPO_PUBLIC_API_URL (mobile/web build)

**What still needs a BotFather update:** Mini App URL must point to the `expo web` build of `mobile/cosmo-miner`, not the deleted Vite app.

**Why:** Unified client to avoid gameplay duplication; fixed HIGH bugs where Stars purchases gave no gameplay effect.
**How to apply:** Check `mobile/cosmo-miner/src/telegram/` for all Telegram-specific logic. Server routes unchanged.
