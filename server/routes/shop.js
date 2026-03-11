import express from 'express';
import { pool } from '../index.js';

const router = express.Router();
let ensureLookCategoryColumnPromise = null;
let ensureProductArchiveColumnPromise = null;

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

async function ensureProductArchiveColumn() {
  if (!ensureProductArchiveColumnPromise) {
    ensureProductArchiveColumnPromise = pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false
    `);
  }
  await ensureProductArchiveColumnPromise;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toMoney(value) {
  return Math.round(toNumber(value, 0) * 100) / 100;
}

function mapProductRow(row) {
  const gallery = Array.isArray(row.gallery_images)
    ? row.gallery_images.filter(Boolean)
    : [];
  const mainImage =
    row.main_image ||
    gallery[0] ||
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80';

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.title,
    title: row.title,
    brand: row.brand_name,
    category: row.category_name,
    modelKey: row.model_key,
    condition: row.condition,
    color: row.color,
    size: row.size,
    sizes: row.size ? [row.size] : [],
    price: toNumber(row.price),
    oldPrice: row.old_price == null ? null : toNumber(row.old_price),
    stockQty: toNumber(row.stock_qty),
    image: mainImage,
    images: [mainImage, ...gallery.filter((img) => img !== mainImage)],
    description: row.description_override || row.template_description || '',
    specs: row.specs_override || row.default_specs || {},
  };
}

router.get('/bootstrap', async (_req, res) => {
  try {
    await ensureLookCategoryColumn();
    await ensureProductArchiveColumn();
    const [categoriesResult, brandsResult, productsResult, looksResult, lookItemsResult, categoryImagesSetting] =
      await Promise.all([
        pool.query(`
          SELECT id, name, slug, parent_id, sort_order
          FROM categories
          WHERE is_active = true
          ORDER BY sort_order ASC, name ASC
        `),
        pool.query(`
          SELECT b.id, b.name, b.slug, ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.slug), NULL) AS category_slugs
          FROM brands b
          LEFT JOIN brand_categories bc ON bc.brand_id = b.id
          LEFT JOIN categories c ON c.id = bc.category_id
          WHERE b.is_active = true
          GROUP BY b.id, b.name, b.slug
          ORDER BY b.name ASC
        `),
        pool.query(`
          SELECT
            p.id,
            p.slug,
            p.sku,
            p.title,
            p.condition,
            p.color,
            p.size,
            p.price,
            p.old_price,
            p.stock_qty,
            p.specs_override,
            p.description_override,
            pt.model_key,
            pt.description AS template_description,
            pt.default_specs,
            b.name AS brand_name,
            c.name AS category_name,
            COALESCE(pim.image_url, tim.image_url) AS main_image,
            COALESCE(
              (
                SELECT json_agg(img ORDER BY ord)
                FROM (
                  SELECT pi.image_url AS img, pi.sort_order AS ord
                  FROM product_images pi
                  WHERE pi.product_id = p.id
                  UNION ALL
                  SELECT ti.image_url AS img, 1000 + ti.sort_order AS ord
                  FROM template_images ti
                  WHERE ti.template_id = pt.id
                ) src
              ),
              '[]'::json
            ) AS gallery_images
          FROM products p
          JOIN product_templates pt ON pt.id = p.template_id
          JOIN brands b ON b.id = pt.brand_id
          JOIN categories c ON c.id = pt.category_id
          LEFT JOIN LATERAL (
            SELECT image_url
            FROM product_images
            WHERE product_id = p.id
            ORDER BY is_main DESC, sort_order ASC, created_at ASC
            LIMIT 1
          ) pim ON true
          LEFT JOIN LATERAL (
            SELECT image_url
            FROM template_images
            WHERE template_id = pt.id
            ORDER BY is_main DESC, sort_order ASC, created_at ASC
            LIMIT 1
          ) tim ON true
          WHERE p.is_active = true AND COALESCE(p.is_archived, false) = false
          ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
        `),
        pool.query(`
          SELECT
            id,
            name,
            slug,
            description,
            cover_image_url,
            COALESCE(look_category, 'Город') AS look_category,
            COALESCE(NULLIF(look_categories, '{}'::text[]), ARRAY[COALESCE(look_category, 'Город')]::text[]) AS look_categories
          FROM looks
          WHERE is_active = true
          ORDER BY created_at DESC
        `),
        pool.query(`
          SELECT
            li.look_id,
            li.sort_order,
            li.note,
            COALESCE(li.product_id, tp.id) AS resolved_product_id
          FROM look_items li
          LEFT JOIN products p ON p.id = li.product_id
          LEFT JOIN LATERAL (
            SELECT p2.id
            FROM products p2
            WHERE p2.template_id = li.template_id AND p2.is_active = true
            ORDER BY (p2.stock_qty - p2.reserved_qty) DESC, p2.created_at DESC
            LIMIT 1
          ) tp ON li.product_id IS NULL
          WHERE li.product_id IS NOT NULL OR tp.id IS NOT NULL
          ORDER BY li.look_id, li.sort_order
        `),
        pool.query(`
          SELECT value
          FROM settings
          WHERE key = 'category_images'
          LIMIT 1
        `),
      ]);

    const products = productsResult.rows.map(mapProductRow);
    const byId = new Map(products.map((p) => [p.id, p]));

    let categoryImages = { byId: {}, byName: {} };
    try {
      categoryImages = categoryImagesSetting.rows[0]?.value
        ? JSON.parse(categoryImagesSetting.rows[0].value)
        : { byId: {}, byName: {} };
    } catch {
      categoryImages = { byId: {}, byName: {} };
    }

    const categories = categoriesResult.rows.map((category) => {
      const byId = categoryImages?.byId?.[category.id];
      const byName = categoryImages?.byName?.[String(category.name || '').toLowerCase()];
      return {
        ...category,
        image: byId || byName || null,
      };
    });

    const sets = looksResult.rows.map((look) => {
      const items = lookItemsResult.rows.filter((item) => item.look_id === look.id);
      const productIds = items
        .map((item) => item.resolved_product_id)
        .filter((id) => byId.has(id));
      return {
        id: look.id,
        slug: look.slug,
        name: look.name,
        category: look.look_category || 'Город',
        categories: Array.isArray(look.look_categories) && look.look_categories.length > 0
          ? look.look_categories
          : [look.look_category || 'Город'],
        description: look.description || '',
        coverImage:
          look.cover_image_url ||
          (productIds[0] ? byId.get(productIds[0]).image : null),
        productIds,
      };
    });

    res.json({
      store: {
        name: 'MOTOTOM',
        freeShippingFrom: 10000,
      },
      categories,
      brands: brandsResult.rows,
      products,
      sets,
    });
  } catch (error) {
    console.error('Shop bootstrap error:', error);
    res.status(500).json({ error: 'Не удалось загрузить витрину из БД' });
  }
});

router.get('/products/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const slugPrefix = `${idOrSlug}-%`;
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.slug,
        p.sku,
        p.title,
        p.condition,
        p.color,
        p.size,
        p.price,
        p.old_price,
        p.stock_qty,
        p.specs_override,
        p.description_override,
        pt.model_key,
        pt.description AS template_description,
        pt.default_specs,
        b.name AS brand_name,
        c.name AS category_name,
        COALESCE(pim.image_url, tim.image_url) AS main_image,
        COALESCE(
          (
            SELECT json_agg(img ORDER BY ord)
            FROM (
              SELECT pi.image_url AS img, pi.sort_order AS ord
              FROM product_images pi
              WHERE pi.product_id = p.id
              UNION ALL
              SELECT ti.image_url AS img, 1000 + ti.sort_order AS ord
              FROM template_images ti
              WHERE ti.template_id = pt.id
            ) src
          ),
          '[]'::json
        ) AS gallery_images
      FROM products p
      JOIN product_templates pt ON pt.id = p.template_id
      JOIN brands b ON b.id = pt.brand_id
      JOIN categories c ON c.id = pt.category_id
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_main DESC, sort_order ASC, created_at ASC
        LIMIT 1
      ) pim ON true
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM template_images
        WHERE template_id = pt.id
        ORDER BY is_main DESC, sort_order ASC, created_at ASC
        LIMIT 1
      ) tim ON true
      WHERE p.is_active = true AND COALESCE(p.is_archived, false) = false AND (p.id::text = $1 OR p.slug = $1 OR p.slug LIKE $2)
      ORDER BY
        CASE
          WHEN p.id::text = $1 THEN 1
          WHEN p.slug = $1 THEN 2
          WHEN p.slug LIKE $2 THEN 3
          ELSE 4
        END,
        p.created_at DESC
      LIMIT 1
    `,
      [idOrSlug, slugPrefix]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(mapProductRow(result.rows[0]));
  } catch (error) {
    console.error('Shop product details error:', error);
    res.status(500).json({ error: 'Не удалось загрузить товар' });
  }
});

