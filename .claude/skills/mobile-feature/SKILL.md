---
name: mobile-feature
description: Build or update features in the Expo mobile client. Use when editing screens, UI flows, state transitions, or gameplay behavior in mobile/cosmo-miner.
argument-hint: [feature-or-file]
paths:
  - "mobile/cosmo-miner/**/*.{ts,tsx,js,json}"
---

# Mobile Feature

- Work inside `mobile/cosmo-miner` and use `yarn`, not `npm`.
- Map the user flow before editing: entry screen, state owner, affected UI, and persistence boundaries.
- Start from the most relevant layer:
  - app shell: `App.tsx`
  - screens: `src/screens/*`
  - shared UI: `src/ui/*`
  - gameplay state and persistence: `src/game/useGame.ts`, `src/game/types.ts`, `src/game/saveContract.ts`
- For gameplay changes, check whether shared exports from `packages/game-config` are involved.
- Keep `.web` and `.native` component variants aligned when the behavior should match across platforms.
- Reuse existing UI patterns unless the task explicitly asks for a redesigned flow.
- Prefer focused validation:
  - `cd mobile/cosmo-miner && yarn web`
  - relevant tests under `src/game/__tests__`
- If the mobile feature changes saved state or DTOs, invoke `/contract-check`.
