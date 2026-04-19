# Local Dev Server

Separate Docker environment for backend development without touching `compose.prod.yml`.

## Start

```bash
docker compose --env-file .env.dev-server -f compose.dev-server.yml up -d --build
```

## Endpoints

- API: `http://localhost:3002`
- Health: `http://localhost:3002/health`
- PostgreSQL: `localhost:5433`

## Stop

```bash
docker compose --env-file .env.dev-server -f compose.dev-server.yml down
```

## Logs

```bash
docker compose --env-file .env.dev-server -f compose.dev-server.yml logs -f server
```

## Notes

- The stack uses project name `cosmo-devserver`, so it can run separately from the production stack.
- The `server` container runs with `NODE_ENV=development` and starts `npm run dev`.
- Source code from `server/` and `packages/game-config/` is bind-mounted into the container for backend edits.
- If you change backend dependencies, rebuild the image:

```bash
docker compose --env-file .env.dev-server -f compose.dev-server.yml build server
```

- If you add Prisma migrations, apply them inside the dev stack:

```bash
docker compose --env-file .env.dev-server -f compose.dev-server.yml exec server npx prisma migrate dev
```
