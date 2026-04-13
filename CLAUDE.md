# Cosmo

## Repository Shape
- `mobile/cosmo-miner`: Expo / React Native client. Use `yarn` here.
- `server`: Fastify + Prisma API. Use `npm` here.
- `crm`: Vite + React admin app. Use `npm` here.
- `packages/game-config`: shared gameplay config, formulas, and DTO/contracts used by mobile and server.
- There is no root workspace package manager entrypoint. Run commands inside the target subproject.

## Project-Wide Rules
- Prefer the smallest change in the affected subproject instead of broad cross-repo refactors.
- Do not read or modify real `.env` files unless the user explicitly asks. Use `.env.example` files for expected variables.
- Check git status before edits because the worktree may already contain user changes.
- When a task references a plan in `docs/*.md` or `memory/*.md`, read that document fully before writing code.
- For gameplay changes, verify whether `mobile/cosmo-miner` and `packages/game-config` must stay aligned.
- For save format or DTO changes, inspect `mobile/cosmo-miner/src/game/saveContract.ts`, `mobile/cosmo-miner/src/game/types.ts`, affected UI flows, and related server contract tests before editing.
- Prefer targeted validation in the touched package instead of unrelated full-repo commands.

## Common Commands
- Mobile dev: `cd mobile/cosmo-miner && yarn start`
- Mobile web: `cd mobile/cosmo-miner && yarn web`
- Mobile analytics sink: `cd mobile/cosmo-miner && yarn analytics-sink`
- Server dev: `cd server && npm run dev`
- Server build: `cd server && npm run build`
- Server DB up: `cd server && npm run db:up`
- Server DB seed: `cd server && npm run db:seed`
- Server contract tests: `cd server && npm run test:contract`
- CRM dev: `cd crm && npm run dev`
- CRM build: `cd crm && npm run build`
- Shared config tests: `cd packages/game-config && npx tsx --test src/__tests__/*.test.ts`

## Repo-Specific Notes
- `packages/game-config/src` contains checked-in `.ts` source alongside generated-looking `.js` CommonJS artifacts. Treat TypeScript files as the source of truth unless a task explicitly requires syncing emitted JS.
- `mobile/cosmo-miner/tsconfig.json` maps `@cosmo/game-config` to `../../packages/game-config/src/index.ts`, so mobile often consumes the shared TypeScript source directly.
- Server behavior regressions are primarily covered by `server/test/contract/*.test.ts`.

## Preferred Skills
- Use `/implement-plan` when a task is driven by a spec or plan in `docs/*.md` or `memory/*.md`.
- Use `/contract-check` for save format, DTO, grants, config export, or server contract changes.
- Use `/mobile-feature` for feature work inside `mobile/cosmo-miner`.
- Use `/bug-hunt` when the goal is root-cause analysis before or during a fix.
- Use `/perf-check` for slowness, frame drops, heavy renders, hot loops, or slow routes.
- Use `/balance-pass` for economy review and minimal balance adjustments in DB-backed game config or progression formulas.
