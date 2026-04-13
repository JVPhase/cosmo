---
name: bug-hunt
description: Investigate regressions, crashes, broken flows, or suspicious behavior in this repository. Use when the goal is root-cause analysis before fixing or while narrowing a bug.
argument-hint: [symptom-or-file]
---

# Bug Hunt

- Reproduce or narrow the symptom first. Prefer exact files, screens, routes, or tests from the prompt.
- Search for the smallest surface that can explain the failure before editing unrelated code.
- Build a short hypothesis list and eliminate entries with concrete code evidence, not guesswork.
- For mobile issues, inspect the affected screen, `src/ui`, `src/game/useGame.ts`, and persistence boundaries.
- For server issues, inspect the route, adjacent helpers in `server/src/lib`, Prisma schema if relevant, and contract tests.
- Favor targeted validation or instrumentation over broad refactors.
- If you fix the bug, keep the patch minimal and add the nearest regression test when practical.
- Final output should state the likely root cause, what was verified, what was fixed, and any residual risk.
