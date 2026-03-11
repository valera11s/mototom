#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./deploy/db-dump.sh [db_name] [db_user] [db_host] [db_port] [output_dir]
# Example:
#   ./deploy/db-dump.sh mototom mototom_user 127.0.0.1 5432 /var/backups/mototom

DB_NAME="${1:-mototom}"
DB_USER="${2:-postgres}"
DB_HOST="${3:-127.0.0.1}"
DB_PORT="${4:-5432}"
OUT_DIR="${5:-/var/backups/mototom}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "${OUT_DIR}"

FULL_DUMP="${OUT_DIR}/${DB_NAME}_${TIMESTAMP}.dump"
SCHEMA_DUMP="${OUT_DIR}/${DB_NAME}_${TIMESTAMP}_schema.sql"

echo "[1/2] Создаю full dump: ${FULL_DUMP}"
pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -b \
  -v \
  -f "${FULL_DUMP}"

echo "[2/2] Создаю schema-only dump: ${SCHEMA_DUMP}"
pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --schema-only \
  -v \
  -f "${SCHEMA_DUMP}"

echo "Готово"
echo "FULL:   ${FULL_DUMP}"
echo "SCHEMA: ${SCHEMA_DUMP}"
