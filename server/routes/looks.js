import express from 'express';
import { pool } from '../index.js';

const router = express.Router();
let ensureLookCategoryColumnPromise = null;

function normalizeProductIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((x) => String(x || '').trim()).filter(Boolean))];
}

function normalizeLookCategory(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const map = {
    'город': 'Город',
    'спорт': 'Спорт',
    'классика': 'Классика',
    'туризм': 'Туризм',
    'новинки': 'Новинки',
    'новое': 'Новинки',
  };
  return map[normalized] || 'Город';
}

function normalizeLookCategories(value) {
  const source = Array.isArray(value) ? value : [value];
  const unique = [...new Set(source.map((item) => normalizeLookCategory(item)).filter(Boolean))];
  return unique.length > 0 ? unique : ['Город'];
}

async function ensureLookCategoryColumn() {
  if (!ensureLookCategoryColumnPromise) {
    ensureLookCategoryColumnPromise = (async () => {
      await pool.query(`
        ALTER TABLE looks
        ADD COLUMN IF NOT EXISTS look_category text NOT NULL DEFAULT 'Город'
      `);
      await pool.query(`
        ALTER TABLE looks
        ADD COLUMN IF NOT EXISTS look_categories text[] NOT NULL DEFAULT ARRAY['Город']::text[]
      `);
      await pool.query(`
        UPDATE looks
        SET look_categories = ARRAY[COALESCE(look_category, 'Город')]::text[]
        WHERE look_categories IS NULL OR array_length(look_categories, 1) IS NULL
      `);
    })();
  }
  await ensureLookCategoryColumnPromise;
}

router.get('/', async (_req, res) => {
  try {
    await ensureLookCategoryColumn();
    const result = await pool.query(`
      SELECT
        l.id,
        l.name,
        l.slug,
        l.description,
        l.cover_image_url,
        COALESCE(l.look_category, 'Город') AS look_category,
        COALESCE(NULLIF(l.look_categories, '{}'::text[]), ARRAY[COALESCE(l.look_category, 'Город')]::text[]) AS look_categories,
        l.is_active,
        l.created_at,
        COALESCE(
          json_agg(li.product_id ORDER BY li.sort_order) FILTER (WHERE li.product_id IS NOT NULL),
          '[]'::json
        ) AS product_ids
      FROM looks l
      LEFT JOIN look_items li ON li.look_id = l.id
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения образов:', error);
    res.status(500).json({ error: 'Ошибка получения образов' });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name,
      slug,
      description = '',
      cover_image_url = '',
      look_category = 'Город',
      look_categories,
      is_active = true,
      product_ids = [],
    } = req.body || {};

    const cleanName = String(name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ error: 'Название образа обязательно' });
    }

    const cleanSlug =
      String(slug || '').trim() ||
      cleanName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-а-яё]/gi, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    const ids = normalizeProductIds(product_ids);
    const cleanCategories = normalizeLookCategories(look_categories ?? look_category);
    const cleanCategory = cleanCategories[0];

    await client.query('BEGIN');
    await ensureLookCategoryColumn();

    const created = await client.query(
      `INSERT INTO looks (name, slug, description, cover_image_url, look_category, look_categories, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        cleanName,
        cleanSlug,
        String(description || '').trim() || null,
        String(cover_image_url || '').trim() || null,
        cleanCategory,
        cleanCategories,
        Boolean(is_active),
      ]
    );

    const look = created.rows[0];

    if (ids.length > 0) {
      for (let i = 0; i < ids.length; i += 1) {
        await client.query(
          `INSERT INTO look_items (look_id, product_id, sort_order)
           VALUES ($1, $2, $3)`,
          [look.id, ids[i], i]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({
      ...look,
      look_category: look.look_category || cleanCategory,
      look_categories: Array.isArray(look.look_categories) && look.look_categories.length > 0 ? look.look_categories : cleanCategories,
      product_ids: ids,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка создания образа:', error);
    res.status(500).json({ error: 'Ошибка создания образа' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description = '',
      cover_image_url = '',
      look_category = 'Город',
      look_categories,
      is_active = true,
      product_ids = [],
    } = req.body || {};

    const cleanName = String(name || '').trim();
    if (!cleanName) {
      return res.status(400).json({ error: 'Название образа обязательно' });
    }

    const cleanSlug =
      String(slug || '').trim() ||
      cleanName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-а-яё]/gi, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');

    const ids = normalizeProductIds(product_ids);
    const cleanCategories = normalizeLookCategories(look_categories ?? look_category);
    const cleanCategory = cleanCategories[0];

    await client.query('BEGIN');
    await ensureLookCategoryColumn();

    const updated = await client.query(
      `UPDATE looks
       SET name = $1, slug = $2, description = $3, cover_image_url = $4, look_category = $5, look_categories = $6, is_active = $7
       WHERE id = $8
       RETURNING *`,
      [
        cleanName,
        cleanSlug,
        String(description || '').trim() || null,
        String(cover_image_url || '').trim() || null,
        cleanCategory,
        cleanCategories,
        Boolean(is_active),
        id,
      ]
    );

    if (updated.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Образ не найден' });
    }

    await client.query('DELETE FROM look_items WHERE look_id = $1', [id]);
    if (ids.length > 0) {
      for (let i = 0; i < ids.length; i += 1) {
        await client.query(
          `INSERT INTO look_items (look_id, product_id, sort_order)
           VALUES ($1, $2, $3)`,
          [id, ids[i], i]
        );
      }
    }

    await client.query('COMMIT');
    res.json({
      ...updated.rows[0],
      look_category: updated.rows[0]?.look_category || cleanCategory,
      look_categories: Array.isArray(updated.rows[0]?.look_categories) && updated.rows[0].look_categories.length > 0 ? updated.rows[0].look_categories : cleanCategories,
      product_ids: ids,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка обновления образа:', error);
    res.status(500).json({ error: 'Ошибка обновления образа' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM looks WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Образ не найден' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Ошибка удаления образа:', error);
    res.status(500).json({ error: 'Ошибка удаления образа' });
  }
});

export default router;
