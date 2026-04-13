---
name: balance-pass
description: Review the game's economy and progression, detect skewed curves or dead zones, propose minimal balance fixes, apply them in DB-backed config or formulas, and summarize what changed.
argument-hint: [goal-or-problem-area]
---

# Balance Pass

Use this skill for balance work driven by the current game economy: costs, rewards, progression pacing, battle duration, unlock timing, or resource sinks.

For source precedence and file targets, read [references/economy-sources.md](references/economy-sources.md) before editing.

## Workflow

- Start from the active source of truth:
  - if live DB config is available, inspect `GameConfig` rows first
  - otherwise use `server/prisma/configData.ts`, which is the canonical seed source for `GameConfig`
- Confirm how the config flows to runtime:
  - server payload: `server/src/routes/config.ts`
  - CRM admin overrides: `server/src/routes/crmGameAdmin.ts`
  - mobile consumption: `mobile/cosmo-miner/src/game/remoteConfig.ts`
- Inspect the relevant economy surfaces before editing:
  - upgrade costs and power
  - ship and cannon costs versus battle requirements
  - expedition rewards versus progression gates
  - XP thresholds and unlock timing
  - resource faucets and sinks
  - late-game battle duration and repeated grind loops
  - new resources or systems that unlock without meaningful spend targets
- Use repo evidence when available:
  - `BALANCE.md`
  - `mobile/cosmo-miner/dev-logs/gameplay_analysis_2026-03-29.md`
  - nearby tests and current formulas

## What To Look For

- hard walls where costs or HP scale faster than the available earning rate
- flat segments where a new unlock or resource has little practical value
- price-to-value inversions where a cheaper option dominates a later unlock
- long mandatory loops with little new decision-making
- resources introduced without enough sinks
- progression spikes caused by one formula constant rather than missing content

## Editing Rules

- Prefer minimal, local balance changes over new systems or content redesigns.
- First try the narrowest fix:
  - tweak one exponent or multiplier
  - smooth one reward table
  - move one unlock threshold
  - reduce one HP or cost spike
  - add one missing sink through existing config structures
- Edit the canonical source, not a derived copy:
  - `server/prisma/configData.ts` for DB-backed game config rows
  - `packages/game-config/src/*` for shared exported formulas and canonical calculations
  - `mobile/cosmo-miner/src/game/*` only when the runtime formula truly lives on the client
- Avoid changing config shapes unless required. If a contract changes, invoke `/contract-check`.

## Validation

- Re-check the affected curve after edits and verify that the fix reduces the specific skew you targeted.
- Prefer targeted validation:
  - `cd server && npm run build`
  - `cd server && npm run test:contract`
  - `cd packages/game-config && npx tsx --test src/__tests__/*.test.ts`
  - `cd mobile/cosmo-miner && yarn web` when client runtime balance code changed

## Output

- Briefly state:
  - the main balance problems found
  - the minimal changes chosen
  - which config keys, formulas, or files were changed
  - what validation was run
  - any remaining risk or follow-up balance questions
