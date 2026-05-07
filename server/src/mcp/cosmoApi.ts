/**
 * Тонкий HTTP-клиент к Cosmo Fastify API для MCP-сервера.
 *
 * Логинится один раз через POST /auth/login (email + password из env),
 * прикладывает Bearer-токен ко всем CRM-запросам и сам пере-логинится при 401.
 */

declare const process: { stderr: { write(message: string): void } };

export interface ConfigKeyMeta {
  key: string;
  hint: string;
  overridden: boolean;
  updatedAt: string | null;
  version: number | null;
}

export interface ConfigEntry {
  key: string;
  overridden: boolean;
  data: unknown;
  version: number | null;
  updatedAt: string | null;
}

export interface ConfigUpdateResult {
  key: string;
  version: number;
  updatedAt: string;
}

export interface LocaleBundleMeta {
  id: string;
  app: string;
  namespace: string;
  locale: string;
  version: number;
  updatedAt: string;
  keyCount: number;
  translatedCount: number;
}

export interface LocaleBundle {
  id: string;
  app: string;
  namespace: string;
  locale: string;
  version: number;
  updatedAt: string;
  messages: Record<string, string | null>;
}

export interface LocaleBundleUpdateResult {
  id: string;
  app: string;
  namespace: string;
  locale: string;
  version: number;
  updatedAt: string;
}

export interface CosmoApiOptions {
  baseUrl: string;
  email: string;
  password: string;
  /** Перехватывает строки логов (по умолчанию пишет в stderr). */
  logger?: (msg: string) => void;
}

export class CosmoApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'CosmoApiError';
    this.status = status;
    this.body = body;
  }
}

export class CosmoApi {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private readonly log: (msg: string) => void;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private loginPromise: Promise<void> | null = null;

  constructor(opts: CosmoApiOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.email = opts.email;
    this.password = opts.password;
    this.log = opts.logger ?? ((m) => process.stderr.write(`${m}\n`));
  }

  /** Публичный merged-конфиг (то, что мобайл получает на /config). Без auth. */
  async getPublicConfig(): Promise<unknown> {
    return this.fetchJson('GET', '/config', { auth: false });
  }

  async listConfigKeys(): Promise<ConfigKeyMeta[]> {
    const res = (await this.fetchJson('GET', '/crm/game-config/keys')) as {
      keys: ConfigKeyMeta[];
    };
    return res.keys;
  }

  async getConfig(key: string): Promise<ConfigEntry> {
    return (await this.fetchJson(
      'GET',
      `/crm/game-config/${encodeURIComponent(key)}`,
    )) as ConfigEntry;
  }

  async putConfig(key: string, data: unknown): Promise<ConfigUpdateResult> {
    return (await this.fetchJson(
      'PUT',
      `/crm/game-config/${encodeURIComponent(key)}`,
      { body: { data } },
    )) as ConfigUpdateResult;
  }

  async deleteConfigOverride(key: string): Promise<void> {
    await this.fetchJson('DELETE', `/crm/game-config/${encodeURIComponent(key)}`, {
      expectEmpty: true,
    });
  }

  async listLocaleBundles(): Promise<LocaleBundleMeta[]> {
    const res = (await this.fetchJson('GET', '/crm/locales')) as {
      bundles: LocaleBundleMeta[];
    };
    return res.bundles;
  }

  async getLocaleBundle(
    app: string,
    namespace: string,
    locale: string,
  ): Promise<LocaleBundle> {
    return (await this.fetchJson(
      'GET',
      `/crm/locales/${encodeURIComponent(app)}/${encodeURIComponent(namespace)}/${encodeURIComponent(locale)}`,
    )) as LocaleBundle;
  }

  async putLocaleBundle(
    app: string,
    namespace: string,
    locale: string,
    messages: Record<string, string | null>,
  ): Promise<LocaleBundleUpdateResult> {
    return (await this.fetchJson(
      'PUT',
      `/crm/locales/${encodeURIComponent(app)}/${encodeURIComponent(namespace)}/${encodeURIComponent(locale)}`,
      { body: { messages } },
    )) as LocaleBundleUpdateResult;
  }

  async createLocaleKey(input: {
    app: string;
    namespace: string;
    key: string;
    baseLocale: string;
    baseValue: string;
  }): Promise<unknown> {
    return this.fetchJson('POST', '/crm/locales/keys', { body: input });
  }

  async renameLocaleKey(input: {
    app: string;
    namespace: string;
    oldKey: string;
    newKey: string;
  }): Promise<unknown> {
    return this.fetchJson('PATCH', '/crm/locales/keys', { body: input });
  }

  async deleteLocaleKey(input: {
    app: string;
    namespace: string;
    key: string;
  }): Promise<unknown> {
    return this.fetchJson('DELETE', '/crm/locales/keys', { body: input });
  }

  // ---------- internals ----------

  private async ensureAuth(): Promise<void> {
    if (this.accessToken) return;
    if (!this.loginPromise) {
      this.loginPromise = this.login().finally(() => {
        this.loginPromise = null;
      });
    }
    await this.loginPromise;
  }

  private async login(): Promise<void> {
    this.log(`[cosmo-api] login as ${this.email} -> ${this.baseUrl}/auth/login`);
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    const body = await safeJson(res);
    if (!res.ok) {
      throw new CosmoApiError(
        `Login failed (${res.status})`,
        res.status,
        body,
      );
    }

    const tokens = body as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!tokens.accessToken) {
      throw new CosmoApiError(
        'Login response missing accessToken',
        res.status,
        body,
      );
    }
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken ?? null;
  }

  private async fetchJson(
    method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    opts: { body?: unknown; auth?: boolean; expectEmpty?: boolean } = {},
  ): Promise<unknown> {
    const auth = opts.auth !== false;
    if (auth) await this.ensureAuth();

    const doRequest = async (): Promise<Response> => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
      if (auth && this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    };

    let res = await doRequest();
    if (auth && res.status === 401) {
      this.log(`[cosmo-api] 401 on ${method} ${path}, refreshing JWT`);
      this.accessToken = null;
      await this.ensureAuth();
      res = await doRequest();
    }

    if (opts.expectEmpty && res.status === 204) return null;

    const body = await safeJson(res);
    if (!res.ok) {
      throw new CosmoApiError(
        `${method} ${path} -> ${res.status}`,
        res.status,
        body,
      );
    }
    return body;
  }
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
