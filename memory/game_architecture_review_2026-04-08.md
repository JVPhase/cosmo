# Архитектурное ревью игры

Дата: 2026-04-08

## Краткий вывод

Текущая архитектура уже распалась на три разных модели истины:

1. `mobile/cosmo-miner` как fat client с локальным игровым движком, локальным save и частичным cloud save.
2. `telegram/cosmo-tg` как thin client для профиля, магазина и inventory.
3. `server` как backend для auth, cloud save, remote config и Telegram-commerce.

Это рабочая схема для MVP, но сейчас она несогласованна по контрактам: клиентское runtime-state, серверный `userSave`, серверный `inventory` и общий `game-config` уже живут по разным правилам. Главный риск не в том, что логика где-то сложная, а в том, что разные части системы считают себя источником истины для одних и тех же сущностей.

## Текущая картина

### Клиент

- `mobile/cosmo-miner` содержит почти весь игровой движок прямо на клиенте: UI, локальную модель состояния, расчеты прогрессии, магазин, боевку, remote config и cloud save. Это видно по корневому `App.tsx`, который тянет почти все экраны и game-модули сразу: `mobile/cosmo-miner/App.tsx:1-110`.
- `telegram/cosmo-tg` является отдельным клиентом с другой ролью: auth-gate, профиль, shop и inventory без собственно геймплейного цикла: `telegram/cosmo-tg/src/App.tsx:1-52`.
- На клиенте уже есть попытка общего конфига через `@cosmo/game-config` + remote config, но mobile все равно хранит локальные копии игровых сущностей и только накладывает на них remote-числа: `mobile/cosmo-miner/src/game/remoteConfig.ts:1-95`, `server/src/routes/config.ts:1-87`.

### Сервер

- Сервер аккуратно разделен по маршрутам: `/config`, `/auth`, `/saves`, `/telegram`: `server/src/index.ts:1-34`.
- На уровне доменов сервер обслуживает сразу несколько контекстов:
  - identity/auth,
  - cloud save,
  - remote config,
  - Telegram shop / purchases / inventory.
- На уровне данных это уже не один bounded context: `UserSave`, `ShopItem`, `Purchase`, `Inventory`, `GameConfig` живут отдельно: `server/prisma/schema.prisma:73-140`.

## Findings

### 1. Critical: контракт сохранения игры не совпадает с runtime-state и серверной моделью

Проблема:

- Runtime-state mobile-клиента содержит `discoveredMetals`, `tabsUnlocked`, `moduleLevels`, `chosenCharacterId`, `metalDealDone`, `battlesWon`, `battleWinStreak`, `credits`, `activeBoosts`: `mobile/cosmo-miner/src/game/types.ts:34-90`, `mobile/cosmo-miner/src/game/useGame.ts:168-193`, `mobile/cosmo-miner/src/game/useGame.ts:278-285`.
- Но автосохранение в `App.tsx` отправляет только урезанный `snapshot`, где этих полей нет: `mobile/cosmo-miner/App.tsx:232-263`.
- При этом `saveGame()` ожидает более полную модель и сериализует дополнительные поля: `mobile/cosmo-miner/src/game/storage.ts:97-123`.
- Серверный `/saves` делает full overwrite всего JSON-блоба, а не merge: `server/src/routes/saves.ts:20-50`.

Последствие:

- часть состояния теряется между runtime и persistence;
- cloud autosave может перетирать серверные изменения;
- серверные кредиты, выданные магазином, могут быть затерты следующим автосейвом мобильного клиента.

Это сейчас главный архитектурный дефект, потому что проблема уже лежит на стыке mobile, storage и server, а не в одном модуле.

### 2. Critical: серверный commerce и mobile-геймплей не соединены реальным sync-потоком

Проблема:

- Telegram mini-app прямо декларирует, что покупки синкаются в mobile save через inventory API: `telegram/cosmo-tg/src/store/gameStore.ts:1-10`.
- Платежный поток тоже считает server inventory целевым местом доставки: `telegram/cosmo-tg/src/services/payment.ts:1-10`.
- UI Telegram пишет пользователю, что items автоматически попадут в mobile game: `telegram/cosmo-tg/src/screens/HomeScreen.tsx:60-64`.
- Но mobile-клиент знает только `/auth`, `/saves`, `/auth/oauth` и не содержит интеграции с `/telegram/inventory` или consumption pipeline для server inventory: `mobile/cosmo-miner/src/game/cloudSave.ts:56-175`.

Последствие:

- обещанный sync между двумя клиентами архитектурно не реализован;
- inventory уже стал отдельной серверной моделью, но mobile по-прежнему живет так, будто inventory не существует.

### 3. High: магазин и entitlement-модель расходятся между mobile, shared config и server seed

Проблема:

