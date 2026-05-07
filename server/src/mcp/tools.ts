import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CosmoApi, CosmoApiError } from './cosmoApi.js';

/**
 * Канонический список ключей GameConfig, синхронизирован с
 * server/src/routes/config.ts CONFIG_KEYS. MCP-tool схемы используют его
 * как enum, чтобы LLM не вызывал тулы с ключами, которых сервер не знает.
 */
const CONFIG_KEYS = [
  'formulaConstants',
  'upgrades',
  'sectors',
  'expeditions',
  'shop',
  'research',
  'player',
  'modules',
  'cannons',
  'metals',
  'ships',
  'aliens',
  'achievements',
  'planets',
] as const;

type ConfigKey = (typeof CONFIG_KEYS)[number];

const KEY_HINTS: Record<ConfigKey, string> = {
  formulaConstants: 'Формулы и константы прогрессии (UPGRADE_COST_EXP и т.п.)',
  upgrades: 'Апгрейды клика и пассивного дохода',
  sectors: 'Сектора, зоны и планеты карты',
  expeditions: 'Экспедиции',
  shop: 'Конфиг магазина и металл-тиры',
  research: 'Исследования (research tree)',
  player: 'XP-кривая, MAX_LEVEL',
  modules: 'Модули корабля и их прокачка',
  cannons: 'Пушки',
  metals: 'Таблица дропа металлов по планетам',
  ships: 'Каталог кораблей',
  aliens: 'Чужие, балансы боя',
  achievements: 'Ачивки и награды за claim',
  planets: 'Оверрайды отдельных планет / тем зон',
};

const KEY_ENUM = z.enum(CONFIG_KEYS);
const LOCALE_APP_ENUM = z.enum(['mobile', 'crm']);
const LOCALE_NAMESPACE_ENUM = z.enum([
  'ui',
  'alerts',
  'intro',
  'story',
  'dialogues',
  'config',
]);
const LOCALE_CODE = z
  .string()
  .regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'Use locale format like en, ru, or en-US');
const LOCALE_KEY = z
  .string()
  .regex(
    /^[A-Za-z0-9_.:-]{1,120}$/,
    'Use translation keys with letters, digits, dots, underscores, dashes, max 120 chars',
  );
const MESSAGES_SCHEMA = z.record(z.union([z.string(), z.null()]));

function ok(payload: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function err(message: string) {
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: `ERROR: ${message}` }],
  };
}

