# Economy Sources

Use these sources in this order.

## 1. Live or DB-backed config

- Prisma model: `server/prisma/schema.prisma` → `GameConfig`
- Canonical seed rows: `server/prisma/configData.ts`
- Seeder entrypoint: `server/prisma/seed.ts`

If the task is about current runtime economy, prefer the stored `GameConfig` row values when available. If direct DB access is not available, use `server/prisma/configData.ts` as the canonical fallback.

## 2. Runtime payload and override path

- `server/src/routes/config.ts` builds the `/config` payload from `GameConfig`
- `server/src/routes/crmGameAdmin.ts` exposes read/write admin endpoints for `GameConfig`
- `mobile/cosmo-miner/src/game/remoteConfig.ts` defines the client-side config shape and cache flow

## 3. Shared formulas and progression logic

- Shared calculators: `packages/game-config/src/calculators.ts`
- Shared constants and data: `packages/game-config/src/*.ts`
- Client runtime formulas and projections:
  - `mobile/cosmo-miner/src/game/computeStats.ts`
  - `mobile/cosmo-miner/src/game/UPGRADES.ts`
  - `mobile/cosmo-miner/src/game/CANNONS.ts`
  - `mobile/cosmo-miner/src/game/ALIENS.ts`
  - `mobile/cosmo-miner/src/game/EXPEDITIONS.ts`
  - `mobile/cosmo-miner/src/game/PLAYER.ts`

## 4. Supporting evidence

- `BALANCE.md`
- `mobile/cosmo-miner/dev-logs/gameplay_analysis_2026-03-29.md`
- `server/test/contract/config.test.ts`
- `packages/game-config/src/__tests__/*.test.ts`

## Preferred change strategy

1. Find the narrowest numeric cause of the skew.
2. Change the canonical source once.
3. Verify the runtime path still consumes that source correctly.
4. Summarize the balance rationale in a short changelog-style note in the final response.
