# Build context: repository root (see docker-compose.yml).
# Game (Expo Web) is served from the site root; CRM (Vite) can be embedded under /crm/.

FROM node:22-bookworm-slim AS game-builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY packages/game-config ./packages/game-config

COPY mobile/cosmo-miner/package.json mobile/cosmo-miner/package-lock.json ./mobile/cosmo-miner/

WORKDIR /app/mobile/cosmo-miner
RUN npm ci

COPY mobile/cosmo-miner/ ./

ARG EXPO_PUBLIC_API_URL=http://localhost:3000
ARG EXPO_PUBLIC_CONFIG_URL=http://localhost:3000/config
ARG EXPO_PUBLIC_TELEGRAM_TEST_MODE=false
ARG EXPO_PUBLIC_TELEGRAM_TEST_INIT_DATA=
ARG EXPO_PUBLIC_TELEGRAM_TEST_INVOICE_STATUS=cancelled
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_CONFIG_URL=$EXPO_PUBLIC_CONFIG_URL
ENV EXPO_PUBLIC_TELEGRAM_TEST_MODE=$EXPO_PUBLIC_TELEGRAM_TEST_MODE
ENV EXPO_PUBLIC_TELEGRAM_TEST_INIT_DATA=$EXPO_PUBLIC_TELEGRAM_TEST_INIT_DATA
ENV EXPO_PUBLIC_TELEGRAM_TEST_INVOICE_STATUS=$EXPO_PUBLIC_TELEGRAM_TEST_INVOICE_STATUS
ENV CI=true

RUN npx expo export --platform web

FROM node:22-bookworm-slim AS crm-builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY crm/package.json crm/package-lock.json ./crm/

WORKDIR /app/crm
RUN npm ci

COPY crm/ ./

# Strip BOM from JSON files because PostCSS/Vite may choke on Windows copies.
RUN for f in package.json components.json package-lock.json; do \
      [ -f "$$f" ] && sed -i '1s/^\xEF\xBB\xBF//' "$$f" || true; \
    done

ARG VITE_API_URL=http://localhost:3000
ARG VITE_APP_BASE=/crm/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_BASE=$VITE_APP_BASE

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=game-builder /app/mobile/cosmo-miner/dist /usr/share/nginx/html
COPY --from=crm-builder /app/crm/dist /usr/share/nginx/html/crm
COPY mobile/cosmo-miner/docker/nginx-default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
