#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/mototom-clean"
BRANCH="${1:-master}"

echo "[1/6] Перехожу в ${APP_DIR}"
cd "${APP_DIR}"

echo "[2/6] Обновляю код из ветки ${BRANCH}"
git fetch origin
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "[3/6] Устанавливаю зависимости"
npm ci

echo "[4/6] Собираю фронтенд"
npm run build

echo "[5/6] Перезапускаю API через PM2"
pm2 startOrReload ecosystem.config.cjs --env production

echo "[6/6] Проверяю статус"
pm2 status
echo "Готово"
