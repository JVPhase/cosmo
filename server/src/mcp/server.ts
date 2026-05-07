/**
 * MCP-сервер для управления параметрами игры Cosmo.
 *
 * Транспорт: stdio (для Claude Desktop / других MCP-клиентов).
 * Разговаривает с running Cosmo Fastify-сервером через CRM REST API
 * (/auth/login + /crm/game-config/*), используя email/пароль CRM-админа.
 *
 * Запуск (локально):
 *   COSMO_API_BASE_URL=http://localhost:3000 \
 *   COSMO_CRM_EMAIL=admin@example.com \
 *   COSMO_CRM_PASSWORD=... \
 *   npm run mcp
 *
 * Логи идут в stderr, чтобы не ломать JSON-RPC поверх stdout.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CosmoApi } from './cosmoApi.js';
import { registerCosmoTools } from './tools.js';

function readRequiredEnv(name: string): string {
  const v = process.env[name];
  if (typeof v !== 'string' || v.trim() === '') {
    process.stderr.write(
      `[cosmo-mcp] missing required env var ${name}. ` +
        `See server/src/mcp/README.md for setup.\n`,
    );
    process.exit(1);
  }
  return v.trim();
}

async function main() {
  const baseUrl = process.env.COSMO_API_BASE_URL?.trim() || 'http://localhost:3000';
  const email = readRequiredEnv('COSMO_CRM_EMAIL');
  const password = readRequiredEnv('COSMO_CRM_PASSWORD');

  process.stderr.write(
    `[cosmo-mcp] starting, baseUrl=${baseUrl}, account=${email}\n`,
  );

  const api = new CosmoApi({ baseUrl, email, password });

  const server = new McpServer({
    name: 'cosmo-game-config',
    version: '0.1.0',
  });

  registerCosmoTools(server, api);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write('[cosmo-mcp] connected via stdio, ready\n');
}

main().catch((err) => {
  process.stderr.write(
    `[cosmo-mcp] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
  );
  process.exit(1);
});
