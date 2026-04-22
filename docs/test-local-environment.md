# Local Test Environment

Production-like local test stack that uses the same HTTP port as production without TLS:

- `http://localhost` -> Caddy -> server

This stack is separate from `compose.prod.yml` and `compose.dev-server.yml`.

## Start

```bash
docker compose --env-file .env.test-local -f compose.test-local.yml up -d --build
```

## Stop

```bash
docker compose --env-file .env.test-local -f compose.test-local.yml down
```

## Logs

```bash
docker compose --env-file .env.test-local -f compose.test-local.yml logs -f
```

## Notes

- Project name: `cosmo-testlocal`
- Public port: `80`
- Database is isolated in its own Docker volume
- Intended for local staging-style checks before running the real production stack
- Current CORS setup allows Expo web from `http://localhost:8080`