- shared shop уже описан в `@cosmo/game-config`: `packages/game-config/src/shop.ts:1-61`.
- mobile хранит собственную локальную копию того же каталога с теми же id и credit prices, но с другими name/icon/lore и с локальным исполнением эффектов: `mobile/cosmo-miner/src/game/SHOP.ts:38-220`.
- сервер дополнительно сидит на третьем каталоге `SHOP_ITEMS`, где дублируются `priceCredits`, вводятся `priceStars`, metadata и extra items: `server/prisma/seed.ts:63-260`.
- сервер продает `premium_sector_skip`, `premium_research_reset`, `credits_1000`, `credits_10000`: `server/prisma/seed.ts:207-259`.
- mobile shop union вообще не знает `premium_*`, а локальные credit packs имеют другой ассортимент: `mobile/cosmo-miner/src/game/SHOP.ts:38-51`, `mobile/cosmo-miner/src/game/CREDIT_PACKS.ts:3-8`, `mobile/cosmo-miner/src/game/CREDIT_PACKS.ts:25-74`.

Последствие:

- один и тот же домен "магазин" описан тремя разными структурами;
- часть SKU существует только на сервере;
- часть SKU существует только в mobile IAP;
- добавление новой покупки требует ручной синхронизации минимум в 2-3 местах.

### 4. High: shared config есть, но фактического single source of truth для игрового баланса нет

Проблема:

- сервер раздает remote config из `@cosmo/game-config`: `server/src/routes/config.ts:1-87`.
- mobile при этом хранит локальные копии апгрейдов, XP-порогов, магазина и других сущностей и накладывает на них remote-данные только частично: `mobile/cosmo-miner/src/game/remoteConfig.ts:10-48`.
- примеры прямого дублирования:
  - `packages/game-config/src/upgrades.ts:1-15` и `mobile/cosmo-miner/src/game/UPGRADES.ts:3-148`
  - `packages/game-config/src/player.ts:1-104` и `mobile/cosmo-miner/src/game/PLAYER.ts:3-107`
  - `packages/game-config/src/shop.ts:4-61` и `mobile/cosmo-miner/src/game/SHOP.ts:56-220`

Последствие:

- `@cosmo/game-config` не является каноническим domain-layer;
- это скорее еще один набор defaults, который легко разъезжается с mobile;
- любое балансное изменение требует ручной проверки нескольких копий сущности.

### 5. High: Telegram-клиент использует упрощенные и местами неверные доменные вычисления

Проблема:

- `telegram/cosmo-tg` хранит `gameSummary.totalEarned` как `string`: `telegram/cosmo-tg/src/types.ts:21-27`.
- серверный summary-контракт тоже ожидает строку и дефолтится к `'0'`, хотя mobile сохраняет `totalEarned` как `number`: `server/src/routes/telegram.ts:139-147`, `mobile/cosmo-miner/src/game/types.ts:35-37`.
- уровень в Telegram считается по приближенной логарифмической формуле, хотя shared `XP_THRESHOLDS` уже существует: `telegram/cosmo-tg/src/screens/HomeScreen.tsx:9-15`, `packages/game-config/src/player.ts:1-104`.

Последствие:

- Telegram UI может показывать другой level, чем mobile;
- контракт summary уже дрейфует по типам;
- "тонкий" клиент вынужден заново принимать доменные решения, которые уже есть в общей модели.

### 6. High: транзакционная граница на сервере проведена не там, где декларируется

Проблема:

- `fulfillPurchase()` заявляет, что все mutations атомарны внутри транзакции: `server/src/lib/fulfillment.ts:41-42`.
- но `addToInventory()` использует глобальный `prisma`, а не `tx`, то есть фактическая запись inventory происходит вне этой транзакции: `server/src/lib/fulfillment.ts:77-85`, `server/src/lib/inventory.ts:29-44`.

Последствие:

- purchase completion и inventory delivery не являются реально атомарными;
- при ошибках и retry можно получить частично примененное состояние.

### 7. Medium: покупка за кредиты читает баланс вне транзакции и может разъехаться при конкуренции

Проблема:

- `/telegram/shop/buy-credits` читает `userSave` до транзакции, вычисляет `currentCredits`, а внутри транзакции пишет результат на основе уже устаревшего snapshot: `server/src/routes/telegram.ts:257-293`.

Последствие:

- при двух одновременных запросах возможны lost update и overspend;
- проблема усугубляется тем, что кредиты хранятся внутри общего JSON-save, а не в отдельном счетчике.

### 8. Medium: нет contract/integration тестов на критические стыки

По репозиторию не видно ни unit-, ни integration-, ни contract-тестов для:

- save schema,
- remote config payload,
- Telegram purchase flow,
- inventory -> mobile sync,
- типов summary / level / credits.

