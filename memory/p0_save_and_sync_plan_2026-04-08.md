# P0 Plan: Save-Contract и Cross-Client Sync

Дата: 2026-04-08

## Цель

Закрыть два критических риска:

1. Потеря и перетирание игрового состояния из-за плавающего save-contract.
2. Ложная и небезопасная интеграция между Telegram shop/inventory и mobile gameplay.

План ниже сознательно ограничен `P0`: он не переводит всю игру в server-authoritative модель и не тащит большой платформенный рефакторинг. Задача этого этапа — стабилизировать контракты, убрать второго writer-а у gameplay-save и сделать безопасный канал доставки покупок в mobile.

## Актуализация клиентской схемы

На текущий момент Telegram Mini App больше не рассматривается как отдельный клиентский проект.

Актуальная и целевая для `P0` схема такая:

- Telegram Mini App собирается из `mobile/cosmo-miner` как web-target;
- это нормальное и ожидаемое состояние, а не временный компромисс;
- `P0` не должен возвращать отдельный `telegram/cosmo-tg`;
- все Telegram-specific UI, auth и purchase-flow изменения в рамках `P0` вносятся в unified mobile/web client.

## Выбранное решение

### Решение по save

Оставляем `PUT /saves` как full replace, но только для полного, версионированного snapshot.

Ключевое правило:

- `mobile` является единственным writer-ом gameplay-save.
- `server` не пишет gameplay-поля напрямую в `userSave`.
- Telegram purchase flow не мутирует `userSave` напрямую.

### Решение по sync

Не используем `Inventory` как источник sync для mobile.

Вместо этого вводим отдельный поток `Grant`:

- сервер при покупке создает grant;
- mobile подтягивает grants после последнего примененного курсора;
- mobile применяет grants к локальному state;
- mobile сохраняет полный gameplay snapshot;
- только после успешного сохранения/синхронизации mobile подтверждает grants серверу.

Это позволяет сохранить одно правило владения:

- gameplay-save пишет только mobile;
- commerce-события генерирует только сервер.

## Почему именно так

### Почему не `PATCH/MERGE` для `/saves`

Потому что merge полезен, когда несколько writers легитимно пишут один документ. Сейчас это и есть корневая проблема. Если первым шагом ввести merge, конфликт writers останется, просто станет менее очевидным.

Для `P0` проще и надежнее:

- один owner документа,
- полный snapshot,
- optimistic concurrency по `rev`.

### Почему не использовать текущий `Inventory` как sync-source

Текущая `Inventory` модель плохо подходит для exactly-once применения в mobile:

- она хранит агрегированные количества, а не дискретные grants;
- при падении клиента между consume/save легко получить дублирование или потерю.

`Grant` с монотонным курсором решает эту проблему проще и надежнее.

### Почему не выносить всю экономику на сервер уже сейчас

Это уже `P1/P2`, а не `P0`.

Сейчас кредиты меняются из нескольких источников:

- achievements (ачивки),
- rewarded ads,
- native IAP,
- Telegram Stars покупки.

Для `P0` достаточно сделать безопасную доставку server-side grants и прекратить прямые server writes в `userSave`.

## Scope

### Входит в `P0`

- единый save serializer/deserializer;
- полный `GameplaySaveV2`;
- серверная валидация save envelope;
- исправление чтения summary из save envelope;
- grant-sync API;
- mobile apply/ack grants;
- отключение или фильтрация неподдержанных Telegram SKU;
- исправление misleading copy про "automatic sync".

### Не входит в `P0`

- полный shared package для всех domain-contracts;
- consumption-инвентарь как полноценный домен;
- полный рефакторинг Telegram inventory UI;
- выделение Telegram Mini App обратно в отдельный клиент;
- миграция всего gameplay loop на сервер.

## Целевое состояние

### 1. Канонический save envelope

Новый контракт:

```ts
type GameplaySaveEnvelopeV2 = {
  version: 2;
  savedAt: number;
  appliedGrantSeq: number;
  state: GameStateInit;
};
```

Смысл:

- `version`: версия save-контракта;
- `savedAt`: timestamp последнего локального snapshot;
- `appliedGrantSeq`: до какого server grant mobile уже применил изменения;
- `state`: полный gameplay snapshot.

