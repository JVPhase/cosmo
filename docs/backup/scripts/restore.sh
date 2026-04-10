#!/usr/bin/env bash
# cosmo — PostgreSQL restore script
# Usage: ./restore.sh <path_to_dump.dump.gz> [--drop-existing]
#
#   --drop-existing  удаляет и пересоздаёт БД перед восстановлением
#                    (ОСТОРОЖНО: уничтожает текущие данные)
#
# Env vars (переопределить в /etc/cosmo-backup.env):
#   PG_CONTAINER  — имя Docker-контейнера (default: cosmo-postgres)
#   PG_DB         — имя базы данных       (default: cosmo_db)
#   PG_USER       — пользователь БД       (default: postgres)

set -euo pipefail

ENV_FILE="/etc/cosmo-backup.env"
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"

PG_CONTAINER="${PG_CONTAINER:-cosmo-postgres}"
PG_DB="${PG_DB:-cosmo_db}"
PG_USER="${PG_USER:-postgres}"

DUMP_FILE="${1:-}"
DROP_EXISTING="${2:-}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── Валидация аргументов ──────────────────────────────────────────────────────
if [[ -z "$DUMP_FILE" ]]; then
  echo "Usage: $0 <dump.dump.gz> [--drop-existing]"
  exit 1
fi

if [[ ! -f "$DUMP_FILE" ]]; then
  log "ERROR: файл не найден: $DUMP_FILE"
  exit 1
fi

# ── Проверка контейнера ───────────────────────────────────────────────────────
if ! docker inspect "$PG_CONTAINER" &>/dev/null; then
  log "ERROR: контейнер $PG_CONTAINER не найден. Запустите: docker compose up -d postgres"
  exit 1
fi

if ! docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" &>/dev/null; then
  log "ERROR: PostgreSQL не готов. Подождите и повторите."
  exit 1
fi

# ── Предупреждение ────────────────────────────────────────────────────────────
log "ВНИМАНИЕ: восстановление перезапишет данные в БД '$PG_DB'"
log "Файл дампа: $DUMP_FILE"
read -r -p "Продолжить? [yes/N] " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { log "Отменено пользователем"; exit 0; }

# ── Создание временного бэкапа текущего состояния ────────────────────────────
SAFETY_DUMP="/tmp/cosmo_pre_restore_$(date +%Y%m%d_%H%M%S).dump.gz"
log "Создание страховочного дампа → $SAFETY_DUMP"
docker exec "$PG_CONTAINER" \
  pg_dump -U "$PG_USER" -d "$PG_DB" -Fc \
  | gzip > "$SAFETY_DUMP" 2>/dev/null || log "WARN: страховочный дамп не удался (возможно, БД пуста)"

# ── Drop + recreate (если запрошено) ─────────────────────────────────────────
if [[ "$DROP_EXISTING" == "--drop-existing" ]]; then
  log "Удаление БД '$PG_DB'..."
  docker exec "$PG_CONTAINER" \
    psql -U "$PG_USER" -d postgres \
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$PG_DB' AND pid <> pg_backend_pid();"
  docker exec "$PG_CONTAINER" \
    dropdb -U "$PG_USER" --if-exists "$PG_DB"
  docker exec "$PG_CONTAINER" \
    createdb -U "$PG_USER" "$PG_DB"
  log "БД пересоздана"
fi

# ── Восстановление ────────────────────────────────────────────────────────────
log "Восстановление дампа..."

# Распаковать во временный файл внутри контейнера
TMP_DUMP=$(docker exec "$PG_CONTAINER" mktemp /tmp/restore_XXXXXX.dump)

gunzip -c "$DUMP_FILE" \
  | docker exec -i "$PG_CONTAINER" bash -c "cat > $TMP_DUMP"

docker exec "$PG_CONTAINER" \
  pg_restore -U "$PG_USER" -d "$PG_DB" \
  --no-owner --no-privileges \
  --exit-on-error \
  "$TMP_DUMP"

docker exec "$PG_CONTAINER" rm -f "$TMP_DUMP"

# ── Проверка ──────────────────────────────────────────────────────────────────
TABLE_COUNT=$(docker exec "$PG_CONTAINER" \
  psql -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")

log "Таблиц после восстановления: $TABLE_COUNT"

ROW_SAMPLE=$(docker exec "$PG_CONTAINER" \
  psql -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM \"User\";")

log "Пользователей в БД: $ROW_SAMPLE"
log "=== Restore OK ==="
log "Страховочный дамп сохранён: $SAFETY_DUMP"
log "Следующий шаг: cd server && npx prisma migrate deploy"
