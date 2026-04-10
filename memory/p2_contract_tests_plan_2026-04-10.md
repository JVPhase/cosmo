# P2 Plan: Contract Tests (API + Domain)

Дата: 2026-04-10

## Предпосылки

P2 опирается на P0 и P1:

- Есть `GameplaySaveEnvelopeV2` и единый serializer (P0).
- Есть grant-sync и mobile применяет grants idempotent (P0).
- Канонический domain package создан и используется (P1).
- `/telegram/me` читает канонические вычисления (P1).
- На сервере `GameplaySave`, `Wallet`, `Inventory` разделены (P1).

Если P1 еще не полностью закрыт, P2 нужно запускать поэтапно, начиная с контрактов, которые уже стабилизированы.

## Цель

Стабилизировать контракты на стыке mobile/server/telegram через минимальный набор contract-тестов, которые ловят drift в:

- `/config`
- `/saves`
- `/telegram/me`
- purchase fulfillment
- mapping inventory/grants -> mobile state

## Нецели

- Полное unit-покрытие доменной логики.
- UI/e2e тесты.
- Переписывание бизнес-логики под тесты.

## Принципы

- Проверяем контракты и типы, а не внутренние имплементации.
- Минимум snapshot’ов; snapshots только на стабильные, маленькие payload’ы.
- Все тесты должны быть детерминированными и изолированными.
- Любая эволюция контракта должна ломать тест и требовать явного изменения схемы.

## Стек и инфраструктура (предлагаемый минимум)

- Runner: `vitest` или `jest` (выбрать единый, если в репо уже есть).
- Test DB: `SQLite` (локально) или `Postgres` (через docker) — выбрать на старте.
- Вынести `fixtures` и `helpers` для повторного создания user/save/grants.
- Prisma test connection с чистой БД на тестовый прогон.

Выход:

- `server/test/helpers/*`
- `server/test/fixtures/*`
- `server/test/setup.ts`

## Контракт 1: `/config`

### Что проверяем

- Payload соответствует canonical domain schema.
- Типы numeric остаются numeric (нет string-представлений).
- В payload нет legacy/неиспользуемых полей.

### Тесты

1. `GET /config` валидируется Zod-схемой domain package.
2. Минимальный snapshot (ключевые секции, не весь payload).

Файл:

- `server/test/contract/config.test.ts`

## Контракт 2: `/saves`

### Что проверяем

- `PUT /saves` принимает только полный `GameplaySaveEnvelopeV2`.
- Валидация `version`, `savedAt`, `appliedGrantSeq`, `state`.
- `GET /saves` возвращает ровно тот же envelope (roundtrip).

### Тесты

1. Валидный envelope -> `PUT` -> `GET` соответствует input.
2. Partial/invalid envelope -> 400.
3. `appliedGrantSeq` остается number.

Файл:

- `server/test/contract/saves.test.ts`

## Контракт 3: `/telegram/me`

### Что проверяем

- Summary использует canonical calculators.
- `totalEarned`, `credits` — числовые типы.
- Уровень считается через `XP_THRESHOLDS`, не approximation.

### Тесты

1. Подготовить save c известным `playerXP` -> `/telegram/me` возвращает ожидаемый `level`.
2. Сверка с calculator из domain package.

Файл:

- `server/test/contract/telegram.me.test.ts`

## Контракт 4: Purchase fulfillment

### Что проверяем

- Purchase создает `Grant` с детерминированным payload.
- `GameplaySave` не мутируется сервером.
- Idempotency на повторный purchase/charge.

### Тесты

1. Purchase -> создан `Grant`, payload соответствует SKU.
2. Повторный вызов -> нет дублей grant, корректный status.
3. `GameplaySave` не изменился.

Файл:

- `server/test/contract/purchase.fulfillment.test.ts`

## Контракт 5: mapping inventory/grants -> mobile state

### Что проверяем

- Grants apply детерминированно и дают корректный state.
- `booster` instanceId детерминирован (`grant_<seq>`).

### Тесты

1. `credits_grant` увеличивает `credits`.
2. `metal_grant` добавляет металлы и в `discoveredMetals`.
3. `booster_grant` создает `ActiveBoost` с детерминированным id.
4. `loot_box_reward_grant` применяется без локального roll.

Файлы:

- `server/test/contract/grants.mapping.test.ts`
- (опционально) `mobile/cosmo-miner/src/game/__tests__/grants.apply.test.ts`

## CI-интеграция

1. Добавить `pnpm test:contract` (или эквивалент).
2. Прогон в CI на PR.
3. Явные шаги: migrate DB -> seed -> run tests.

## Acceptance criteria

P2 считается завершенным, если:

- Все 5 контрактных наборов тестов проходят стабильно.
- Любая смена contract ломает тесты (и требует явного обновления схем).
- `/telegram/me` и `/config` валидируются схемами domain package.
- Purchase fulfillment не мутирует gameplay-save.

## Риски и меры

- Риск: unstable data в `/config`.
  Мера: fixture + точечные snapshots.

- Риск: тесты привязаны к имплементации.
  Мера: проверяем только контракты и вычисления, не внутренние детали.

## Backlog P2 (минимальный)

Статусы: `Не начато`.

1. `Не начато` — Выбрать runner и test DB, зафиксировать в ADR.
2. `Не начато` — Поднять test infrastructure (fixtures/helpers/setup).
3. `Не начато` — Реализовать contract tests: `/config`.
4. `Не начато` — Реализовать contract tests: `/saves`.
5. `Не начато` — Реализовать contract tests: `/telegram/me`.
6. `Не начато` — Реализовать contract tests: purchase fulfillment.
7. `Не начато` — Реализовать contract tests: grants mapping.
8. `Не начато` — Добавить CI job `test:contract`.

## Итог

P2 фиксирует контракты между mobile/server/telegram и делает архитектуру устойчивой к дрейфу. Это минимальный, но жесткий контрольный контур перед дальнейшими изменениями экономики, магазина и синка.
