# Чек-лист теста восстановления — Cosmo PostgreSQL

> Проводить: раз в месяц (или после каждого крупного изменения схемы).  
> Исполнитель: @jvphase  
> Время: ~45 мин

---

## Подготовка

- [ ] Убедиться, что тест проводится **не на prod-БД**
- [ ] Зафиксировать текущую дату и версию дампа для восстановления
- [ ] Запустить тестовый контейнер PostgreSQL:
  ```bash
  docker run -d --name cosmo-pg-test \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=cosmo_db_test \
    -p 5433:5432 \
    postgres:16-alpine
  ```
- [ ] Дождаться готовности:
  ```bash
  docker exec cosmo-pg-test pg_isready -U postgres
  ```

---

## Восстановление

- [ ] Найти последний дамп:
  ```bash
  ls -lht /var/backups/cosmo/daily/*.dump.gz | head -5
  ```
- [ ] Запустить `verify-backup.sh` — убедиться что дамп читаем:
  ```bash
  docs/backup/scripts/verify-backup.sh
  ```
- [ ] Восстановить в тестовую БД:
  ```bash
  PG_CONTAINER=cosmo-pg-test PG_DB=cosmo_db_test \
    docs/backup/scripts/restore.sh \
    /var/backups/cosmo/daily/<latest>.dump.gz \
    --drop-existing
  ```
  Ожидаемый результат: `=== Restore OK ===`

---

## Проверка данных

- [ ] Количество таблиц совпадает с prod:
  ```bash
  docker exec cosmo-pg-test \
    psql -U postgres -d cosmo_db_test -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
  ```
- [ ] Проверить ключевые таблицы (хотя бы одна запись):
  ```bash
  # Пользователи
  docker exec cosmo-pg-test psql -U postgres -d cosmo_db_test -c 'SELECT count(*) FROM "User";'
  # Покупки
  docker exec cosmo-pg-test psql -U postgres -d cosmo_db_test -c 'SELECT count(*) FROM "Purchase";'
  # Кошельки
  docker exec cosmo-pg-test psql -U postgres -d cosmo_db_test -c 'SELECT count(*) FROM "Wallet";'
  # Гранты
  docker exec cosmo-pg-test psql -U postgres -d cosmo_db_test -c 'SELECT count(*) FROM "Grant";'
  # Согласия
  docker exec cosmo-pg-test psql -U postgres -d cosmo_db_test -c 'SELECT count(*) FROM "UserConsent";'
  ```
- [ ] Данные `Wallet.credits` выглядят корректно (не нули, не отрицательные):
  ```bash
  docker exec cosmo-pg-test psql -U postgres -d cosmo_db_test -c \
    'SELECT min(credits), max(credits), avg(credits) FROM "Wallet";'
  ```

---

## Проверка миграций

- [ ] Применить Prisma migrate против тестовой БД:
  ```bash
  DATABASE_URL="postgresql://postgres:postgres@localhost:5433/cosmo_db_test" \
    npx prisma migrate deploy --schema server/prisma/schema.prisma
  ```
  Ожидаемый результат: `All migrations have been applied` (или `No pending migrations`)

---

## Smoke-тест сервера (опционально)

- [ ] Временно запустить сервер против тестовой БД:
  ```bash
  DATABASE_URL="postgresql://postgres:postgres@localhost:5433/cosmo_db_test" \
    node server/dist/index.js &
  SERVER_PID=$!
  curl -sf http://localhost:3000/health && echo "OK" || echo "FAIL"
  kill $SERVER_PID
  ```

---

## Завершение

- [ ] Удалить тестовый контейнер:
  ```bash
  docker rm -f cosmo-pg-test
  ```
- [ ] Зафиксировать результат в таблице ниже
- [ ] При обнаружении проблем — открыть задачу до следующего теста

---

## Журнал тестов

| Дата | Дамп от | Исполнитель | Результат | Примечания |
|---|---|---|---|---|
| 2026-04-11 | — | @jvphase | — | Первичная настройка |
| | | | | |
