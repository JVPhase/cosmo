# Cosmo Game Config MCP Server

Локальный [MCP](https://modelcontextprotocol.io/) сервер, который даёт LLM-агенту
(Claude Desktop, Cursor и т.п.) безопасный канал для управления параметрами игры
Cosmo через CRM REST API.

## Что он умеет

Все инструменты ходят в **запущенный Fastify-сервер** (`server/`) от имени CRM-админа
и работают через CRM REST API.

GameConfig:

- `list_config_keys` — список всех ключей (`formulaConstants`, `upgrades`, `shop`, …) с метаданными.
- `get_config` — полный JSON конкретного ключа.
- `update_config` — полная замена JSON ключа (инкрементит `version`).
- `patch_config` — глубокий merge JSON-патча в текущее значение (точечная правка).
- `delete_config_override` — удаляет строку из БД (после этого нужен `npm run db:seed`).
- `get_public_config` — merged-payload, который реально получит мобайл с `GET /config`.

Translations:

- `list_locale_bundles` — список bundles с метаданными (`app`, `namespace`, `locale`, `version`, counts).
- `get_locale_bundle` — полный messages object для bundle, например `mobile/ui/en`.
- `update_locale_bundle` — полная замена messages object.
- `patch_locale_messages` — точечно обновить/удалить много ключей в нескольких локалях без пересылки всего bundle.
- `create_locale_key` — создать ключ во всех локалях namespace.
- `rename_locale_key` — переименовать ключ во всех локалях namespace.
- `delete_locale_key` — удалить ключ во всех локалях namespace.

Скоуп намеренно ограничен `GameConfig` и `LocaleBundle`.
Он НЕ трогает игровые сейвы, кошельки или Stars Shop.

## Как это устроено

```text
┌────────────────┐  stdio   ┌──────────────────┐  HTTP   ┌──────────────┐
│ Claude Desktop │◄────────►│ cosmo-mcp        │◄───────►│ Cosmo Fastify │
│ (MCP client)   │          │ (этот пакет)      │  Bearer │ /auth/login   │
└────────────────┘          │ tsx src/mcp/...  │  JWT    │ /crm/game-...  │
                            └──────────────────┘         └──────────────┘
```

MCP-сервер логинится один раз через `POST /auth/login`, использует полученный JWT для
всех `/crm/game-config/*` вызовов и автоматически перелогинивается при `401`.

## Требования

1. Запущенный Cosmo-сервер (`cd server && npm run dev` или dev-stack).
2. CRM-аккаунт (`prisma.crmUser` с любой ролью; для всех операций GameConfig
   достаточно `viewer`/`member`/`admin`). Bootstrap-учётка создаётся через
   `CRM_ADMIN_EMAIL` / `CRM_ADMIN_PASSWORD` в `.env.dev-server`.

## Конфигурация

Через переменные окружения (см. `.env.dev-server.example`):

| Env                   | По умолчанию              | Описание                                 |
| --------------------- | ------------------------- | ---------------------------------------- |
| `COSMO_API_BASE_URL`  | `http://localhost:3000`   | Базовый URL Fastify-сервера.             |
| `COSMO_CRM_EMAIL`     | — (обязательна)           | Email CRM-аккаунта.                      |
| `COSMO_CRM_PASSWORD`  | — (обязательна)           | Пароль того же аккаунта.                 |

## Запуск вручную

```bash
cd server
npm install                  # подтянет @modelcontextprotocol/sdk и zod
COSMO_API_BASE_URL=http://localhost:3000 \
COSMO_CRM_EMAIL=admin@example.com \
COSMO_CRM_PASSWORD=dev-admin-password \
npm run mcp
```

Сервер слушает stdio (его не нужно открывать в браузере). В stderr печатаются
диагностические сообщения вида `[cosmo-mcp] connected via stdio, ready`.

Type-check (без реального запуска):

```bash
npm run mcp:typecheck
```

## Подключение к Claude Desktop

Открой `~/Library/Application Support/Claude/claude_desktop_config.json` и добавь:

```json
{
  "mcpServers": {
    "cosmo-game-config": {
      "command": "/usr/local/bin/npm",
      "args": ["--silent", "--prefix", "/ABSOLUTE/PATH/TO/cosmo/server", "run", "mcp"],
      "env": {
        "COSMO_API_BASE_URL": "http://localhost:3000",
        "COSMO_CRM_EMAIL": "admin@example.com",
        "COSMO_CRM_PASSWORD": "..."
      }
    }
  }
}
```

После рестарта Claude Desktop в чате появятся инструменты с префиксом
`cosmo-game-config`. Можешь, например, попросить:

> Покажи текущий `formulaConstants` и подними `UPGRADE_COST_EXP` с 1.7 до 1.75.

Агент сам вызовет `get_config` → `patch_config`.

Или:

> Покажи переводы `mobile/ui/en` и добавь ключ `tabs.shipyard`.

Для пакетной точечной записи переводов MCP вызывает `patch_locale_messages`, например:

```json
{
  "app": "mobile",
  "namespace": "ui",
  "updates": {
    "en": {
      "upgrade.15.name": "Quantum Drill",
      "upgrade.15.lore": "A compact rig that folds spacetime around ore veins."
    },
    "ru": {
      "upgrade.15.name": "Квантовый бур",
      "upgrade.15.lore": "Компактная установка, сворачивающая пространство вокруг рудных жил."
    }
  }
}
```

## Подключение к Cursor

Аналогично, в `~/.cursor/mcp.json` (или через UI настроек) добавь блок `cosmoServers`
с тем же `command`/`args`/`env`.

## Безопасность

- Использует **обычный CRM JWT**, поэтому подчиняется тем же ролевым ограничениям,
  что и CRM-веб (`requireCrmAccess`).
- Никогда не запускай его с прод-кредами на пользовательской машине без необходимости.
- Все мутирующие действия (`update_config`, `patch_config`, `delete_config_override`)
  логируются Fastify-сервером как обычные CRM-запросы.
- При желании можно добавить `MCP_READ_ONLY=true` в env и расширить
  `tools.ts` — текущая реализация этого флага не имеет.

## Полезные паттерны

- **Точечная правка константы** — самый частый кейс:

  ```jsonc
  // tool: patch_config
  { "key": "formulaConstants", "patch": { "UPGRADE_COST_EXP": 1.75 } }
  ```

- Если MCP-клиент случайно передал `data` или `patch` как JSON-строку
  (`"{\"UPGRADE_COST_EXP\":1.75}"`), сервер распарсит её перед сохранением. Если в БД
  уже лежит JSON-строка вместо объекта, следующий `patch_config` или `update_config`
  перезапишет значение обратно как нормальный JSON.

- **Откат правки** — если до этого был `db:seed`, можно либо `update_config` с заведомо
  правильным JSON, либо `delete_config_override` + `npm run db:seed`.

- **Проверка “что увидит игрок”** — после правки вызывай `get_public_config`. Учти,
  что Fastify отвечает на `/config` с `Cache-Control: public, max-age=3600`,
  поэтому реальные клиенты могут какое-то время держать старый payload в HTTP-кеше.
