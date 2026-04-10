# P1 Plan: Canonical Domain + Server Separation

Дата: 2026-04-10

## Предпосылки

P1 опирается на выполненный P0:

- Есть `GameplaySaveEnvelopeV2` и единый serializer.
- Есть `Grant`-sync и mobile применяет grants idempotent.
- Telegram Mini App живет внутри `mobile/cosmo-miner` (web-target).
- Сервер больше не пишет gameplay-поля напрямую.

Если P0 еще не полностью закрыт, P1 нужно дробить на инкременты и держать feature flags.

## Цель

Снять структурный долг, который останется после P0:

1. Сделать канонический shared domain package с единым контрактом.
2. Разделить на сервере gameplay save, wallet и inventory как разные модели.
3. Убрать дублирование shop/config/XP расчетов между mobile, server и shared.
4. Свести Telegram UI к чтению канонических вычислений, а не локальных approximations.

## Нецели

- Полный server-authoritative gameplay loop.
- Полный пересбор battle/real-time combat на сервере.
- Перевод всех UI-ассетов в shared пакет.

## Канонический domain package

### Новая структура пакета

В `packages/game-domain` или расширение `packages/game-config` (решить на старте):

- `schemas` (Zod/TypeScript DTO)
- `calculators` (XP, level, shop price, effect application)
- `ids` (канонические sku и entity ids)
- `save` (contract DTO для `GameplaySaveEnvelopeV2` и `GameState`)
- `entitlements` (Grant payload DTO + semantics)

### Принцип разделения UI и domain

- Domain package хранит только numeric и deterministic данные.
- UI-атрибуты (`icon`, `image`, `lore`, `theme`, `layout`) остаются в client-specific слоях.
- Любая бизнес-логика и расчет должны быть в domain package, а не в UI.

### Прямые цели по устранению дубликатов

- `XP_THRESHOLDS` и расчет уровня живут только в domain package.
- `shop catalog` и `sku` живут только в domain package.
- `upgrades`, `player`, `research` numerical data живут только в domain package.

## Серверная сегрегация данных

### Новые модели

Добавить в Prisma:

- `GameplaySave` как отдельная таблица с `userId`, `data`, `rev`, `updatedAt`.
- `Wallet` как отдельная таблица с `userId`, `credits`.
- `Inventory` остается отдельно, но получает строгую связь с `Grant` и `Purchase`.

`UserSave` либо мигрирует в `GameplaySave`, либо остается как legacy wrapper на время миграции.

### Потоки записи

- `GameplaySave` пишет только mobile.
- `Wallet` может писать сервер только через grants, если это server-side credit (но фиксируется в `Grant` и применяется клиентом).
- Любые покупочные изменения должны идти через `Grant`.

### Принцип сериализации

- `GameplaySave` хранит `GameplaySaveEnvelopeV2` как JSON.
- `Wallet` хранит numeric счетчик для безопасных конкурирующих операций.
- `Inventory` хранит только server-side audit и entitlement history.

## Telegram и summary

### Канонические расчеты

- `/telegram/me` читает state из `GameplaySaveEnvelopeV2` и вызывает calculators из domain package.
- Telegram UI получает серверные вычисления уровня и прогресса, а не считает сам.

### Типы

- `totalEarned` и `credits` должны быть единым numeric типом во всех API.
- Любые string-суммы должны быть устранены или явно нормализованы на сервере.

## План работ

### Этап 1. Domain package

1. Создать новый пакет `packages/game-domain` или расширить `packages/game-config`.
2. Вынести `XP_THRESHOLDS`, `level calculator`, `player` schema.
3. Вынести `shop catalog` и `sku` ids.
4. Вынести `Grant` payload DTO и validators.
5. Заменить в mobile и server прямые константы на импорт из domain package.

### Этап 2. Mobile migration

1. Удалить дублирующие константы из `mobile/cosmo-miner/src/game/*`.
2. Перевести `remoteConfig` на overlay только над canonical domain data.
3. Заменить местные формулы уровня на canonical calculator.
4. Валидация save state через shared schema.

### Этап 3. Server data separation

1. Добавить новые Prisma модели `GameplaySave` и `Wallet`.
2. Добавить миграцию данных из `UserSave` в `GameplaySave`.
3. Перевести `/saves` на работу с `GameplaySave`.
4. Перевести все credit операции на `Wallet`.
5. Обновить `/telegram/me` и `/telegram/shop` чтобы читать из новых источников.

### Этап 4. Telegram runtime simplification (unified mobile/web)

1. Удалить локальные вычисления level и summary из UI.
2. Использовать готовый summary payload сервера.
3. Проверить типы и DTO в unified mobile/web runtime (`mobile/cosmo-miner/src/telegram/*`).

## Backlog задач P1 (по текущей кодовой базе)

Статусы: `Сделано`, `Частично`, `Не начато`.