function describeApiError(e: unknown): string {
  if (e instanceof CosmoApiError) {
    const bodyStr =
      typeof e.body === 'string' ? e.body : JSON.stringify(e.body);
    return `${e.message} body=${bodyStr}`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

function parseJsonString(value: string, label: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(
      `${label} came as a string, but it is not valid JSON. ` +
        'Pass an object/array directly or a valid JSON string.',
    );
  }
}

function normalizeJsonInput(value: unknown, label: string): unknown {
  if (typeof value !== 'string') return value;
  return parseJsonString(value, label);
}

function normalizeConfigEntryData(value: unknown): {
  data: unknown;
  dataWasJsonString: boolean;
} {
  if (typeof value !== 'string') {
    return { data: value, dataWasJsonString: false };
  }
  return { data: parseJsonString(value, 'config data'), dataWasJsonString: true };
}

/**
 * Глубокий иммутабельный merge для JSON-объектов.
 * - Объекты сливаются по ключам рекурсивно.
 * - Массивы и примитивы из patch ПОЛНОСТЬЮ заменяют значение.
 * - null в patch удаляет ключ из base.
 */
export function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(patch)) return patch;
  const baseObj = isPlainObject(base) ? base : {};
  const out: Record<string, unknown> = { ...baseObj };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) {
      delete out[k];
    } else if (isPlainObject(v) && isPlainObject(baseObj[k])) {
      out[k] = deepMerge(baseObj[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

function normalizeMessagesInput(value: unknown): Record<string, string | null> {
  const normalized = normalizeJsonInput(value, 'messages');
  if (!isPlainObject(normalized)) {
    throw new Error('messages must be a JSON object');
  }

  const out: Record<string, string | null> = {};
  for (const [key, message] of Object.entries(normalized)) {
    out[key] = typeof message === 'string' ? message : null;
  }
  return out;
}

export function registerCosmoTools(server: McpServer, api: CosmoApi): void {
  server.registerTool(
    'list_config_keys',
    {
      title: 'List GameConfig keys',
      description:
        'Возвращает список всех ключей GameConfig (formulaConstants, upgrades, sectors, ...) ' +
        'с подсказкой по содержимому, признаком override и текущей версией.',
      inputSchema: {},
    },
    async () => {
      try {
        const keys = await api.listConfigKeys();
        const enriched = keys.map((k) => ({
          ...k,
          hint: (KEY_HINTS as Record<string, string>)[k.key] ?? k.hint,
        }));
        return ok({ keys: enriched });
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'get_config',
    {
      title: 'Get GameConfig value',
      description:
        'Возвращает полный JSON конкретного ключа GameConfig (как он лежит в БД и отдаётся мобильному клиенту).',
      inputSchema: { key: KEY_ENUM },
    },
    async ({ key }: { key: ConfigKey }) => {
      try {
        const entry = await api.getConfig(key);
        const normalized = normalizeConfigEntryData(entry.data);
        return ok({
          ...entry,
          data: normalized.data,
          dataWasJsonString: normalized.dataWasJsonString,
          warning: normalized.dataWasJsonString
            ? 'This config value is stored as a JSON string. Run patch_config or update_config once to rewrite it as JSON.'
            : undefined,
        });
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'update_config',
    {
      title: 'Update GameConfig value (replace)',
      description:
        'ПОЛНОСТЬЮ заменяет JSON ключа GameConfig. Версия инкрементируется. ' +
        'Используй patch_config, если хочешь изменить только часть данных.',
      inputSchema: {
        key: KEY_ENUM,
        data: z
          .unknown()
          .describe('Новый JSON ключа целиком (любая JSON-структура).'),
      },
    },
    async ({ key, data }: { key: ConfigKey; data: unknown }) => {
      try {
        const normalizedData = normalizeJsonInput(data, 'data');
        const res = await api.putConfig(key, normalizedData);
        return ok({ status: 'updated', ...res });
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'patch_config',
    {
      title: 'Patch GameConfig value (deep merge)',
      description:
        'Глубоко мержит patch в текущее значение ключа GameConfig и сохраняет результат. ' +
        'Объекты сливаются рекурсивно; массивы и примитивы заменяются целиком; ' +
        'значение null удаляет ключ. Идеально для точечной правки констант (например, formulaConstants.UPGRADE_COST_EXP).',
      inputSchema: {
        key: KEY_ENUM,
        patch: z
          .unknown()
          .describe('JSON-патч, который будет смержен с текущим значением.'),
      },
    },
    async ({ key, patch }: { key: ConfigKey; patch: unknown }) => {
      try {
        const current = await api.getConfig(key);
        const currentData = normalizeConfigEntryData(current.data);
        const normalizedPatch = normalizeJsonInput(patch, 'patch');
        const next = deepMerge(currentData.data ?? {}, normalizedPatch);
        const res = await api.putConfig(key, next);
        return ok({
          status: 'patched',
          ...res,
          previousVersion: current.version,
          fixedJsonStringStorage: currentData.dataWasJsonString,
          mergedData: next,
        });
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'delete_config_override',
    {
      title: 'Delete GameConfig override',
      description:
        'Удаляет строку GameConfig для ключа в БД. После этого /config начнёт возвращать ' +
        'ошибку, пока не будет выполнен `npm run db:seed` (который восстановит дефолтные значения).',
      inputSchema: { key: KEY_ENUM },
    },
    async ({ key }: { key: ConfigKey }) => {
      try {
        await api.deleteConfigOverride(key);
        return ok({ status: 'deleted', key });
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'get_public_config',
    {
      title: 'Get merged public /config',
      description:
        'Возвращает merged-payload, который сервер отдаёт мобильному клиенту по GET /config ' +
        '(все ключи + monetizationEnabled + version/generatedAt). Полезно, чтобы посмотреть, ' +
        'что игрок реально увидит после правок.',
      inputSchema: {},
    },
    async () => {
      try {
        const cfg = await api.getPublicConfig();
        return ok(cfg);
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'list_locale_bundles',
    {
      title: 'List locale bundles',
      description:
        'Возвращает список всех translation bundles с метаданными: app, namespace, locale, version, keyCount, translatedCount. ' +
        'Можно отфильтровать по app/namespace/locale на стороне MCP.',
      inputSchema: {
        app: LOCALE_APP_ENUM.optional(),
        namespace: LOCALE_NAMESPACE_ENUM.optional(),
        locale: LOCALE_CODE.optional(),
      },
    },
    async ({
      app,
      namespace,
      locale,
    }: {
      app?: string;
      namespace?: string;
      locale?: string;
    }) => {
      try {
        const bundles = await api.listLocaleBundles();
        return ok({
          bundles: bundles.filter((bundle) => {
            if (app && bundle.app !== app) return false;
            if (namespace && bundle.namespace !== namespace) return false;
            if (locale && bundle.locale !== locale) return false;
            return true;
          }),
        });
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'get_locale_bundle',
    {
      title: 'Get locale bundle',
      description:
        'Возвращает полный messages object для конкретного translation bundle, например mobile/ui/en.',
      inputSchema: {
        app: LOCALE_APP_ENUM,
        namespace: LOCALE_NAMESPACE_ENUM,
        locale: LOCALE_CODE,
      },
    },
    async ({
      app,
      namespace,
      locale,
    }: {
      app: string;
      namespace: string;
      locale: string;
    }) => {
      try {
        const bundle = await api.getLocaleBundle(app, namespace, locale);
        return ok(bundle);
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'update_locale_bundle',
    {
      title: 'Update locale bundle (replace messages)',
      description:
        'ПОЛНОСТЬЮ заменяет messages object для translation bundle. ' +
        'Для точечной правки одного ключа сначала вызови get_locale_bundle, измени messages, потом update_locale_bundle.',
      inputSchema: {
        app: LOCALE_APP_ENUM,
        namespace: LOCALE_NAMESPACE_ENUM,
        locale: LOCALE_CODE,
        messages: MESSAGES_SCHEMA.or(z.string()).describe(
          'Messages object: { "key.path": "translation" }. JSON-string тоже будет распарсена.',
        ),
      },
    },
    async ({
      app,
      namespace,
      locale,
      messages,
    }: {
      app: string;
      namespace: string;
      locale: string;
      messages: unknown;
    }) => {
      try {
        const normalizedMessages = normalizeMessagesInput(messages);
        const res = await api.putLocaleBundle(
          app,
          namespace,
          locale,
          normalizedMessages,
        );
        return ok({ status: 'updated', ...res });
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'create_locale_key',
    {
      title: 'Create locale key',
      description:
        'Создаёт новый translation key во всех существующих локалях выбранного app+namespace. ' +
        'В baseLocale ставит baseValue, в остальные локали пустую строку.',
      inputSchema: {
        app: LOCALE_APP_ENUM,
        namespace: LOCALE_NAMESPACE_ENUM,
        key: LOCALE_KEY,
        baseLocale: LOCALE_CODE,
        baseValue: z.string().min(1),
      },
    },
    async (input: {
      app: string;
      namespace: string;
      key: string;
      baseLocale: string;
      baseValue: string;
    }) => {
      try {
        const res = await api.createLocaleKey(input);
        return ok(res);
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'rename_locale_key',
    {
      title: 'Rename locale key',
      description:
        'Переименовывает translation key во всех locale bundles выбранного app+namespace.',
      inputSchema: {
        app: LOCALE_APP_ENUM,
        namespace: LOCALE_NAMESPACE_ENUM,
        oldKey: LOCALE_KEY,
        newKey: LOCALE_KEY,
      },
    },
    async (input: {
      app: string;
      namespace: string;
      oldKey: string;
      newKey: string;
    }) => {
      try {
        const res = await api.renameLocaleKey(input);
        return ok(res);
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );

  server.registerTool(
    'delete_locale_key',
    {
      title: 'Delete locale key',
      description:
        'Удаляет translation key из всех locale bundles выбранного app+namespace.',
      inputSchema: {
        app: LOCALE_APP_ENUM,
        namespace: LOCALE_NAMESPACE_ENUM,
        key: LOCALE_KEY,
      },
    },
    async (input: { app: string; namespace: string; key: string }) => {
      try {
        const res = await api.deleteLocaleKey(input);
        return ok(res);
      } catch (e) {
        return err(describeApiError(e));
      }
    },
  );
}
