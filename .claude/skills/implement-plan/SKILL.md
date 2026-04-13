---
name: implement-plan
description: Implement a feature from a repository plan or spec document. Use when the task references docs/*.md or memory/*.md and the document should be read fully before coding.
argument-hint: [path-to-plan]
---

# Implement Plan

- Resolve the plan path from `$ARGUMENTS` or the user's prompt. Favor files under `docs/` and `memory/`.
- Read the referenced document fully before proposing edits or touching code.
- Extract the required behavior, constraints, edge cases, non-goals, and validation notes from the plan.
- Inspect the current implementation in the affected subproject before editing:
  - `mobile/cosmo-miner`
  - `server`
  - `crm`
  - `packages/game-config`
- Implement the smallest change that satisfies the written plan and the existing architecture.
- If the plan touches save format, DTOs, grants, or API payloads, invoke `/contract-check`.
- Validate with the nearest relevant command instead of unrelated broad repo checks:
  - mobile: `cd mobile/cosmo-miner && yarn web`
  - server: `cd server && npm run build` or `npm run test:contract`
  - crm: `cd crm && npm run build`
  - shared config: `cd packages/game-config && npx tsx --test src/__tests__/*.test.ts`
- Final output should state what was implemented, what was verified, and any remaining gaps against the plan.
