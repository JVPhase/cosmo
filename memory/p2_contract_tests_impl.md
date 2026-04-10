---
name: P2 Contract Tests Implementation
description: Реализованы contract-тесты P2 для server/mobile/telegram. Статус, расположение файлов, инструкция запуска, известные блокеры.
type: project
---

P2 contract tests реализованы 2026-04-10.

**Why:** Стабилизировать контракты между mobile/server/telegram чтобы любой drift ломал CI.

**How to apply:** Перед изменением domain-типов, save envelope, grant payloads или /telegram/me — запустить `pnpm test:contract`. Красный тест = явное изменение контракта требует обновления тестов.

## Расположение файлов

```
server/
  .env.test                              # тест-переменные (DATABASE_URL=cosmo_test)
  scripts/test-db-setup.ts              # мигрирует тест-БД
  test/
    setup.ts                             # re-export всех helpers
    helpers/app.ts                       # buildApp() — Fastify без listen
    helpers/db.ts                        # createTestUser/Save/ShopItem/Purchase + cleanupUser
    helpers/auth.ts                      # signToken(app, userId)
    fixtures/saves.ts                    # MINIMAL_V2_ENVELOPE, V2_LEVEL_1/2/3, INVALID_*
    contract/
      config.test.ts                     # GET /config — структура + player snapshot
      saves.test.ts                      # PUT/GET /saves — roundtrip, 400, 409
      telegram.me.test.ts                # /telegram/me — level calculator, number types
      purchase.fulfillment.test.ts       # fulfillPurchase() — все 4 типа + idempotency
      grants.mapping.test.ts             # server payloads + mobile applyGrants
mobile/cosmo-miner/src/game/__tests__/
  grants.apply.test.ts                   # mobile applyGrants — чистые юнит-тесты (опц.)
```

## Запуск

```bash
# 1. Поднять postgres
cd server && npm run db:up

# 2. Создать тест-БД и мигрировать (один раз)
npm run db:test:setup

# 3. Запустить contract tests
npm run test:contract

# С деталями:
npm run test:contract:verbose
```

## Test runner
Node.js built-in `node:test` + `tsx --env-file=.env.test --test`
(совпадает с runner'ом packages/game-config)

## Что защищено
- `/config`: структура payload, числовые типы, player.xpThresholds snapshot
- `/saves`: V2 envelope roundtrip, appliedGrantSeq как number, 400/409 validation
- `/telegram/me`: level через canonical XP_THRESHOLDS, totalEarned/credits как numbers
- purchase fulfillment: все 4 типа grants, idempotency, UserSave не мутируется
- grants mapping: server payload shape + mobile applyGrants применяет корректно

## БЛОКЕР: нет Zod в game-config
`packages/game-config/src/schemas.ts` явно пишет "No Zod runtime validators here".
Zod-валидация заменена структурными assert-проверками. P1 требует добавить Zod.

## Тест-БД
Отдельный Postgres: `cosmo_test`. Настраивается через `server/.env.test`.
Тесты чистят свои данные через `cleanupUser(userId)` (cascade delete).
