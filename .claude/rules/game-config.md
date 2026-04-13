---
paths:
  - "packages/game-config/**/*.{ts,js,json}"
---

# Shared Game Config Rules

- `packages/game-config` is shared by mobile and server. Consider downstream impact before changing exported constants, DTO types, formulas, or identifiers.
- Prefer editing `.ts` files in `packages/game-config/src`. The checked-in `.js` files look like emitted CommonJS artifacts and are not the primary source of truth.
- If you change formulas, DTOs, IDs, or exported names, search both `mobile/cosmo-miner` and `server` for affected imports and runtime assumptions.
- Prefer `npx tsx --test src/__tests__/*.test.ts` for package-level validation, and run consuming-package tests when the shared contract changes.
