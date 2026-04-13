---
name: perf-check
description: Review or optimize performance-sensitive code paths in this repository. Use when the task mentions slowness, frame drops, hot loops, frequent saves, heavy renders, or slow server routes.
argument-hint: [scope-or-file]
---

# Perf Check

- Identify the likely hot path before editing: render loop, state update path, animation effect, serialization, network route, Prisma query, or repeated allocation.
- Prefer evidence from measured behavior, code shape, or reproducible symptoms over speculative micro-optimizations.
- For mobile work, inspect:
  - broad state updates in `mobile/cosmo-miner/src/game/useGame.ts`
  - repeated derived work in screens and shared UI
  - frequent save or sync paths
  - `.web` and `.native` animation or effect components
- For server work, inspect:
  - route-level repeated JSON work
  - query patterns and Prisma access
  - expensive per-request object creation
  - middleware that runs on hot paths
- Favor changes that reduce total work or call frequency, not clever code with marginal gains.
- Validate with the nearest build or test command and clearly separate proven wins from informed inference.
