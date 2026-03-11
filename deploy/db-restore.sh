#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./deploy/db-restore.sh <dump_file> [db_name] [db_user] [db_host] [db_port]
# Example:
#   ./deploy/db-restore.sh /var/backups/mototom/mototom_20260311_120000.dump mototom mototom_user 127.0.0.1 5432

if [[ $# -lt 1 ]]; then
  echo "Ошибка: укажите путь к .dump файлу"
  echo "Пример: ./deploy/db-restore.sh /path/to/file.dump mototom mototom_user 127.0.0.1 5432"
  exit 1
fi

DUMP_FILE="${1}"
DB_NAME="${2:-mototom}"
DB_USER="${3:-postgres}"
DB_HOST="${4:-127.0.0.1}"
DB_PORT="${5:-5432}"

if [[ ! -f "${DUMP_FILE}" ]]; then
  echo "Файл не найден: ${DUMP_FILE}"
  exit 1
fi

echo "[1/3] Завершаю активные подключения к БД ${DB_NAME}"
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -v ON_ERROR_STOP=1 -c \
"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();"

echo "[2/3] Пересоздаю БД ${DB_NAME}"
dropdb --if-exists -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"
createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"

echo "[3/3] Восстанавливаю из дампа ${DUMP_FILE}"
pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -v \
  "${DUMP_FILE}"

echo "Готово"
