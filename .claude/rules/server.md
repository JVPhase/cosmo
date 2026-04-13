---
paths:
  - "server/**/*.{ts,js,json,prisma,sql,md}"
---

# Server Rules

- Use `npm` inside `server`.
- Stack: Fastify + Prisma + TypeScript. The main entrypoint is `server/src/index.ts`.
- For API or data changes, inspect the route handler, related helpers in `server/src/lib`, Prisma schema or migrations, and the matching contract tests in `server/test/contract`.
- Treat `server/.env.test` as test-only configuration. Do not infer production secrets from real `.env` files.
- Prefer `npm run test:contract` for server behavior changes and `npm run build` for type or build validation.
