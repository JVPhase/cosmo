---
name: contract-check
description: Check and synchronize save, DTO, grants, or API contract changes across mobile, server, and shared config. Use when editing saveContract, game types, exported schemas, or server contract tests.
argument-hint: [scope-or-file]
paths:
  - "mobile/cosmo-miner/src/game/**/*.{ts,tsx}"
  - "server/**/*.{ts,prisma,sql}"
  - "packages/game-config/**/*.{ts,js}"
---

# Contract Check

- Identify the contract surface first. Common locations in this repo:
  - `mobile/cosmo-miner/src/game/saveContract.ts`
  - `mobile/cosmo-miner/src/game/types.ts`
  - `mobile/cosmo-miner/src/game/grants.ts`
  - `packages/game-config/src/schemas.ts`
  - `packages/game-config/src/index.ts`
  - `server/test/contract/*.test.ts`
  - related server routes and helpers in `server/src`
- Do not change one side of a contract without checking the other consumers and producers.
- If the save envelope or persisted state shape changes, check versioning, migrations, serialization, and load paths.
- If DTO exports change, inspect both mobile and server imports plus any mapping logic or grant fulfillment code.
- Prefer backward-compatible changes unless the task explicitly allows a breaking contract change.
- Validate with targeted checks:
  - `cd server && npm run test:contract`
  - `cd packages/game-config && npx tsx --test src/__tests__/*.test.ts`
- Final output should call out the contract surfaces touched and any compatibility risk.
