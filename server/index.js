import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем .env файл из корня проекта (на уровень выше server/)
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Отладочный вывод (можно убрать после проверки)
console.log('📁 .env путь:', envPath);
console.log('📋 TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ установлен' : '❌ не установлен');
console.log('📋 TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? '✅ установлен' : '❌ не установлен');

import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import categoriesRoutes from './routes/categories.js';
import brandsRoutes from './routes/brands.js';
import settingsRoutes from './routes/settings.js';
import messagesRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
import blockedIPsRoutes from './routes/blocked-ips.js';
import customersRoutes from './routes/customers.js';
import shopRoutes from './routes/shop.js';
import looksRoutes from './routes/looks.js';
import { ensureOperationalSchema } from './utils/ensureOperationalSchema.js';
import { createIpGuard } from './middleware/ipGuard.js';
import { applySecurityHeaders, enforceJsonForMutations, rejectMaliciousPayload, sanitizeIncomingPayload } from './middleware/security.js';

const app = express();
const PORT = process.env.PORT || 3001;
const DB_RETRY_ATTEMPTS = Number(process.env.DB_RETRY_ATTEMPTS || 20);
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 3000);

// Middleware
app.disable('x-powered-by');
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((x) => x.trim()).filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(applySecurityHeaders());

// Trust proxy для правильного определения IP клиента (важно для получения реального IP через прокси/CDN)
app.set('trust proxy', true);

// Middleware для явной установки UTF-8 в заголовках всех JSON ответов
app.use((req, res, next) => {
  // Устанавливаем UTF-8 только для JSON ответов, не трогая другие типы
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '1mb' }));
app.use(sanitizeIncomingPayload());
app.use(enforceJsonForMutations());
app.use(rejectMaliciousPayload());

// Раздача статических файлов из папки uploads
// (path и fileURLToPath уже импортированы выше)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Подключение к PostgreSQL
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'camerahub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  client_encoding: 'UTF8', // Явно указываем кодировку клиента
});

// Проверка подключения
pool.on('connect', () => {
  console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к PostgreSQL:', err);
});

// Routes
app.use('/api', createIpGuard(pool));
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/blocked-ips', blockedIPsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/looks', looksRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

async function start() {
  const shouldRetry = (error) => {
    const code = String(error?.code || '');
    // 57P03 = "the database system is starting up" in PostgreSQL.
    return code === '57P03' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  };

  for (let attempt = 1; attempt <= DB_RETRY_ATTEMPTS; attempt += 1) {
    try {
      await ensureOperationalSchema(pool);
      app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
      });
      return;
    } catch (error) {
      const retryable = shouldRetry(error);
      const isLast = attempt === DB_RETRY_ATTEMPTS;
      console.error(`Schema bootstrap error (attempt ${attempt}/${DB_RETRY_ATTEMPTS}):`, error?.code || error?.message || error);

      if (!retryable || isLast) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_DELAY_MS));
    }
  }
}

start();

