# Mototom: деплой на Linux + Nginx + Git (по IP)

Ниже рабочий сценарий для Ubuntu 22.04/24.04, когда есть только IP сервера.

## 1. Подготовка сервера

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
node -v
npm -v
```

## 2. Подготовка Git-репозитория (локально)

В проекте на вашем ПК:

```bash
cd /path/to/mototom-clean
git init
git add .
git commit -m "Initial Linux deploy setup"
git branch -M master
git remote add origin <SSH_ИЛИ_HTTPS_URL_ВАШЕГО_REPO>
git push -u origin master
```

Если `origin` уже существует:

```bash
git remote set-url origin <SSH_ИЛИ_HTTPS_URL_ВАШЕГО_REPO>
git push -u origin master
```

## 3. Подключение Git на сервере (чтобы `git pull` работал без ввода пароля)

На сервере:

```bash
ssh-keygen -t ed25519 -C "deploy@mototom" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

1. Скопируйте публичный ключ.
2. Добавьте его как Deploy Key (Read-only) в ваш Git-репозиторий.

Проверка:

```bash
ssh -T git@github.com
```

## 4. Клонирование проекта на сервер

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone <SSH_URL_ВАШЕГО_REPO> mototom-clean
cd /var/www/mototom-clean
```

## 5. Настройка `.env`

```bash
cp .env.example .env
nano .env
```

Минимум заполнить:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `PORT=3001`
- `CORS_ORIGIN=http://<ВАШ_IP>`

## 6. Развернуть PostgreSQL базу

### Вариант A: восстановить из существующего дампа (рекомендуется)

1. Положите `.dump` на сервер, например в `/var/backups/mototom/`.
2. Выполните:

```bash
cd /var/www/mototom-clean
chmod +x deploy/db-restore.sh
export PGPASSWORD='<ПАРОЛЬ_ПОЛЬЗОВАТЕЛЯ_BD>'
./deploy/db-restore.sh /var/backups/mototom/mototom_latest.dump mototom mototom_user 127.0.0.1 5432
```

### Вариант B: чистая инициализация по SQL

```bash
sudo -u postgres psql -c "CREATE USER mototom_user WITH PASSWORD 'change_me';"
sudo -u postgres psql -c "CREATE DATABASE mototom OWNER mototom_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mototom TO mototom_user;"

export PGPASSWORD='change_me'
psql -h 127.0.0.1 -p 5432 -U mototom_user -d mototom -f /var/www/mototom-clean/database/schema.sql
psql -h 127.0.0.1 -p 5432 -U mototom_user -d mototom -f /var/www/mototom-clean/database/seed.sql
```

## 7. Установка зависимостей и первая сборка

```bash
cd /var/www/mototom-clean
npm ci
npm run build
```

## 8. PM2 (API в фоне)

Создайте директорию под логи:

```bash
sudo mkdir -p /var/log/mototom
sudo chown -R $USER:$USER /var/log/mototom
```

Запуск:

```bash
cd /var/www/mototom-clean
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Команда `pm2 startup` выведет строку, которую нужно выполнить с `sudo`.

## 9. Nginx по IP (без домена)

```bash
sudo cp /var/www/mototom-clean/deploy/nginx-mototom-ip.conf /etc/nginx/sites-available/mototom
sudo ln -sf /etc/nginx/sites-available/mototom /etc/nginx/sites-enabled/mototom
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

Откройте в фаерволе:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status
```

После этого сайт должен быть доступен по `http://<ВАШ_IP>`.

## 10. Обновления в будущем (через Git)

### На локальной машине

```bash
git add .
git commit -m "Update"
git push origin master
```

### На сервере

```bash
cd /var/www/mototom-clean
chmod +x deploy/update.sh
./deploy/update.sh master
```

## 11. Как сделать дамп БД (резервная копия)

```bash
cd /var/www/mototom-clean
chmod +x deploy/db-dump.sh
export PGPASSWORD='<ПАРОЛЬ_ПОЛЬЗОВАТЕЛЯ_BD>'
./deploy/db-dump.sh mototom mototom_user 127.0.0.1 5432 /var/backups/mototom
```

Скрипт создаст:
- `*.dump` (полный дамп для восстановления через `pg_restore`)
- `*_schema.sql` (только структура)

## 12. Полезная диагностика

```bash
pm2 status
pm2 logs mototom-api --lines 200
sudo systemctl status nginx
sudo tail -n 200 /var/log/nginx/mototom-error.log
curl -I http://127.0.0.1:3001/api/health
curl -I http://<ВАШ_IP>/api/health
```

## 13. Что поменять, когда появится домен

1. В `server_name` указать домен в Nginx.
2. Поставить SSL (Let's Encrypt + certbot).
3. Обновить `CORS_ORIGIN` на `https://домен`.
