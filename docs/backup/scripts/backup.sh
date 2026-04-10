#!/usr/bin/env bash
# cosmo — PostgreSQL backup script
# Usage: ./backup.sh [--remote]
#   --remote  также загружает дамп в S3 (требует aws cli + BACKUP_S3_BUCKET)
#
# Env vars (переопределить в /etc/cosmo-backup.env):
#   PG_CONTAINER   — имя Docker-контейнера  (default: cosmo-postgres)
#   PG_DB          — имя базы данных        (default: cosmo_db)
#   PG_USER        — пользователь БД        (default: postgres)
#   BACKUP_DIR     — локальная папка        (default: /var/backups/cosmo/daily)
#   KEEP_DAYS      — сколько дней хранить   (default: 7)
#   BACKUP_S3_BUCKET — бакет S3 (опц.)

set -euo pipefail

# ── Конфигурация ──────────────────────────────────────────────────────────────
ENV_FILE="/etc/cosmo-backup.env"
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"

PG_CONTAINER="${PG_CONTAINER:-cosmo-postgres}"
PG_DB="${PG_DB:-cosmo_db}"
PG_USER="${PG_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/cosmo/daily}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="${BACKUP_DIR%/*}/logs"
LOG_FILE="$LOG_DIR/backup_$(date +%Y%m%d).log"

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# ── Проверка контейнера ───────────────────────────────────────────────────────
if ! docker inspect "$PG_CONTAINER" &>/dev/null; then
  log "ERROR: контейнер $PG_CONTAINER не найден"
  exit 1
fi

if ! docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" -d "$PG_DB" &>/dev/null; then
  log "ERROR: PostgreSQL недоступен в $PG_CONTAINER"
  exit 1
fi

# ── Full dump (custom format, сжатый) ─────────────────────────────────────────
DUMP_FILE="$BACKUP_DIR/cosmo_db_${TIMESTAMP}.dump"
log "Запуск full dump → $DUMP_FILE"

docker exec "$PG_CONTAINER" \
  pg_dump -U "$PG_USER" -d "$PG_DB" -Fc \
  | gzip > "${DUMP_FILE}.gz"

DUMP_SIZE=$(du -sh "${DUMP_FILE}.gz" | cut -f1)
log "Full dump завершён: ${DUMP_FILE}.gz ($DUMP_SIZE)"

# ── Schema-only dump ──────────────────────────────────────────────────────────
SCHEMA_FILE="$BACKUP_DIR/cosmo_db_schema_${TIMESTAMP}.sql"
log "Запуск schema-only dump → $SCHEMA_FILE"

docker exec "$PG_CONTAINER" \
  pg_dump -U "$PG_USER" -d "$PG_DB" --schema-only \
  | gzip > "${SCHEMA_FILE}.gz"

log "Schema dump завершён: ${SCHEMA_FILE}.gz"

# ── Ротация старых бэкапов ────────────────────────────────────────────────────
log "Ротация файлов старше $KEEP_DAYS дней в $BACKUP_DIR"
find "$BACKUP_DIR" -name "*.gz" -mtime +"$KEEP_DAYS" -delete
REMAINING=$(find "$BACKUP_DIR" -name "*.gz" | wc -l)
log "Осталось файлов после ротации: $REMAINING"

# ── Загрузка в S3 (опционально) ───────────────────────────────────────────────
if [[ "${1:-}" == "--remote" ]]; then
  if [[ -z "${BACKUP_S3_BUCKET:-}" ]]; then
    log "WARN: --remote указан, но BACKUP_S3_BUCKET не задан — пропуск"
  elif ! command -v aws &>/dev/null; then
    log "WARN: aws cli не найден — пропуск S3 upload"
  else
    S3_PREFIX="s3://$BACKUP_S3_BUCKET/cosmo/backups/daily"
    log "Загрузка в S3: $S3_PREFIX"
    aws s3 cp "${DUMP_FILE}.gz" "$S3_PREFIX/"
    log "S3 upload завершён"
  fi
fi

# ── Итог ──────────────────────────────────────────────────────────────────────
log "=== Backup OK: $TIMESTAMP ==="