### 2. Кто чем владеет

`mobile` владеет:

- `energy`
- `totalEarned`
- `clicks`
- `upgrades`
- `unlockedPlanetIds`
- `selectedPlanetId`
- `achievements`
- `metals`
- `discoveredMetals`
- `fleet`
- `battle`
- `playerXP`
- `research`
- `expeditions`
- `tabsUnlocked`
- `moduleLevels`
- `chosenCharacterId`
- `metalDealDone`
- `battlesWon`
- `battleWinStreak`
- `credits`
- `activeBoosts`

`server` владеет:

- `Purchase`
- `Grant`
- `ShopItem` catalog
- Telegram payment lifecycle

`server` не пишет напрямую:

- `credits` в `userSave`
- `metals` в `userSave`
- `activeBoosts` в `userSave`
- любые другие gameplay-поля

## Архитектура grants

### Новая модель

Нужна отдельная таблица `Grant`:

```prisma
model Grant {
  id            String   @id @default(cuid())
  userId        String
  seq           Int
  kind          String
  payload       Json
  source        String?
  purchaseId    String?
  ackedAt       DateTime?
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, seq])
  @@index([userId, ackedAt, seq])
}
```

Примечания:

- `seq` должен быть монотонным в рамках пользователя;
- `ackedAt = null` означает pending grant;
- `payload` хранит уже детерминированную доставку, без повторного roll на клиенте.

### Типы grants

В `P0` нужны только поддержанные типы:

- `credits_grant`
- `metal_grant`
- `booster_grant`

Правила:

- неподдержанные эффекты не должны превращаться в grants.

### Что делать с `Inventory`

На `P0`:

- `Inventory` перестает быть sync-source;
- `Inventory` можно оставить как серверный audit/read model для Telegram UI;
- но delivery в mobile идет только через `Grant`.

Это важно, чтобы не перепутать “что куплено” и “что уже применено в gameplay”.

## API-план

### 1. `/saves`

Оставляем один endpoint, но меняем правила:

- `PUT /saves` принимает только полный envelope;
- сервер валидирует `version`, `savedAt`, `appliedGrantSeq`, `state`;
- partial payload считается ошибкой контракта;
- `rev` остается для optimistic concurrency.

Дополнительно:

- `GET /saves` возвращает полный envelope как есть;
- summary-роуты читают `save.data.state.*`, а не корень envelope.

### 2. Новый sync endpoint

Предлагаемый минимальный API:

- `GET /sync/grants?afterSeq=<n>`
- `POST /sync/grants/ack`

Контракт:

```ts
GET /sync/grants?afterSeq=17
-> { grants: GrantDto[] }

POST /sync/grants/ack
body: { upToSeq: 21 }
-> { ok: true }
```

Почему `upToSeq`, а не список id:

- mobile все равно должен применять grants последовательно;
- это проще для клиента и сервера;
- это сокращает размер ack payload;
- это облегчает observability.

### 3. `/telegram/me`

Нужно исправить summary extraction.

Сейчас сервер читает поля как будто `save.data` — это сам state, хотя фактически там envelope.

После фикса summary должен читать:

- `save.data.state.playerXP`
- `save.data.state.totalEarned`
- `save.data.state.credits`
- `save.data.state.unlockedPlanetIds`

Плюс:

- summary-контракт должен быть согласован по типам;
- `totalEarned` должен возвращаться в одном типе во всех клиентах.

### 4. `/telegram/shop`

Нужно фильтровать каталог по delivery support.

Для `P0` не стоит добавлять новое Prisma-поле. Достаточно положить `deliveryMode` в `ShopItem.metadata`, например:

- `grant_sync`
- `unsupported`
- `server_only`

И фильтровать выдачу каталога на сервере.

## План по mobile

В этом разделе `mobile` означает единый клиент `mobile/cosmo-miner`, который обслуживает:

- native mobile runtime;
- web runtime;
- Telegram Mini App runtime на web.

### 1. Убрать двойную сериализацию save

Сейчас локальный save и cloud autosave формируются по-разному. Это надо убрать.

Нужен один модуль, условно:

- `serializeGameplaySaveV2(state, appliedGrantSeq)`
- `deserializeGameplaySaveEnvelope(raw)`

Его должны использовать:

