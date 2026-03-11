import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

async function ensureCartTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS cart_items_session_product_uidx ON cart_items(session_id, product_id)'
  );
}

router.use(async (_req, _res, next) => {
  try {
    await ensureCartTable();
    next();
  } catch (error) {
    next(error);
  }
});

async function resolveStockLimit(productId) {
  const result = await pool.query(
    `SELECT stock_qty, in_stock, condition
     FROM products
     WHERE id::text = $1
     LIMIT 1`,
    [String(productId)]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  if (String(row.condition || '').toLowerCase() === 'used') return 1;
  const stock = Math.max(0, Number(row.stock_qty ?? 0) || 0);
  if (stock > 0) return stock;
  return null;
}

// Получить корзину по session_id
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      `SELECT ci.*, p.name, p.price, p.image_url
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id::text
       WHERE ci.session_id = $1`,
      [sessionId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    res.status(500).json({ error: 'Ошибка получения корзины' });
  }
});

// Добавить товар в корзину
router.post('/', async (req, res) => {
  try {
    const { session_id, product_id, quantity } = req.body;
    const productId = String(product_id);
    const requestedQty = Math.max(1, Number(quantity) || 1);
    const stockLimit = await resolveStockLimit(productId);

    const existing = await pool.query(
      'SELECT * FROM cart_items WHERE session_id = $1 AND product_id = $2',
      [session_id, productId]
    );
    const existingQty = existing.rows.length > 0 ? Math.max(0, Number(existing.rows[0].quantity || 0) || 0) : 0;
    if (stockLimit != null && existingQty + requestedQty > stockLimit) {
      return res.status(400).json({ error: `Доступно максимум ${stockLimit} шт.` });
    }

    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [requestedQty, existing.rows[0].id]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      'INSERT INTO cart_items (session_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [session_id, productId, requestedQty]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({ error: 'Ошибка добавления в корзину' });
  }
});

// Обновить количество товара в корзине
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const nextQty = Math.max(1, Number(quantity) || 1);

    const existing = await pool.query('SELECT * FROM cart_items WHERE id = $1 LIMIT 1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Товар в корзине не найден' });
    }
    const stockLimit = await resolveStockLimit(existing.rows[0].product_id);
    if (stockLimit != null && nextQty > stockLimit) {
      return res.status(400).json({ error: `Доступно максимум ${stockLimit} шт.` });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [nextQty, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления корзины:', error);
    res.status(500).json({ error: 'Ошибка обновления корзины' });
  }
});

// Удалить товар из корзины
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cart_items WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар в корзине не найден' });
    }

    res.json({ message: 'Товар удален из корзины', id: result.rows[0].id });
  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({ error: 'Ошибка удаления из корзины' });
  }
});

export default router;