router.post('/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      order_number,
      items = [],
      customer_email = null,
      customer_name = 'Клиент',
      shipping_address = {},
      payment_method = null,
      shipping_amount = null,
      discount_amount = 0,
      total = null,
      comment = null,
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    if (!order_number || typeof order_number !== 'string') {
      return res.status(400).json({ error: 'Некорректный номер заказа' });
    }

    const productIds = items
      .map((item) => item.product_id)
      .filter((v) => typeof v === 'string' && v.length > 0);
    const uniqueProductIds = [...new Set(productIds)];

    if (uniqueProductIds.length === 0) {
      return res.status(400).json({ error: 'Товары не переданы' });
    }

    await client.query('BEGIN');

    const productRows = await client.query(
      `
      SELECT
        p.id,
        p.template_id,
        p.sku,
        p.title,
        p.price,
        p.stock_qty,
        p.reserved_qty,
        p.condition,
        b.name AS brand_name,
        c.name AS category_name
      FROM products p
      JOIN product_templates pt ON pt.id = p.template_id
      JOIN brands b ON b.id = pt.brand_id
      JOIN categories c ON c.id = pt.category_id
      WHERE p.id = ANY($1::uuid[]) AND p.is_active = true
      FOR UPDATE
    `,
      [uniqueProductIds]
    );

    const byId = new Map(productRows.rows.map((row) => [row.id, row]));
    let subtotal = 0;
    const normalizedItems = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const row = byId.get(item.product_id);
      if (!row) {
        throw new Error(`Товар не найден: ${item.product_id}`);
      }
      if (String(row.condition || '').toLowerCase() === 'used' && qty > 1) {
        throw new Error(`РўРѕРІР°СЂ "${row.title}" (Б/У) можно заказать только в количестве 1 шт.`);
      }
      const available = toNumber(row.stock_qty) - toNumber(row.reserved_qty);
      if (available < qty) {
        throw new Error(`Недостаточно остатка для "${row.title}"`);
      }
      const unitPrice = toMoney(row.price);
      const lineTotal = toMoney(unitPrice * qty);
      subtotal = toMoney(subtotal + lineTotal);
      normalizedItems.push({
        product_id: row.id,
        template_id: row.template_id,
        sku_snapshot: row.sku,
        title_snapshot: row.title,
        brand_snapshot: row.brand_name,
        category_snapshot: row.category_name,
        condition_snapshot: row.condition,
        qty,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    const shippingAmount =
      shipping_amount == null
        ? toMoney(Math.max(0, toNumber(total, subtotal) - subtotal))
        : toMoney(shipping_amount);
    const discountAmount = toMoney(discount_amount || 0);
    const totalAmount =
      total == null
        ? toMoney(subtotal + shippingAmount - discountAmount)
        : toMoney(total);

    let customerId = null;
    const customerPhone = shipping_address?.phone || null;
    if (customerPhone || customer_email) {
      const existing = await client.query(
        `
        SELECT id
        FROM customers
        WHERE ($1::text IS NOT NULL AND phone = $1)
           OR ($2::text IS NOT NULL AND email::text = $2)
        ORDER BY created_at DESC
        LIMIT 1
      `,
        [customerPhone, customer_email]
      );

      if (existing.rows.length > 0) {
        customerId = existing.rows[0].id;
        await client.query(
          `
          UPDATE customers
          SET full_name = $2,
              phone = COALESCE($3, phone),
              email = COALESCE($4::citext, email),
              updated_at = now()
          WHERE id = $1
        `,
          [customerId, customer_name, customerPhone, customer_email]
        );
      } else {
        const inserted = await client.query(
          `
          INSERT INTO customers (full_name, phone, email)
          VALUES ($1, $2, $3::citext)
          RETURNING id
        `,
          [customer_name, customerPhone, customer_email]
        );
        customerId = inserted.rows[0].id;
      }
    }

    const orderInsert = await client.query(
      `
      INSERT INTO orders (
        order_number,
        customer_id,
        status,
        currency,
        subtotal,
        shipping_amount,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        shipping_method,
        shipping_address,
        customer_snapshot,
        comment
      )
      VALUES (
        $1,
        $2,
        'new',
        'RUB',
        $3,
        $4,
        $5,
        $6,
        $7,
        'pending',
        $8,
        $9::jsonb,
        $10::jsonb,
        $11
      )
      RETURNING id, order_number
    `,
      [
        order_number,
        customerId,
        subtotal,
        shippingAmount,
        discountAmount,
        totalAmount,
        payment_method,
        shipping_address?.delivery_method || null,
        JSON.stringify(shipping_address || {}),
        JSON.stringify({
          full_name: customer_name,
          email: customer_email,
          phone: customerPhone,
        }),
        comment,
      ]
    );

    const orderId = orderInsert.rows[0].id;
    for (const line of normalizedItems) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          template_id,
          sku_snapshot,
          title_snapshot,
          brand_snapshot,
          category_snapshot,
          condition_snapshot,
          qty,
          unit_price,
          line_total
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
        )
      `,
        [
          orderId,
          line.product_id,
          line.template_id,
          line.sku_snapshot,
          line.title_snapshot,
          line.brand_snapshot,
          line.category_snapshot,
          line.condition_snapshot,
          line.qty,
          line.unit_price,
          line.line_total,
        ]
      );

      await client.query(
        `
        UPDATE products
        SET stock_qty = stock_qty - $2,
            updated_at = now()
        WHERE id = $1
      `,
        [line.product_id, line.qty]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      ok: true,
      order_number: orderInsert.rows[0].order_number,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Shop create order error:', error);
    res.status(400).json({ error: error.message || 'Не удалось оформить заказ' });
  } finally {
    client.release();
  }
});

router.get('/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const orderResult = await pool.query(
      `
      SELECT
        o.order_number,
        o.status,
        o.total_amount AS total,
        o.subtotal,
        o.shipping_amount,
        o.discount_amount,
        o.created_at,
        o.shipping_address,
        o.customer_snapshot
      FROM orders o
      WHERE o.order_number = $1
      LIMIT 1
    `,
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      `
      SELECT
        oi.product_id,
        oi.template_id,
        oi.title_snapshot AS product_name,
        oi.qty AS quantity,
        oi.unit_price AS price,
        COALESCE(pi.image_url, ti.image_url) AS image
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN product_templates pt ON pt.id = COALESCE(oi.template_id, p.template_id)
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = oi.product_id
        ORDER BY is_main DESC, sort_order ASC, created_at ASC
        LIMIT 1
      ) pi ON true
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM template_images
        WHERE template_id = COALESCE(oi.template_id, pt.id)
        ORDER BY is_main DESC, sort_order ASC, created_at ASC
        LIMIT 1
      ) ti ON true
      WHERE oi.order_id = (
        SELECT id FROM orders WHERE order_number = $1 LIMIT 1
      )
      ORDER BY oi.created_at ASC
    `,
      [orderNumber]
    );

    const customerSnapshot = order.customer_snapshot || {};

    res.json({
      order_number: order.order_number,
      status: order.status,
      total: toNumber(order.total),
      subtotal: toNumber(order.subtotal),
      shipping_amount: toNumber(order.shipping_amount),
      discount_amount: toNumber(order.discount_amount),
      created_at: order.created_at,
      customer_name: customerSnapshot.full_name || null,
      customer_email: customerSnapshot.email || null,
      shipping_address: order.shipping_address || {},
      items: itemsResult.rows.map((item) => ({
        ...item,
        price: toNumber(item.price),
        quantity: toNumber(item.quantity, 1),
      })),
    });
  } catch (error) {
    console.error('Shop get order error:', error);
    res.status(500).json({ error: 'Не удалось загрузить заказ' });
  }
});

export default router;