- local storage;
- cloud save push;
- cloud save load;
- grant apply pipeline.

### 2. Изменить bootstrap flow

Новый порядок старта:

1. Загрузить local save.
2. Загрузить cloud save.
3. Выбрать более новый snapshot.
4. Прочитать `appliedGrantSeq`.
5. Запросить pending grants после этого курсора.
6. Последовательно применить grants к state.
7. Сохранить новый full snapshot локально.
8. При наличии токена — push snapshot в `/saves`.
9. Только после успешного save/push отправить `ack`.

Критичное правило:

- если шаги 7-8 не завершились успешно, `ack` не отправлять.

### 3. Правила применения grants

`credits_grant`

- `state.credits += amount`

`metal_grant`

- добавить металлы;
- обновить `discoveredMetals`

`booster_grant`

- превратить в `ActiveBoost`;
- `instanceId` должен быть детерминированным, например `grant_<seq>`;
- `expiresAt` вычислять от времени применения на клиенте

### 4. Autosave

Новый autosave не должен вручную собирать урезанный объект.

Он должен:

- брать текущий state;
- брать текущий `appliedGrantSeq`;
- сериализовать `GameplaySaveEnvelopeV2`;
- сохранять локально и пушить в cloud.

## План по Telegram Mini App в mobile/web

### 1. Немедленный safety fix

До запуска mobile grant sync:

- убрать из UI утверждения про automatic sync;
- убрать или скрыть SKU, которые не доставляются в mobile end-to-end.

Если придерживаться строгой безопасной позиции, до релиза mobile sync надо скрыть весь gameplay-affecting каталог Telegram shop.

### 2. После запуска grant sync

Разрешить только те SKU, для которых mobile имеет детерминированный apply path:

- credit packs через `credits_grant`
- metal packs через `metal_grant`
- boosters через `booster_grant`

Оставить скрытыми:

- `premium_sector_skip`
- `premium_research_reset`
- любые другие эффекты без реализованного mobile handler

### 3. Copy и комментарии

Нужно привести тексты и комментарии в соответствие реальности в unified mobile/web клиенте:

- Telegram web UI внутри `mobile/cosmo-miner` не обещает sync до его появления;
- комментарии в `mobile/cosmo-miner/src/telegram/*` и связанных UI-модулях не утверждают, что inventory уже синкается в mobile.

## План по серверу

### 1. Fulfillment

`fulfillPurchase()` меняется так:

- не пишет `userSave`;
- создает `Grant`;
- при необходимости продолжает писать `Inventory` как audit-модель;
- остается идемпотентным по purchase/charge id.

### 2. Credits purchase flow

Покупка кредитов осуществляется через Telegram Stars (покупка credit packs).
Отдельный purchase-flow “за кредиты” в P0 не поддерживается.

- сервер создает purchase;
- сервер создает grant;
- сервер не правит gameplay-save;
- mobile получает результат через sync.

### 3. Транзакции

Нужно убрать использование глобального `prisma` внутри транзакционного куска fulfillment.

Для `P0`:

- `grant creation`
- `purchase completion`
- опциональная `inventory` запись

должны жить в одной транзакции через один `tx`.

## Миграция

### Фаза 0. Safety gate

Сразу перед разработкой:

- убрать misleading copy в Telegram;
- включить флаг скрытия неподдержанных SKU.

Это снижает риск продавать то, что еще не доставляется надежно.

### Фаза 1. Server-first

1. Добавить Prisma migration с `Grant`.
2. Исправить `/telegram/me`, чтобы он читал envelope правильно.
3. Добавить grant API.
4. На сервере добавить поддержку `GameplaySaveEnvelopeV2`.
5. Оставить временную обратную совместимость с `v1`.

### Фаза 2. Mobile release

1. Ввести единый serializer.
2. Перевести local save и cloud save на `v2`.
3. Добавить bootstrap/apply/ack grants.
4. Перевести autosave на full snapshot.
5. Выпустить это в unified `mobile/web` клиент, не ломая Telegram runtime.

### Фаза 3. Telegram catalog reopen

1. Включить только `grant_sync` SKU.
2. Проверить end-to-end delivery в Telegram Mini App, собранном из `mobile` для web.
3. Оставить unsupported entitlements скрытыми.

