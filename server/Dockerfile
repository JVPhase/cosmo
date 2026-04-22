# Build from repository root: docker compose build server
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY packages/game-config ./packages/game-config
COPY mobile/cosmo-miner/src/game/CHARACTERS.ts ./mobile/cosmo-miner/src/game/CHARACTERS.ts
COPY mobile/cosmo-miner/assets ./mobile/cosmo-miner/assets

COPY server/package.json server/package-lock.json ./server/

WORKDIR /app/server
RUN npm ci

COPY server/ ./

# Windows CRLF в .sh ломает shebang в Linux («no such file or directory»)
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
