---
name: Auth & Cloud Saves Implementation
description: Бэкенд авторизации (JWT + OAuth) и cloud save API, интеграция в мобильный клиент
type: project
---

Реализован полный бэкенд авторизации и облачных сохранений прогресса игры.

**Why:** прогресс терялся при смене устройства; нужна синхронизация между сессиями.

**How to apply:** при изменениях в auth/saves/oauth маршрутах — исходить из этой архитектуры, не ломать обратную совместимость контракта.

## Стек

- Server: Fastify 5 + TypeScript, PostgreSQL + Prisma, argon2, @fastify/jwt, @fastify/rate-limit, jose
- Client: новый модуль `cloudSave.ts`, изменены `App.tsx` (startup sync + autosave)

## Файлы сервера

- `server/prisma/schema.prisma` — модели: `User` (passwordHash nullable), `OAuthAccount`, `RefreshToken`, `UserSave`
- `server/src/lib/prisma.ts` — singleton PrismaClient
- `server/src/lib/tokens.ts` — shared `issueTokens(app, userId)` → { accessToken, refreshToken }
- `server/src/plugins/jwt.ts` — fastify-plugin: регистрирует @fastify/jwt + декоратор `app.authenticate`
- `server/src/routes/auth.ts` — POST /auth/register, /auth/login, /auth/refresh, GET /auth/me
- `server/src/routes/oauth.ts` — POST /auth/oauth (Google + Apple ID token exchange)
- `server/src/routes/saves.ts` — GET /saves, PUT /saves (оптимистичный rev)
- `server/src/index.ts` — подключает rate-limit, jwtPlugin, все роуты
- `server/.env.example` — DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_IDS, APPLE_BUNDLE_ID

## API контракт

| Метод | Путь | Тело / Auth |
|---|---|---|
| POST | /auth/register | { email, password } |
| POST | /auth/login | { email, password } |
| POST | /auth/refresh | { refreshToken } |
| POST | /auth/oauth | { provider: "google"\|"apple", idToken } |
| GET | /auth/me | Bearer token |
| GET | /saves | Bearer token |
| PUT | /saves | Bearer token + { data: StoredGameV1, rev?: number } |

- 409 на PUT /saves если `rev` не совпадает с серверным
- rate limit: 5 req/min на register + login; 10 req/min на oauth; 120 req/min глобально

## Токены

- access-токен: JWT RS256, TTL 1h, payload `{ userId }`
- refresh-токен: random hex, TTL 30 дней, хранится в БД (таблица RefreshToken), ротируется при каждом /auth/refresh

## Клиент (`cloudSave.ts`)

Экспортирует:
- `cloudRegister`, `cloudLogin` — email/password auth
- `cloudOAuth(provider, idToken)` — OAuth flow
- `storeTokens`, `clearTokens`, `getAccessToken` — управление токенами (AsyncStorage, MVP)
- `fetchCloudSave` — GET /saves
- `pushCloudSave(payload, rev?)` — PUT /saves
- `getCloudRev` — локально закэшированный rev

## App.tsx интеграция

**Startup:** `getAccessToken()` → если есть токен, `fetchCloudSave()` → берём более свежее по `savedAt` (cloud vs local).

**Autosave (каждые 3 сек):** `saveGame` (локально) + fire-and-forget `pushCloudSave` с текущим `rev`.

## Миграции

```bash
cd server
npx prisma migrate dev --name init              # первый запуск
npx prisma migrate dev --name add_oauth_accounts # после добавления OAuth
```