### Фаза 4. Cleanup

После окна стабилизации:

- перестать принимать урезанные/старые форматы;
- убрать legacy-ветки `v1`;
- при необходимости переработать `Inventory` в purchase history.

## Rollback

### Rollback-принципы

Rollback не должен приводить к потере grants.

Поэтому:

- grants нельзя удалять при сбое клиента;
- ack отправляется только после успешного save;
- pending grants должны переживать отключение фичи.

### Практический rollback

Нужны feature flags:

- `SAVE_V2_ENABLED`
- `GRANT_SYNC_ENABLED`
- `TELEGRAM_SHOP_SYNC_ONLY`

Rollback server:

- отключить `GRANT_SYNC_ENABLED`;
- оставить grants в pending состоянии;
- скрыть gameplay-affecting Telegram shop;
- оставить `/saves` совместимым с последним стабильным форматом.

Rollback mobile:

- откатить релиз;
- не отправлять `ack`;
- pending grants останутся на сервере и смогут быть повторно применены после фикса.

## Testing / Acceptance

### Обязательные проверки

1. Save roundtrip сохраняет все поля runtime-state.
2. Cloud save больше не теряет `credits`, `activeBoosts`, `tabsUnlocked`, `discoveredMetals`.
3. `/telegram/me` показывает реальные данные из envelope, а не нули по default.
4. Покупка через Telegram создает grant, но не мутирует `userSave`.
5. Mobile применяет grant ровно один раз.
6. Повторный запуск после падения не дублирует reward.
7. Unsupported SKU не попадают в каталог.

### Acceptance criteria

Считать `P0` завершенным можно только если:

- ни один серверный flow больше не пишет gameplay-поля напрямую в `userSave`;
- mobile cloud autosave использует тот же полный envelope, что и local save;
- Telegram UI не обещает синк, которого нет;

## Файлы и модули, которые почти наверняка будут затронуты

### Server

- `server/prisma/schema.prisma`
- `server/prisma/seed.ts`
- `server/src/routes/saves.ts`
- `server/src/routes/telegram.ts`
- `server/src/lib/fulfillment.ts`
- `server/src/lib/inventory.ts`
- новый модуль, например `server/src/lib/grants.ts`
- новый роут, например `server/src/routes/sync.ts`

### Mobile

- `mobile/cosmo-miner/App.tsx`
- `mobile/cosmo-miner/src/game/storage.ts`
- `mobile/cosmo-miner/src/game/cloudSave.ts`
- `mobile/cosmo-miner/src/game/types.ts`
- `mobile/cosmo-miner/src/screens/ShopScreen.tsx`
- `mobile/cosmo-miner/src/telegram/StarsShopTab.tsx`
- `mobile/cosmo-miner/src/telegram/auth.ts`
- `mobile/cosmo-miner/src/telegram/runtime.ts`
- новый модуль serializer/contract
- новый модуль grant apply/sync

Отдельного блока `Telegram` здесь больше нет, потому что Telegram Mini App живет внутри `mobile/cosmo-miner` как web-runtime.

## Что я бы сделал первым

Если выполнять это как инженерный rollout, порядок такой:

1. Исправить copy и скрыть неподдержанный Telegram catalog.
2. Исправить envelope-reading bug в `/telegram/me`.
3. Ввести единый `GameplaySaveEnvelopeV2`.
4. Перевести mobile autosave на полный snapshot.
5. Добавить `Grant`.
6. Перевести fulfillment на grants.
7. Реализовать mobile bootstrap/apply/ack.
8. Переоткрыть только supported SKU.

## Итог

`P0` здесь не про “сделать магазин удобнее”. Он про то, чтобы снова сделать систему детерминированной:

- один writer для gameplay-save;
- один контракт snapshot;
- один безопасный канал доставки server-side покупок в mobile.

Пока этого нет, любые новые SKU, новые клиенты и новые фичи синка будут увеличивать риск потери состояния. После выполнения этого плана дальнейший `P1` уже можно будет делать без постоянной борьбы с расхождением между mobile, Telegram и сервером.

Важно: в рамках этого плана “Telegram” не означает отдельный frontend-репозиторий или отдельное приложение. Это один из runtime-режимов unified клиента `mobile/cosmo-miner`, собранного для web.
