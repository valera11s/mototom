import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

const DEFAULT_SETTINGS = [
  { key: 'site_name', value: 'MOTOTOM', description: 'Название сайта' },
  { key: 'phone', value: '+7 (495) 129-90-77', description: 'Телефон на сайте' },
  { key: 'phone_link', value: '+74951299077', description: 'Телефон для tel: ссылки' },
  { key: 'address', value: 'Москва, ул. Дубининская, д. 22', description: 'Адрес магазина' },
  { key: 'email', value: 'sales@mototom.ru', description: 'Email магазина' },
  { key: 'working_hours', value: 'Пн-Пт: 10:00 - 20:00', description: 'Режим работы' }
];

async function ensureDefaults() {
  for (const row of DEFAULT_SETTINGS) {
    await pool.query(
      `INSERT INTO settings (key, value, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING`,
      [row.key, row.value, row.description]
    );
  }
}

router.get('/', async (_req, res) => {
  try {
    await ensureDefaults();
    const result = await pool.query('SELECT * FROM settings ORDER BY key');
    const settings = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({ error: 'Ошибка получения настроек' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения настройки:', error);
    res.status(500).json({ error: 'Ошибка получения настройки' });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Значение обязательно' });
    }

    const result = await pool.query(
      `INSERT INTO settings (key, value, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, value, null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления настройки:', error);
    res.status(500).json({ error: 'Ошибка обновления настройки' });
  }
});

export default router;
