#!/usr/bin/env bash
# cosmo — проверка последнего бэкапа (запускать после backup.sh)
# Возвращает exit 0 при успехе, 1 — при ошибке (для алертов в cron)
#
# Проверяет:
#   1. Файл создан сегодня и не пустой
#   2. Дамп читается (pg_restore --list)
#   3. Схема содержит ожидаемые таблицы

set -euo pipefail

ENV_FILE="/etc/cosmo-backup.env"
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/cosmo/daily}"
PG_CONTAINER="${PG_CONTAINER:-cosmo-postgres}"
PG_USER="${PG_USER:-postgres}"

REQUIRED_TABLES=("User" "Purchase" "Wallet" "Grant" "GameplaySave" "UserConsent")

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { log "FAIL: $*"; exit 1; }

# ── 1. Найти последний full dump ───────────────────────────────────────────────
LATEST=$(find "$BACKUP_DIR" -name "cosmo_db_[0-9]*.dump.gz" -mtime -1 | sort | tail -1)

if [[ -z "$LATEST" ]]; then
  fail "Нет дампа за последние 24 часа в $BACKUP_DIR"
fi

log "Проверяю: $LATEST"

# ── 2. Размер > 10 KB ─────────────────────────────────────────────────────────
SIZE=$(stat -c%s "$LATEST" 2>/dev/null || stat -f%z "$LATEST")
if [[ "$SIZE" -lt 10240 ]]; then
  fail "Файл подозрительно маленький: ${SIZE} байт"
fi
log "Размер OK: $SIZE байт"

# ── 3. pg_restore --list (читаемость) ─────────────────────────────────────────
TMP_DUMP=$(mktemp /tmp/verify_XXXXXX.dump)
gunzip -c "$LATEST" > "$TMP_DUMP"

RESTORE_LIST=$(docker exec -i "$PG_CONTAINER" \
  pg_restore -U "$PG_USER" --list /dev/stdin < "$TMP_DUMP" 2>&1) || true

rm -f "$TMP_DUMP"

if echo "$RESTORE_LIST" | grep -qi "error"; then
  fail "pg_restore --list вернул ошибки:\n$RESTORE_LIST"
fi
log "pg_restore --list OK"

# ── 4. Проверка наличия таблиц в листинге ────────────────────────────────────
for TABLE in "${REQUIRED_TABLES[@]}"; do
  if ! echo "$RESTORE_LIST" | grep -q "TABLE DATA public $TABLE"; then
    fail "Таблица '$TABLE' не найдена в дампе"
  fi
  log "Таблица OK: $TABLE"
done

log "=== verify-backup OK: $LATEST ==="