На текущей стадии без тестов архитектурный drift будет только ускоряться.

## Дублирование

### Клиентское дублирование

- Полные локальные копии игровых сущностей в mobile рядом с shared package:
  - upgrades,
  - player xp thresholds,
  - shop,
  - ships,
  - cannons,
  - modules,
  - metals,
  - planets,
  - aliens,
  - research.

Паттерн почти везде одинаковый:

1. В `packages/game-config` лежит numeric/shared data.
2. В `mobile/src/game/*` лежит второй объект той же сущности.
3. `remoteConfig` потом поверх локальной копии накладывает часть числовых полей.

Это удобно для UI-атрибутов, но сейчас превращает client domain model в ручной merge нескольких источников.

### Серверное дублирование

- `GameConfig` в БД дублирует `@cosmo/game-config` как fallback: `server/src/routes/config.ts:30-77`.
- `ShopItem` seed дублирует `SHOP_DATA`, но уже в другом формате и с дополнительной коммерческой семантикой: `server/prisma/seed.ts:63-260`.

### Межклиентское дублирование

- Mobile и Telegram оба знают про кредиты и часть shop-domain, но используют разные модели, разные sku и разные потоки доставки.

## Несостыковки

### Клиент vs сервер

- mobile считает себя owner полного game state;
- server считает себя owner cloud save, credits и inventory;
- Telegram считает, что inventory автоматически синкается в mobile, но такого канала нет.

### Shared config vs mobile runtime

- shared package уже описывает баланс;
- mobile повторно описывает те же сущности и частично мержит remote config;
- фактический canonical domain schema отсутствует.

### Telegram summary vs mobile save

- `totalEarned` на сервере и в Telegram typed как `string`, в mobile как `number`;
- level в Telegram вычисляется approximation-формулой вместо общего threshold-based расчета.

### Shop/inventory vs gameplay

- server продает premium unlocks и inventory items;
- mobile не содержит завершенной модели применения server inventory к локальному gameplay state.

## Отдельно по клиенту

### Что хорошо

- Mobile-клиент уже организован как полноценный self-contained game runtime.
- Telegram-клиент изолирован по роли и не пытается дублировать весь геймплей.
- Есть зачаток shared package для баланса и remote config.

### Что плохо

- Mobile слишком много знает: UI, domain logic, persistence, sync, shop effects и часть коммерции.
- Telegram слишком мало знает о канонических доменных вычислениях и вынужден импровизировать.
- Между mobile и Telegram отсутствует общий application-layer для entitlements / inventory / sync.

## Отдельно по серверу

### Что хорошо

- Маршруты разделены по сценариям.
- Prisma schema уже выделяет config, save, purchases и inventory как разные модели.
- Есть хорошее направление в сторону server-side commerce.

### Что плохо

- `userSave` перегружен: в нем одновременно живут cloud save клиента и серверные коммерческие данные.
- inventory и purchase domain уже выделены отдельно, но mobile-контур на них не замкнут.
- Транзакционные и конкурентные гарантии пока слабые.

## Рекомендации по приоритету

### P0

Сделать единый save-contract и прекратить full overwrite урезанным snapshot.

- Или mobile пушит полный `GameStateInit`.
- Или сервер хранит gameplay save отдельно от server-authoritative economy/inventory.
- Или PUT `/saves` заменяется на patch/merge по whitelist-полям.

### P0

Либо реализовать реальный inventory sync в mobile, либо убрать из Telegram утверждение про автоматический sync и временно не продавать entitlements, которые mobile не умеет применить.

### P1

Выделить канонический shared domain package.

- schemas,
- calculators,
- ids/sku,
- level/xp logic,
- save DTO,
- shop entitlement DTO.

UI-поля вроде `icon`, `image`, `lore` можно держать отдельно, но numeric/domain contract должен быть один.

### P1

Разделить на сервере:

- `GameplaySave`
- `Wallet/Credits`
- `Inventory/Entitlements`

Иначе commerce и cloud save будут продолжать перетирать друг друга.

### P2

Добавить contract tests минимум на:

- `/config`,
- `/saves`,
- `/telegram/me`,
- purchase fulfillment,
- mapping inventory -> mobile state.

## Итог

Архитектурно проект уже не "монолитная игра с беком", а система из двух клиентов и backend-платформы. Кодовая база это еще не признала до конца: shared config неполный, save-contract плавает, commerce уже серверный, а gameplay еще локально-автономный.

Если коротко, то главный долг сейчас не в производительности и не в структуре папок, а в отсутствии одного канонического доменного контракта между:

- mobile runtime,
- cloud save,
- Telegram shop/inventory,
- shared config.

Пока этот контракт не выровнен, любое новое расширение магазина, синка или баланса будет добавлять не функциональность, а вероятность потери состояния и расхождения между клиентами.