1. `Не начато` — Решить: расширяем `packages/game-config` или создаем `packages/game-domain`. Owner: tech lead. Выход: ADR + выбранная структура.
2. `Не начато` — Добавить DTO/validators (save, grants, shop) в выбранный domain package. Выход: `schemas/*`, экспортируемые типы.
3. `Не начато` — Вынести `XP_THRESHOLDS` и calculator уровня в domain package. Замена импорта в mobile/server.
4. `Не начато` — Вынести canonical shop catalog + sku ids в domain package. Заменить дубли в mobile/server.
5. `Не начато` — Вынести domain‑данные `upgrades/player/research` в shared package. Удалить дубли из `mobile/cosmo-miner/src/game/*`.
6. `Не начато` — Перевести `remoteConfig` в overlay над canonical data, без локальных дубликатов.
7. `Не начато` — Ввести Prisma модели `GameplaySave` и `Wallet`. Миграция + индексы.
8. `Не начато` — Миграция данных: `UserSave` → `GameplaySave`, credits → `Wallet` (backfill + audit лог).
9. `Не начато` — Перевести `/saves` на `GameplaySave` (dual‑read/dual‑write на период стабилизации).
10. `Не начато` — Перевести credit‑операции на атомарный `Wallet` (и убрать расчет из save JSON).
11. `Частично` — `/telegram/me` summary: сейчас читает `save.data.state.*`, но без shared calculators. Перевести на canonical domain calculations.
12. `Не начато` — В Telegram UI убрать локальные вычисления уровня/summary (использовать server summary).
13. `Частично` — Фиче‑флаги P1: добавить `DOMAIN_CANONICAL_ENABLED`, `SAVE_TABLE_V2_ENABLED`, `WALLET_ENABLED`, `TELEGRAM_SUMMARY_CANONICAL`.
14. `Не начато` — Contract tests: save envelope, telegram summary, shop catalog, wallet concurrency.
15. `Не начато` — Интеграционные тесты миграции: legacy save → new tables без потерь.

## Миграция данных

### Миграция `UserSave`

1. Заморозить запись legacy `UserSave` кроме совместимости.
2. Бэкфилл: перенести `userSave.data` в `GameplaySave.data`.
3. Если `UserSave` содержит credits, синхронизировать в `Wallet` и зафиксировать в миграционном логе.
4. Включить dual-read на период стабилизации.
5. После стабилизации перевести read/write только на `GameplaySave`.

### Миграция `Wallet`

1. Создать `Wallet` с `credits`.
2. Перенести значение `credits` из сохранений.
3. Обновить все credit операции на атомарные updates `Wallet`.

## Тестирование

### Минимум contract tests

- Save envelope schema roundtrip.
- `/telegram/me` уровень и summary совпадают с mobile.
- Shop catalog выдаётся из canonical domain package.
- `Wallet` операции корректны при конкурентных запросах.

### Интеграционные проверки

1. Пользователь с legacy save мигрируется корректно и не теряет прогресс.
2. Покупки через Telegram создают grants, wallet не расходится.
3. Mobile получая grants, сохраняет save и не теряет credits.

## Acceptance criteria

P1 считается завершенным, если:

- Нет дублирующих доменных констант между mobile и server.
- Telegram summary совпадает с mobile при одном и том же save.
- `GameplaySave`, `Wallet`, `Inventory` разделены и не перетирают друг друга.
- Новая покупка добавляется через один canonical каталог и один DTO.

## Фиче-флаги

Рекомендуемые флаги для безопасного rollout:

- `DOMAIN_CANONICAL_ENABLED`
- `SAVE_TABLE_V2_ENABLED`
- `WALLET_ENABLED`
- `TELEGRAM_SUMMARY_CANONICAL`

## Риски и меры

- Риск: рассинхрон между `Wallet` и save при миграции. Мера: dual-write + audit лог.
- Риск: клиенты читают старые константы. Мера: запрет на дублирование через lint rule.
- Риск: Telegram UI зависит от локальных формул. Мера: перевести на server summary раньше остальных.

## Файлы и модули, которые будут затронуты

### Shared

- `packages/game-domain/*` или `packages/game-config/*`

### Server

- `server/prisma/schema.prisma`
- `server/prisma/migrations/*`
- `server/src/routes/saves.ts`
- `server/src/routes/telegram.ts`
- `server/src/routes/config.ts`
- `server/src/lib/fulfillment.ts`
- `server/src/lib/grants.ts`

### Mobile

- `mobile/cosmo-miner/src/game/remoteConfig.ts`
- `mobile/cosmo-miner/src/game/PLAYER.ts`
- `mobile/cosmo-miner/src/game/SHOP.ts`
- `mobile/cosmo-miner/src/game/UPGRADES.ts`
- `mobile/cosmo-miner/src/game/storage.ts`
- `mobile/cosmo-miner/src/game/types.ts`
- `mobile/cosmo-miner/src/screens/HomeScreen.tsx`
- `mobile/cosmo-miner/src/telegram/*`

## Что делать первым

1. Согласовать структуру domain package и набор canonical DTO.
2. Вынести XP/level и shop catalog в domain package.
3. Добавить `GameplaySave` и `Wallet` в Prisma, подготовить миграцию.
4. Перевести `/telegram/me` на canonical расчеты.
5. Удалить дубликаты из mobile и привязать к domain package.

## Итог

P1 превращает систему в единый доменный слой с реальным источником истины для логики, а не только для данных. После этого можно безопасно расширять магазин, баланс и синк без постоянного ручного дублирования и архитектурного drift.
