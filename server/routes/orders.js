import express from 'express';
import { pool } from '../index.js';
import { notifyNewOrder } from '../utils/telegram.js';
import { validateEmail, validateName, validatePhone, validateNumber, validateString, getClientIP } from '../utils/validation.js';

const router = express.Router();
const APPLY_STATUSES = new Set(['assembling', 'packed', 'shipped', 'delivered']);
let infraEnsurePromise = null;

async function ensureInventoryInfrastructure(client = pool) {
  if (!infraEnsurePromise) {
    infraEnsurePromise = (async () => {
      await client.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS inventory_applied boolean NOT NULL DEFAULT false
      `);
      await client.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS inventory_applied_status varchar(50)
      `);
      await client.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS inventory_applied_at timestamp
      `);
      await client.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS inventory_reverted_at timestamp
      `);
      await client.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false
      `);
      await client.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS archived_at timestamp
      `);
      await client.query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS auto_delete_at timestamp
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS product_archives (
          id bigserial PRIMARY KEY,
          source_product_id text NOT NULL,
          snapshot jsonb NOT NULL,
          reason text,
          deleted_at timestamp NOT NULL DEFAULT now()
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_product_archives_source_product_id
        ON product_archives (source_product_id)
      `);
    })();
  }
  await infraEnsurePromise;
}

function parseOrderItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((line) => ({
      productId: String(line?.product_id || '').trim(),
      qty: Math.max(1, Number(line?.qty ?? line?.quantity ?? 1) || 1),
      raw: line,
    }))
    .filter((line) => line.productId);
}

async function archiveProductSnapshot(client, productId, reason) {
  await client.query(
    `
      INSERT INTO product_archives (source_product_id, snapshot, reason)
      SELECT p.id::text, to_jsonb(p), $2
      FROM products p
      WHERE p.id::text = $1
    `,
    [String(productId), String(reason || 'manual')]
  );
}

async function restoreProductFromArchive(client, productId) {
  const restored = await client.query(
    `
      WITH src AS (
        SELECT snapshot
        FROM product_archives
        WHERE source_product_id = $1
        ORDER BY deleted_at DESC
        LIMIT 1
      )
      INSERT INTO products
      SELECT (jsonb_populate_record(NULL::products, src.snapshot)).*
      FROM src
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `,
    [String(productId)]
  );
  return restored.rows.length > 0;
}

async function applyInventoryDelta(client, order, deltaSign) {
  const items = parseOrderItems(order?.items);
  for (const line of items) {
    const productRow = await client.query(
      `
        SELECT id, stock_qty, in_stock, is_archived
        FROM products
        WHERE id::text = $1
        FOR UPDATE
      `,
      [line.productId]
    );

    if (productRow.rows.length === 0) {
      if (deltaSign > 0) {
        const restored = await restoreProductFromArchive(client, line.productId);
        if (!restored) continue;
        const restoredRow = await client.query(
          `
            SELECT id, stock_qty, in_stock, is_archived
            FROM products
            WHERE id::text = $1
            FOR UPDATE
          `,
          [line.productId]
        );
        if (restoredRow.rows.length === 0) continue;
        const current = restoredRow.rows[0];
        const nextStock = Math.max(0, Number(current.stock_qty || 0) + line.qty);
        await client.query(
          `
            UPDATE products
            SET stock_qty = $2,
                in_stock = ($2 > 0),
                is_archived = false,
                archived_at = NULL,
                auto_delete_at = NULL
            WHERE id::text = $1
          `,
          [line.productId, nextStock]
        );
      }
      continue;
    }

    const current = productRow.rows[0];
    const currentStock = Math.max(0, Number(current.stock_qty || 0) || 0);
    let nextStock = currentStock;

    if (deltaSign < 0) {
      nextStock = Math.max(0, currentStock - line.qty);
      const becomesArchived = nextStock === 0 && !current.is_archived;
      if (becomesArchived) {
        await archiveProductSnapshot(client, line.productId, `stock_zero_from_order_${order.order_number}`);
      }
      await client.query(
        `
          UPDATE products
          SET stock_qty = $2,
              in_stock = ($2 > 0),
              is_archived = CASE WHEN $2 = 0 THEN true ELSE false END,
              archived_at = CASE WHEN $2 = 0 THEN COALESCE(archived_at, now()) ELSE NULL END,
              auto_delete_at = CASE WHEN $2 = 0 THEN COALESCE(auto_delete_at, now() + interval '7 days') ELSE NULL END
          WHERE id::text = $1
        `,
        [line.productId, nextStock]
      );
    } else {
      nextStock = Math.max(0, currentStock + line.qty);
      await client.query(
        `
          UPDATE products
          SET stock_qty = $2,
              in_stock = ($2 > 0),
              is_archived = false,
              archived_at = NULL,
              auto_delete_at = NULL
          WHERE id::text = $1
        `,
        [line.productId, nextStock]
      );
    }
  }
}

async function cleanupExpiredArchivedProducts(client) {
  const expired = await client.query(
    `
      SELECT id::text AS id
      FROM products
      WHERE COALESCE(is_archived, false) = true
        AND auto_delete_at IS NOT NULL
        AND auto_delete_at <= now()
      LIMIT 100
      FOR UPDATE SKIP LOCKED
    `
  );

  for (const row of expired.rows) {
    await archiveProductSnapshot(client, row.id, 'auto_delete_after_7_days');
    await client.query('DELETE FROM products WHERE id::text = $1', [row.id]);
  }
}

// Middleware для проверки заблокированных IP (только для создания заказов)
async function checkBlockedIP(req, res, next) {
  try {
    const clientIP = getClientIP(req);
    if (clientIP === 'unknown') return next();
    const result = await pool.query('SELECT id FROM blocked_ips WHERE ip_address = $1', [clientIP]);
    if (result.rows.length > 0) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    next();
  } catch (error) {
    console.error('Ошибка проверки заблокированных IP:', error);
    next();
  }
}

// Получить все заказы
router.get('/', async (req, res) => {
  try {
    const { status, archived } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (archived !== undefined) {
      query += ` AND archived = $${paramIndex}`;
      params.push(archived === 'true');
      paramIndex++;
    } else {
      query += ` AND archived = $${paramIndex}`;
      params.push(false);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Получить заказ по номеру
router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({ error: 'Ошибка получения заказа' });
  }
});

// Создать заказ
router.post('/', checkBlockedIP, async (req, res) => {
  try {
    const {
      order_number, items, total, customer_email, customer_name,
      shipping_address, payment_method,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Добавьте хотя бы один товар' });
    }

    const productIds = [...new Set(items.map((item) => String(item?.product_id || '').trim()).filter(Boolean))];
    if (productIds.length > 0) {
      const productsResult = await pool.query(
        `SELECT id::text AS id, condition FROM products WHERE id::text = ANY($1::text[])`,
        [productIds]
      );
      const byId = new Map(productsResult.rows.map((row) => [String(row.id), String(row.condition || '').toLowerCase()]));
      for (const line of items) {
        const lineProductId = String(line?.product_id || '').trim();
        if (!lineProductId) continue;
        const conditionValue = byId.get(lineProductId);
        const qty = Math.max(1, Number(line?.qty ?? line?.quantity ?? 1) || 1);
        if (conditionValue === 'used' && qty > 1) {
          return res.status(400).json({ error: 'Товар Б/У можно заказать только в количестве 1 шт.' });
        }
      }
    }

    if (customer_email) {
      const emailValidation = validateEmail(customer_email);
      if (!emailValidation.valid) return res.status(400).json({ error: emailValidation.error });
    }
    if (customer_name) {
      const nameValidation = validateName(customer_name);
      if (!nameValidation.valid) return res.status(400).json({ error: nameValidation.error });
    }
    if (shipping_address?.phone) {
      const phoneValidation = validatePhone(shipping_address.phone);
      if (!phoneValidation.valid) return res.status(400).json({ error: phoneValidation.error });
    }
    if (shipping_address?.address) {
      const addressValidation = validateString(shipping_address.address, 'Адрес', 0, 500, true);
      if (!addressValidation.valid) return res.status(400).json({ error: addressValidation.error });
    }
    if (shipping_address?.city) {
      const cityValidation = validateString(shipping_address.city, 'Город', 0, 100, true);
      if (!cityValidation.valid) return res.status(400).json({ error: cityValidation.error });
    }
    const totalValidation = validateNumber(total, 0);
    if (!totalValidation.valid) {
      return res.status(400).json({ error: totalValidation.error });
    }

    const clientIP = getClientIP(req);
    await ensureInventoryInfrastructure();

    const result = await pool.query(
      `INSERT INTO orders (
        order_number, items, total, customer_email, customer_name,
        shipping_address, payment_method, status, client_ip, inventory_applied
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, false)
      RETURNING *`,
      [
        order_number,
        JSON.stringify(items),
        totalValidation.value,
        customer_email || null,
        customer_name || null,
        JSON.stringify(shipping_address || {}),
        payment_method || null,
        clientIP !== 'unknown' ? clientIP : null,
      ]
    );

    const order = result.rows[0];
    try {
      await notifyNewOrder(order);
    } catch (error) {
      console.error('Ошибка отправки уведомления о заказе в Telegram:', error);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// Обновить статус заказа с логикой списания/возврата остатков
router.patch('/:orderNumber/status', async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureInventoryInfrastructure(client);
    await client.query('BEGIN');
    await cleanupExpiredArchivedProducts(client);

    const { orderNumber } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'pending', 'processing', 'assembling'];
    if (!validStatuses.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const orderResult = await client.query(
      `SELECT * FROM orders WHERE order_number = $1 FOR UPDATE`,
      [orderNumber]
    );
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];
    const prevStatus = String(order.status || 'pending');
    const nextStatus = String(status);

    if (prevStatus === nextStatus) {
      await client.query('COMMIT');
      return res.json(order);
    }

    let inventoryApplied = Boolean(order.inventory_applied);
    let inventoryAppliedStatus = order.inventory_applied_status || null;
    let inventoryAppliedAt = order.inventory_applied_at || null;
    let inventoryRevertedAt = order.inventory_reverted_at || null;

    // Списание только один раз при первом переходе в assembling/shipped/delivered
    if (!inventoryApplied && APPLY_STATUSES.has(nextStatus)) {
      await applyInventoryDelta(client, order, -1);
      inventoryApplied = true;
      inventoryAppliedStatus = nextStatus;
      inventoryAppliedAt = new Date();
      inventoryRevertedAt = null;
    }

    // Возврат только если ранее уже было списание и заказ отменили
    if (inventoryApplied && nextStatus === 'cancelled') {
      await applyInventoryDelta(client, order, 1);
      inventoryApplied = false;
      inventoryRevertedAt = new Date();
      inventoryAppliedStatus = null;
      inventoryAppliedAt = null;
    }

    const updateResult = await client.query(
      `
        UPDATE orders
        SET status = $1,
            inventory_applied = $2,
            inventory_applied_status = $3,
            inventory_applied_at = $4,
            inventory_reverted_at = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_number = $6
        RETURNING *
      `,
      [
        nextStatus,
        inventoryApplied,
        inventoryAppliedStatus,
        inventoryAppliedAt,
        inventoryRevertedAt,
        orderNumber,
      ]
    );

    await client.query('COMMIT');
    res.json(updateResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  } finally {
    client.release();
  }
});

// Перенести заказ в архив/из архива
router.patch('/:orderNumber/archive', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { archived } = req.body;

    if (typeof archived !== 'boolean') {
      return res.status(400).json({ error: 'Параметр archived должен быть boolean' });
    }

    const result = await pool.query(
      'UPDATE orders SET archived = $1, updated_at = CURRENT_TIMESTAMP WHERE order_number = $2 RETURNING *',
      [archived, orderNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления архива:', error);
    res.status(500).json({ error: 'Ошибка обновления архива' });
  }
});

export default router;
