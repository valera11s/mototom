import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

function slugify(value) {
  const translitMap = {
    '\u0430': 'a',
    '\u0431': 'b',
    '\u0432': 'v',
    '\u0433': 'g',
    '\u0434': 'd',
    '\u0435': 'e',
    '\u0451': 'e',
    '\u0436': 'zh',
    '\u0437': 'z',
    '\u0438': 'i',
    '\u0439': 'y',
    '\u043a': 'k',
    '\u043b': 'l',
    '\u043c': 'm',
    '\u043d': 'n',
    '\u043e': 'o',
    '\u043f': 'p',
    '\u0440': 'r',
    '\u0441': 's',
    '\u0442': 't',
    '\u0443': 'u',
    '\u0444': 'f',
    '\u0445': 'h',
    '\u0446': 'ts',
    '\u0447': 'ch',
    '\u0448': 'sh',
    '\u0449': 'sch',
    '\u044a': '',
    '\u044b': 'y',
    '\u044c': '',
    '\u044d': 'e',
    '\u044e': 'yu',
    '\u044f': 'ya'
  };

  const base = String(value || '').trim().toLowerCase();
  const transliterated = base
    .split('')
    .map((ch) => translitMap[ch] ?? ch)
    .join('');

  const slug = transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `brand-${Date.now()}`;
}

// Получить все бренды
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM brands
      ORDER BY
        CASE WHEN sort_order > 0 THEN 0 ELSE 1 END,
        sort_order ASC NULLS LAST,
        name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения брендов:', error);
    res.status(500).json({ error: 'Ошибка получения брендов' });
  }
});

// Получить бренд по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM brands WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Бренд не найден' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения бренда:', error);
    res.status(500).json({ error: 'Ошибка получения бренда' });
  }
});

// Создать бренд
router.post('/', async (req, res) => {
  try {
    const { name, popular = false, sort_order = 0 } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название бренда обязательно' });
    }

    const cleanName = name.trim();
    const slug = slugify(cleanName);
    if (!slug) {
      return res.status(400).json({ error: 'Некорректное название бренда' });
    }

    const result = await pool.query(
      `INSERT INTO brands (name, slug, popular, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name,
           popular = EXCLUDED.popular,
           sort_order = EXCLUDED.sort_order,
           updated_at = now()
       RETURNING *`,
      [cleanName, slug, Boolean(popular), parseInt(sort_order, 10) || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Бренд с таким названием уже существует' });
    }
    console.error('Ошибка создания бренда:', error);
    res.status(500).json({ error: 'Ошибка создания бренда' });
  }
});

// Обновить бренд
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, popular, sort_order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название бренда обязательно' });
    }

    const cleanName = name.trim();
    const slug = slugify(cleanName);
    if (!slug) {
      return res.status(400).json({ error: 'Некорректное название бренда' });
    }

    const result = await pool.query(
      `UPDATE brands
       SET name = $1,
           slug = $2,
           popular = COALESCE($3, popular),
           sort_order = COALESCE($4, sort_order),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [cleanName, slug, popular !== undefined ? Boolean(popular) : null, sort_order !== undefined ? (parseInt(sort_order, 10) || 0) : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Бренд не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Бренд с таким названием уже существует' });
    }
    console.error('Ошибка обновления бренда:', error);
    res.status(500).json({ error: 'Ошибка обновления бренда' });
  }
});

// Удалить бренд
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const productsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE brand = (SELECT name FROM brands WHERE id = $1)',
      [id]
    );

    if (parseInt(productsCheck.rows[0].count, 10) > 0) {
      return res.status(400).json({ error: 'Бренд используется в товарах и не может быть удален' });
    }

    const result = await pool.query('DELETE FROM brands WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Бренд не найден' });
    }

    res.json({ message: 'Бренд удален', brand: result.rows[0] });
  } catch (error) {
    console.error('Ошибка удаления бренда:', error);
    res.status(500).json({ error: 'Ошибка удаления бренда' });
  }
});

export default router;

