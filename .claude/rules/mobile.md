---
paths:
  - "mobile/cosmo-miner/**/*.{ts,tsx,js,json}"
---

# Mobile Rules

- Use `yarn` inside `mobile/cosmo-miner`, not `npm`.
- This app is Expo / React Native. Start from `App.tsx`, `src/screens`, `src/ui`, and `src/game`.
- When changing gameplay state or progression, trace the impact through `src/game/useGame.ts`, `src/game/types.ts`, `src/game/saveContract.ts`, and the affected screens or popups.
- Keep paired `.native.tsx` and `.web.tsx` components aligned when behavior should match across platforms.
- If a feature touches analytics, Telegram, IAP, or saves, inspect the matching modules in `src/services`, `src/telegram`, or `src/game` before editing.
- Prefer focused validation such as `yarn web` and relevant tests under `src/game/__tests__` when available.
