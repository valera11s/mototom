import express from 'express';
import { pool } from '../index.js';
import { validateSearchQuery, validateString } from '../utils/validation.js';

const router = express.Router();
let ensureProductArchivePromise = null;

async function ensureProductArchiveInfrastructure(client = pool) {
  if (!ensureProductArchivePromise) {
    ensureProductArchivePromise = (async () => {
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
  await ensureProductArchivePromise;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Р¤СѓРЅРєС†РёСЏ РіРµРЅРµСЂР°С†РёРё slug РёР· РЅР°Р·РІР°РЅРёСЏ
function generateSlugFromName(name) {
  if (!name) return '';
  const ru = 'Р°Р±РІРіРґРµС‘Р¶Р·РёР№РєР»РјРЅРѕРїСЂСЃС‚СѓС„С…С†С‡С€С‰СЉС‹СЊСЌСЋСЏ';
  const en = 'abvgdeezhziyklmnoprstufkhchshschiyeyuya';
  return name
    .toLowerCase()
    .split('')
    .map(char => {
      const idx = ru.indexOf(char);
      return idx >= 0 ? en[idx] : char;
    })
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function slugifyText(value) {
  const translitMap = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const source = String(value || '').trim().toLowerCase();
  const transliterated = source
    .split('')
    .map((ch) => translitMap[ch] ?? ch)
    .join('');
  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// РџРѕР»СѓС‡РёС‚СЊ СѓРЅРёРєР°Р»СЊРЅС‹Рµ Р±СЂРµРЅРґС‹ РёР· С‚РѕРІР°СЂРѕРІ
router.get('/brands', async (req, res) => {
  try {
    await ensureProductArchiveInfrastructure();
    const result = await pool.query(`
      SELECT DISTINCT brand
      FROM products
      WHERE brand IS NOT NULL AND brand != '' AND COALESCE(is_archived, false) = false
      ORDER BY brand
    `);
    const brands = result.rows.map((row) => row.brand).filter(Boolean);
    res.json(brands);
  } catch (error) {
    console.error('Ошибка получения брендов из товаров:', error);
    res.status(500).json({ error: 'Ошибка получения брендов' });
  }
});

// Поиск шаблонов товара по бренду и модели
router.get('/templates', async (req, res) => {
  try {
    await ensureProductArchiveInfrastructure();
    const { brand, model, limit = 8 } = req.query;
    const cleanBrand = String(brand || '').trim();
    const cleanModel = String(model || '').trim();

    if (!cleanBrand) {
      return res.status(400).json({ error: 'Укажите бренд' });
    }

    const params = [cleanBrand.toLowerCase(), Math.min(Number(limit) || 8, 20)];
    let where = 'LOWER(p.brand) = $1';

    if (cleanModel) {
      params.push(`%${cleanModel.toLowerCase()}%`);
      where += ` AND LOWER(p.name) LIKE $3`;
    }

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.model,
        p.description,
        p.price,
        p.original_price,
        p.image_url,
        p.images,
        p.category_id,
        p.subcategory_id,
        p.subsubcategory_id,
        p.category_id_2,
        p.brand,
        p.in_stock,
        p.featured,
        p.popular,
        p.on_sale,
        p.condition,
        p.stock_qty,
        p.rating,
        p.specs,
        p.created_at
      FROM products p
      WHERE ${where} AND COALESCE(p.is_archived, false) = false
      ORDER BY p.created_at DESC
      LIMIT $2
      `,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка поиска шаблонов товара:', error);
    res.status(500).json({ error: 'Ошибка поиска шаблонов товара' });
  }
});

// РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ С‚РѕРІР°СЂС‹
router.get('/', async (req, res) => {
  try {
    await ensureProductArchiveInfrastructure();
    const { category, subcategory, subsubcategory, brand, featured, search } = req.query;
    
    // Р’Р°Р»РёРґР°С†РёСЏ РїРѕРёСЃРєРѕРІРѕРіРѕ Р·Р°РїСЂРѕСЃР°
    if (search) {
      const searchValidation = validateSearchQuery(search);
      if (!searchValidation.valid) {
        return res.status(400).json({ error: searchValidation.error });
      }
    }
    
    // Р’Р°Р»РёРґР°С†РёСЏ РєР°С‚РµРіРѕСЂРёР№, РїРѕРґРєР°С‚РµРіРѕСЂРёР№ Рё Р±СЂРµРЅРґРѕРІ
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      for (const cat of categories) {
        if (typeof cat === 'string' && !/^\d+$/.test(cat)) {
          const validation = validateString(cat, 'Категория', 0, 255, false);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }
        }
      }
    }
    
    if (subcategory) {
      const subcategories = Array.isArray(subcategory) ? subcategory : [subcategory];
      for (const subcat of subcategories) {
        if (typeof subcat === 'string' && !/^\d+$/.test(subcat)) {
          const validation = validateString(subcat, 'Подкатегория', 0, 255, false);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }
        }
      }
    }
    
    if (subsubcategory) {
      const subsubcategories = Array.isArray(subsubcategory) ? subsubcategory : [subsubcategory];
      for (const subsubcat of subsubcategories) {
        if (typeof subsubcat === 'string' && !/^\d+$/.test(subsubcat)) {
          const validation = validateString(subsubcat, 'Под-подкатегория', 0, 255, false);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }
        }
      }
    }
    
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      for (const brandName of brands) {
        const validation = validateString(brandName, 'Бренд', 0, 100, false);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
      }
    }
    
    // Р—Р°РїСЂРѕСЃ СЃ JOIN РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ РЅР°Р·РІР°РЅРёР№ РєР°С‚РµРіРѕСЂРёР№ Рё РїСЂРµС„РёРєСЃРѕРІ (РІРєР»СЋС‡Р°СЏ РІС‚РѕСЂСѓСЋ РєР°С‚РµРіРѕСЂРёСЋ)
    let query = `
      SELECT 
        p.*,
        c1.name as category_name,
        c1.product_name_prefix as category_product_name_prefix,
        c2.name as subcategory_name,
        c2.product_name_prefix as subcategory_product_name_prefix,
        c3.name as subsubcategory_name,
        c3.product_name_prefix as subsubcategory_product_name_prefix,
        c4.name as category_name_2,
        c4.product_name_prefix as category_product_name_prefix_2
      FROM products p
      LEFT JOIN categories c1 ON p.category_id = c1.id
      LEFT JOIN categories c2 ON p.subcategory_id = c2.id
      LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
      LEFT JOIN categories c4 ON p.category_id_2 = c4.id
      WHERE 1=1 AND COALESCE(p.is_archived, false) = false
    `;
    const params = [];
    let paramCount = 1;

    // РџРѕРґРґРµСЂР¶РєР° РјРЅРѕР¶РµСЃС‚РІРµРЅРЅРѕРіРѕ РІС‹Р±РѕСЂР° РєР°С‚РµРіРѕСЂРёР№ (РјР°СЃСЃРёРІ ID РёР»Рё РЅР°Р·РІР°РЅРёР№)
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      // РџСЂРѕРІРµСЂСЏРµРј, СЏРІР»СЏСЋС‚СЃСЏ Р»Рё Р·РЅР°С‡РµРЅРёСЏ С‡РёСЃР»Р°РјРё (ID) РёР»Рё СЃС‚СЂРѕРєР°РјРё (РЅР°Р·РІР°РЅРёСЏ)
      const categoryIds = [];
      const categoryNames = [];
      categories.forEach(cat => {
        if (/^\d+$/.test(cat)) {
          categoryIds.push(parseInt(cat));
        } else {
          categoryNames.push(cat);
        }
      });
      
      if (categoryIds.length > 0 && categoryNames.length > 0) {
        query += ` AND ((p.category_id = ANY($${paramCount++}::int[]) OR c1.name = ANY($${paramCount++}::text[])) OR (p.category_id_2 = ANY($${paramCount++}::int[]) OR c4.name = ANY($${paramCount++}::text[])))`;
        params.push(categoryIds, categoryNames, categoryIds, categoryNames);
      } else if (categoryIds.length > 0) {
        query += ` AND (p.category_id = ANY($${paramCount++}::int[]) OR p.category_id_2 = ANY($${paramCount++}::int[]))`;
        params.push(categoryIds, categoryIds);
      } else if (categoryNames.length > 0) {
        query += ` AND (c1.name = ANY($${paramCount++}::text[]) OR c4.name = ANY($${paramCount++}::text[]))`;
        params.push(categoryNames, categoryNames);
      }
    }
    
    // РџРѕРґРґРµСЂР¶РєР° РјРЅРѕР¶РµСЃС‚РІРµРЅРЅРѕРіРѕ РІС‹Р±РѕСЂР° РїРѕРґРєР°С‚РµРіРѕСЂРёР№
    if (subcategory) {
      const subcategories = Array.isArray(subcategory) ? subcategory : [subcategory];
      const subcategoryIds = [];
      const subcategoryNames = [];
      subcategories.forEach(subcat => {
        if (/^\d+$/.test(subcat)) {
          subcategoryIds.push(parseInt(subcat));
        } else {
          subcategoryNames.push(subcat);
        }
      });
      
      if (subcategoryIds.length > 0 && subcategoryNames.length > 0) {
        query += ` AND (p.subcategory_id = ANY($${paramCount++}::int[]) OR c2.name = ANY($${paramCount++}::text[]))`;
        params.push(subcategoryIds, subcategoryNames);
      } else if (subcategoryIds.length > 0) {
        query += ` AND p.subcategory_id = ANY($${paramCount++}::int[])`;
        params.push(subcategoryIds);
      } else if (subcategoryNames.length > 0) {
        query += ` AND c2.name = ANY($${paramCount++}::text[])`;
        params.push(subcategoryNames);
      }
    }
    
    // РџРѕРґРґРµСЂР¶РєР° РјРЅРѕР¶РµСЃС‚РІРµРЅРЅРѕРіРѕ РІС‹Р±РѕСЂР° РїРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёР№
    if (subsubcategory) {
      const subsubcategories = Array.isArray(subsubcategory) ? subsubcategory : [subsubcategory];
      const subsubcategoryIds = [];
      const subsubcategoryNames = [];
      subsubcategories.forEach(subsubcat => {
        if (/^\d+$/.test(subsubcat)) {
          subsubcategoryIds.push(parseInt(subsubcat));
        } else {
          subsubcategoryNames.push(subsubcat);
        }
      });
      
      if (subsubcategoryIds.length > 0 && subsubcategoryNames.length > 0) {
        query += ` AND (p.subsubcategory_id = ANY($${paramCount++}::int[]) OR c3.name = ANY($${paramCount++}::text[]))`;
        params.push(subsubcategoryIds, subsubcategoryNames);
      } else if (subsubcategoryIds.length > 0) {
        query += ` AND p.subsubcategory_id = ANY($${paramCount++}::int[])`;
        params.push(subsubcategoryIds);
      } else if (subsubcategoryNames.length > 0) {
        query += ` AND c3.name = ANY($${paramCount++}::text[])`;
        params.push(subsubcategoryNames);
      }
    }
    
    // РџРѕРґРґРµСЂР¶РєР° РјРЅРѕР¶РµСЃС‚РІРµРЅРЅРѕРіРѕ РІС‹Р±РѕСЂР° Р±СЂРµРЅРґРѕРІ
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      query += ` AND p.brand = ANY($${paramCount++}::text[])`;
      params.push(brands);
    }
    
    if (featured === 'true') {
      query += ` AND p.featured = true`;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка получения товаров' });
  }
});

// Экспорт товаров в Excel-совместимый XLS (HTML table format)
router.get(['/export.xls', '/export/xls'], async (req, res) => {
  try {
    const rawIds = String(req.query.ids || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const ids = rawIds.filter((x) => /^\d+$/.test(x)).map((x) => Number(x));
    const hasIdsFilter = ids.length > 0;

    const result = await pool.query(`
      SELECT
        p.id,
        p.sku,
        p.name,
        p.brand,
        p.price,
        p.original_price,
        p.stock_qty,
        p.in_stock,
        p.condition,
        p.image_url,
        p.created_at,
        c1.name AS category_name,
        c2.name AS subcategory_name,
        c3.name AS subsubcategory_name,
        c4.name AS category_name_2
      FROM products p
      LEFT JOIN categories c1 ON p.category_id = c1.id
      LEFT JOIN categories c2 ON p.subcategory_id = c2.id
      LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
      LEFT JOIN categories c4 ON p.category_id_2 = c4.id
      ${hasIdsFilter ? 'WHERE p.id = ANY($1::int[])' : ''}
      ORDER BY p.created_at DESC
    `, hasIdsFilter ? [ids] : []);

    const rows = result.rows || [];
    const tableRows = rows
      .map((p) => {
        const createdAt = p.created_at ? new Date(p.created_at).toLocaleString('ru-RU') : '';
        return `
          <tr>
            <td>${escapeHtml(p.id)}</td>
            <td>${escapeHtml(p.sku || '')}</td>
            <td>${escapeHtml(p.name || '')}</td>
            <td>${escapeHtml(p.brand || '')}</td>
            <td>${escapeHtml(p.category_name || '')}</td>
            <td>${escapeHtml(p.subcategory_name || '')}</td>
            <td>${escapeHtml(p.subsubcategory_name || '')}</td>
            <td>${escapeHtml(p.category_name_2 || '')}</td>
            <td>${escapeHtml(Number(p.price || 0))}</td>
            <td>${escapeHtml(p.original_price ?? '')}</td>
            <td>${escapeHtml(Math.max(0, Number(p.stock_qty ?? (p.in_stock ? 1 : 0)) || 0))}</td>
            <td>${p.in_stock ? 'Да' : 'Нет'}</td>
            <td>${escapeHtml(p.condition || '')}</td>
            <td>${escapeHtml(p.image_url || '')}</td>
            <td>${escapeHtml(createdAt)}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
      <html>
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Название</th>
                <th>Бренд</th>
                <th>Категория</th>
                <th>Подкатегория</th>
                <th>ПодПодКатегория</th>
                <th>2-я категория</th>
                <th>Цена</th>
                <th>Старая цена</th>
                <th>Количество</th>
                <th>В наличии</th>
                <th>Состояние</th>
                <th>Изображение</th>
                <th>Дата создания</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="products-${stamp}.xls"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(`\uFEFF${html}`);
  } catch (error) {
    console.error('Ошибка экспорта товаров:', error);
    res.status(500).json({ error: 'Ошибка экспорта товаров' });
  }
});

// РџРѕР»СѓС‡РёС‚СЊ С‚РѕРІР°СЂ РїРѕ ID РёР»Рё slug
router.get('/:identifier', async (req, res) => {
  try {
    await ensureProductArchiveInfrastructure();
    const { identifier } = req.params;
    
    // Р’Р°Р»РёРґР°С†РёСЏ identifier
    if (!identifier) {
      return res.status(400).json({ error: 'Идентификатор товара обязателен' });
    }
    
    const identifierValidation = validateString(identifier, 'Идентификатор', 1, 255, false);
    if (!identifierValidation.valid) {
      return res.status(400).json({ error: identifierValidation.error });
    }
    
    // РџСЂРѕРІРµСЂСЏРµРј, СЏРІР»СЏРµС‚СЃСЏ Р»Рё identifier С‡РёСЃР»РѕРј (ID) РёР»Рё СЃС‚СЂРѕРєРѕР№ (slug)
    const isNumeric = /^\d+$/.test(identifier);
    
    let query;
    let params;
    
    if (isNumeric) {
      // РџРѕРёСЃРє РїРѕ ID
      query = `
        SELECT 
          p.*,
          c1.name as category_name,
          c1.product_name_prefix as category_product_name_prefix,
          c2.name as subcategory_name,
          c2.product_name_prefix as subcategory_product_name_prefix,
          c3.name as subsubcategory_name,
          c3.product_name_prefix as subsubcategory_product_name_prefix,
          c4.name as category_name_2,
          c4.product_name_prefix as category_product_name_prefix_2
        FROM products p
        LEFT JOIN categories c1 ON p.category_id = c1.id
        LEFT JOIN categories c2 ON p.subcategory_id = c2.id
        LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
        LEFT JOIN categories c4 ON p.category_id_2 = c4.id
        WHERE p.id = $1 AND COALESCE(p.is_archived, false) = false
      `;
      params = [identifier];
    } else {
      // РџРѕРёСЃРє РїРѕ slug (РјРѕР¶РµС‚ Р±С‹С‚СЊ РІ С„РѕСЂРјР°С‚Рµ slug-id)
      // РР·РІР»РµРєР°РµРј ID РёР· РєРѕРЅС†Р° СЃС‚СЂРѕРєРё (РµСЃР»Рё РµСЃС‚СЊ)
      const parts = identifier.split('-');
      const lastPart = parts[parts.length - 1];
      const possibleId = /^\d+$/.test(lastPart) ? lastPart : null;
      
      const slugPrefix = `${identifier}-%`;
      // Ищем по slug, по slug-префиксу (если в БД slug вида xxx-id), а также по string-id (UUID/текст)
      query = `
        SELECT 
          p.*,
          c1.name as category_name,
          c1.product_name_prefix as category_product_name_prefix,
          c2.name as subcategory_name,
          c2.product_name_prefix as subcategory_product_name_prefix,
          c3.name as subsubcategory_name,
          c3.product_name_prefix as subsubcategory_product_name_prefix,
          c4.name as category_name_2,
          c4.product_name_prefix as category_product_name_prefix_2
        FROM products p
        LEFT JOIN categories c1 ON p.category_id = c1.id
        LEFT JOIN categories c2 ON p.subcategory_id = c2.id
        LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
        LEFT JOIN categories c4 ON p.category_id_2 = c4.id
        WHERE (p.slug = $1 OR p.slug LIKE $2 OR p.id::text = $1 ${possibleId ? 'OR p.id = $3' : ''})
          AND COALESCE(p.is_archived, false) = false
        ORDER BY
          CASE
            WHEN p.slug = $1 THEN 1
            WHEN p.id::text = $1 THEN 2
            WHEN p.slug LIKE $2 THEN 3
            ${possibleId ? 'WHEN p.id = $3 THEN 4' : ''}
            ELSE 5
          END,
          p.created_at DESC
        LIMIT 1
      `;
      params = possibleId ? [identifier, slugPrefix, parseInt(possibleId)] : [identifier, slugPrefix];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ error: 'Ошибка получения товара' });
  }
});

// РЎРѕР·РґР°С‚СЊ С‚РѕРІР°СЂ
router.post('/', async (req, res) => {
  try {
    const {
      name, model, description, price, original_price, image_url, images,
      category_id, subcategory_id, subsubcategory_id,
      category_name, subcategory_name, subsubcategory_name, // РќРѕРІС‹Рµ РїРѕР»СЏ СЃ РЅР°Р·РІР°РЅРёСЏРјРё
      category_id_2, category_name_2, // Р’С‚РѕСЂР°СЏ РіР»РѕР±Р°Р»СЊРЅР°СЏ РєР°С‚РµРіРѕСЂРёСЏ
      brand, in_stock, featured, popular, on_sale, condition, rating, specs, stock_qty
    } = req.body;

    // Минимально обязательные поля для создания товара.
    const cleanBrand = String(brand || '').trim();
    const cleanModel = String(model || '').trim();
    const normalizedPrice = (price === '' || price === null || price === undefined) ? null : Number(price);
    const hasCategory = !!(category_id || String(category_name || '').trim());

    const missing = [];
    if (!cleanBrand) missing.push('бренд');
    if (!cleanModel) missing.push('модель');
    if (!hasCategory) missing.push('категория');

    if (normalizedPrice !== null && (!Number.isFinite(normalizedPrice) || normalizedPrice < 0)) {
      return res.status(400).json({ error: 'Цена должна быть числом больше или равна 0' });
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Не заполнены обязательные поля: ${missing.join(', ')}`,
        missing,
      });
    }

    const finalName = String(name || '').trim() || `${cleanBrand} ${cleanModel}`.trim();

    // Р•СЃР»Рё РїРµСЂРµРґР°РЅС‹ РЅР°Р·РІР°РЅРёСЏ РєР°С‚РµРіРѕСЂРёР№, РЅРѕ РЅРµ ID - РЅР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РєР°С‚РµРіРѕСЂРёРё
    let finalCategoryId = category_id || null;
    let finalSubcategoryId = subcategory_id || null;
    let finalSubsubcategoryId = subsubcategory_id || null;
    let finalCategoryId2 = category_id_2 || null;

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РєР°С‚РµРіРѕСЂРёСЋ РїРѕ РЅР°Р·РІР°РЅРёСЋ
    if (category_name && !finalCategoryId) {
      const catResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name]
      );
      if (catResult.rows.length > 0) {
        finalCategoryId = catResult.rows[0].id;
      } else {
        // РЎРѕР·РґР°РµРј РєР°С‚РµРіРѕСЂРёСЋ
        const newCatResult = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name]
        );
        finalCategoryId = newCatResult.rows[0].id;
      }
    }

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РїРѕРґРєР°С‚РµРіРѕСЂРёСЋ
    if (subcategory_name && finalCategoryId && !finalSubcategoryId) {
      const subcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subcategory_name, finalCategoryId]
      );
      if (subcatResult.rows.length > 0) {
        finalSubcategoryId = subcatResult.rows[0].id;
      } else {
        const newSubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 1) RETURNING id',
          [subcategory_name, finalCategoryId]
        );
        finalSubcategoryId = newSubcatResult.rows[0].id;
      }
    }

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РїРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЋ
    if (subsubcategory_name && finalSubcategoryId && !finalSubsubcategoryId) {
      const subsubcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subsubcategory_name, finalSubcategoryId]
      );
      if (subsubcatResult.rows.length > 0) {
        finalSubsubcategoryId = subsubcatResult.rows[0].id;
      } else {
        const newSubsubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 2) RETURNING id',
          [subsubcategory_name, finalSubcategoryId]
        );
        finalSubsubcategoryId = newSubsubcatResult.rows[0].id;
      }
    }

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РІС‚РѕСЂСѓСЋ РіР»РѕР±Р°Р»СЊРЅСѓСЋ РєР°С‚РµРіРѕСЂРёСЋ РїРѕ РЅР°Р·РІР°РЅРёСЋ
    if (category_name_2 && !finalCategoryId2) {
      const cat2Result = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name_2]
      );
      if (cat2Result.rows.length > 0) {
        finalCategoryId2 = cat2Result.rows[0].id;
      } else {
        // РЎРѕР·РґР°РµРј РєР°С‚РµРіРѕСЂРёСЋ
        const newCat2Result = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name_2]
        );
        finalCategoryId2 = newCat2Result.rows[0].id;
      }
    }

    // Для новой схемы products.template_id обязателен.
    const brandRow = await pool.query(
      'SELECT id FROM brands WHERE LOWER(name::text) = LOWER($1) LIMIT 1',
      [cleanBrand]
    );
    if (brandRow.rows.length === 0) {
      return res.status(400).json({ error: 'Бренд не найден. Выберите бренд из списка или добавьте новый.' });
    }
    const brandId = brandRow.rows[0].id;

    if (!finalCategoryId) {
      return res.status(400).json({ error: 'Категория не найдена. Выберите категорию из списка.' });
    }

    const modelKey = slugifyText(cleanModel) || `model-${Date.now()}`;
    let templateId = req.body.template_id || null;
    if (templateId) {
      const t = await pool.query('SELECT id FROM product_templates WHERE id = $1 LIMIT 1', [templateId]);
      if (t.rows.length === 0) {
        return res.status(400).json({ error: 'Указанный шаблон не найден' });
      }
    } else {
      const existingTemplate = await pool.query(
        `SELECT id
         FROM product_templates
         WHERE brand_id = $1 AND category_id = $2 AND LOWER(model_key) = LOWER($3)
         LIMIT 1`,
        [brandId, finalCategoryId, modelKey]
      );
      if (existingTemplate.rows.length > 0) {
        templateId = existingTemplate.rows[0].id;
      } else {
        const newTemplate = await pool.query(
          `INSERT INTO product_templates (brand_id, category_id, model_name, model_key, base_title, description, default_specs)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
           RETURNING id`,
          [brandId, finalCategoryId, cleanModel, modelKey, finalName, description || null, JSON.stringify(specs || {})]
        );
        templateId = newTemplate.rows[0].id;
      }
    }

    // Генерация slug/sku/title для схемы products.
    let productSlug = String(req.body.slug || '').trim();
    if (!productSlug) {
      productSlug = slugifyText(finalName) || `product-${Date.now()}`;
    }

    const slugCheck = await pool.query('SELECT 1 FROM products WHERE slug = $1 LIMIT 1', [productSlug]);
    if (slugCheck.rows.length > 0) {
      productSlug = `${productSlug}-${Date.now().toString().slice(-6)}`;
    }

    const skuPrefix = `${slugifyText(cleanBrand).toUpperCase().slice(0, 4)}-${slugifyText(cleanModel).toUpperCase().slice(0, 8)}`
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
    let sku = `${skuPrefix || 'ITEM'}-${Date.now().toString().slice(-6)}`;
    const skuCheck = await pool.query('SELECT 1 FROM products WHERE sku = $1 LIMIT 1', [sku]);
    if (skuCheck.rows.length > 0) {
      sku = `${sku}-${Math.floor(Math.random() * 90 + 10)}`;
    }

    // РќРѕСЂРјР°Р»РёР·СѓРµРј С‡РёСЃР»РѕРІС‹Рµ РїРѕР»СЏ: РїСѓСЃС‚С‹Рµ СЃС‚СЂРѕРєРё -> null
    const normalizedOriginalPrice = (original_price === '' || original_price === null || original_price === undefined) ? null : parseFloat(original_price);
    const normalizedRating = (rating === '' || rating === null || rating === undefined) ? null : parseFloat(rating);

    const normalizedStockQtyRaw = stock_qty === '' || stock_qty === null || stock_qty === undefined
      ? (in_stock ? 1 : 0)
      : Number(stock_qty);
    const normalizedStockQty = String(condition || 'new').toLowerCase() === 'used'
      ? 1
      : Math.max(0, Number.isFinite(normalizedStockQtyRaw) ? normalizedStockQtyRaw : 0);
    const normalizedInStock = normalizedStockQty > 0;

    const result = await pool.query(
      `INSERT INTO products (
        template_id, sku, title, slug, condition, old_price, stock_qty, description_override, specs_override,
        name, description, price, original_price, image_url, images,
        category_id, subcategory_id, subsubcategory_id, category_id_2, brand,
        in_stock, featured, popular, on_sale, rating, specs
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26::jsonb)
      RETURNING *`,
      [
        templateId, sku, finalName, productSlug, condition || 'new',
        normalizedOriginalPrice, normalizedStockQty, description || null, JSON.stringify(specs || {}),
        finalName, description || null, normalizedPrice, normalizedOriginalPrice, image_url || null, images || [],
        finalCategoryId, finalSubcategoryId, finalSubsubcategoryId, finalCategoryId2, cleanBrand,
        normalizedInStock, featured ?? false, popular ?? false, on_sale ?? false, 
        normalizedRating, JSON.stringify(specs || {})
      ]
    );

    // Р•СЃР»Рё slug РЅРµ Р±С‹Р» СЃРѕР·РґР°РЅ, РѕР±РЅРѕРІРёРј РµРіРѕ РїРѕСЃР»Рµ РїРѕР»СѓС‡РµРЅРёСЏ ID
    let finalProduct = result.rows[0];
    if (!finalProduct.slug && finalProduct.name) {
      const generatedSlug = `${productSlug || generateSlugFromName(finalProduct.name)}-${finalProduct.id}`;
      const updateResult = await pool.query(
        'UPDATE products SET slug = $1 WHERE id = $2 RETURNING *',
        [generatedSlug, finalProduct.id]
      );
      finalProduct = updateResult.rows[0];
    }

    res.status(201).json(finalProduct);
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    if (error?.code === '23502' && error?.column) {
      return res.status(400).json({ error: `Поле "${error.column}" обязательно` });
    }
    if (error?.code === '23503') {
      return res.status(400).json({ error: 'Некорректная ссылка на связанные данные (бренд, категория или шаблон)' });
    }
    if (error?.code === '22P02') {
      return res.status(400).json({ error: 'Переданы некорректные значения полей' });
    }
    res.status(500).json({ error: 'Ошибка создания товара' });
  }
});

// РћР±РЅРѕРІРёС‚СЊ С‚РѕРІР°СЂ
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, price, original_price, image_url, images,
      category_id, subcategory_id, subsubcategory_id,
      category_name, subcategory_name, subsubcategory_name, // РќРѕРІС‹Рµ РїРѕР»СЏ СЃ РЅР°Р·РІР°РЅРёСЏРјРё
      category_id_2, category_name_2, // Р’С‚РѕСЂР°СЏ РіР»РѕР±Р°Р»СЊРЅР°СЏ РєР°С‚РµРіРѕСЂРёСЏ
      brand, in_stock, featured, popular, on_sale, condition, rating, specs, stock_qty
    } = req.body;

    // Р•СЃР»Рё РїРµСЂРµРґР°РЅС‹ РЅР°Р·РІР°РЅРёСЏ РєР°С‚РµРіРѕСЂРёР№, РЅРѕ РЅРµ ID - РЅР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РєР°С‚РµРіРѕСЂРёРё
    let finalCategoryId = category_id || null;
    let finalSubcategoryId = subcategory_id || null;
    let finalSubsubcategoryId = subsubcategory_id || null;
    let finalCategoryId2 = category_id_2 || null;

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РєР°С‚РµРіРѕСЂРёСЋ РїРѕ РЅР°Р·РІР°РЅРёСЋ
    if (category_name && !finalCategoryId) {
      const catResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name]
      );
      if (catResult.rows.length > 0) {
        finalCategoryId = catResult.rows[0].id;
      } else {
        const newCatResult = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name]
        );
        finalCategoryId = newCatResult.rows[0].id;
      }
    }

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РїРѕРґРєР°С‚РµРіРѕСЂРёСЋ
    if (subcategory_name && finalCategoryId && !finalSubcategoryId) {
      const subcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subcategory_name, finalCategoryId]
      );
      if (subcatResult.rows.length > 0) {
        finalSubcategoryId = subcatResult.rows[0].id;
      } else {
        const newSubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 1) RETURNING id',
          [subcategory_name, finalCategoryId]
        );
        finalSubcategoryId = newSubcatResult.rows[0].id;
      }
    }

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РїРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЋ
    if (subsubcategory_name && finalSubcategoryId && !finalSubsubcategoryId) {
      const subsubcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subsubcategory_name, finalSubcategoryId]
      );
      if (subsubcatResult.rows.length > 0) {
        finalSubsubcategoryId = subsubcatResult.rows[0].id;
      } else {
        const newSubsubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 2) RETURNING id',
          [subsubcategory_name, finalSubcategoryId]
        );
        finalSubsubcategoryId = newSubsubcatResult.rows[0].id;
      }
    }

    // РќР°С…РѕРґРёРј РёР»Рё СЃРѕР·РґР°РµРј РІС‚РѕСЂСѓСЋ РіР»РѕР±Р°Р»СЊРЅСѓСЋ РєР°С‚РµРіРѕСЂРёСЋ РїРѕ РЅР°Р·РІР°РЅРёСЋ
    if (category_name_2 && !finalCategoryId2) {
      const cat2Result = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name_2]
      );
      if (cat2Result.rows.length > 0) {
        finalCategoryId2 = cat2Result.rows[0].id;
      } else {
        // РЎРѕР·РґР°РµРј РєР°С‚РµРіРѕСЂРёСЋ
        const newCat2Result = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name_2]
        );
        finalCategoryId2 = newCat2Result.rows[0].id;
      }
    }

    // РџСЂРѕРІРµСЂСЏРµРј, РёР·РјРµРЅРёР»РѕСЃСЊ Р»Рё РЅР°Р·РІР°РЅРёРµ Рё РЅСѓР¶РЅРѕ Р»Рё РѕР±РЅРѕРІРёС‚СЊ slug
    let productSlug = req.body.slug;
    const currentProduct = await pool.query('SELECT name, slug FROM products WHERE id = $1', [id]);
    
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Р•СЃР»Рё РЅР°Р·РІР°РЅРёРµ РёР·РјРµРЅРёР»РѕСЃСЊ Рё slug РЅРµ РїРµСЂРµРґР°РЅ СЏРІРЅРѕ, РіРµРЅРµСЂРёСЂСѓРµРј РЅРѕРІС‹Р№ slug
    if (!productSlug && name && name !== currentProduct.rows[0].name) {
      productSlug = `${generateSlugFromName(name)}-${id}`;
    } else if (!productSlug && !currentProduct.rows[0].slug) {
      // Р•СЃР»Рё slug РЅРµС‚ СЃРѕРІСЃРµРј, СЃРѕР·РґР°РµРј РµРіРѕ
      productSlug = `${generateSlugFromName(name || currentProduct.rows[0].name)}-${id}`;
    } else {
      productSlug = productSlug || currentProduct.rows[0].slug;
    }

    // РќРѕСЂРјР°Р»РёР·СѓРµРј С‡РёСЃР»РѕРІС‹Рµ РїРѕР»СЏ: РїСѓСЃС‚С‹Рµ СЃС‚СЂРѕРєРё -> null
    const normalizedPrice = (price === '' || price === null || price === undefined) ? null : parseFloat(price);
    const normalizedOriginalPrice = (original_price === '' || original_price === null || original_price === undefined) ? null : parseFloat(original_price);
    const normalizedRating = (rating === '' || rating === null || rating === undefined) ? null : parseFloat(rating);

    const normalizedStockQtyRaw = stock_qty === '' || stock_qty === null || stock_qty === undefined
      ? (in_stock ? 1 : 0)
      : Number(stock_qty);
    const normalizedStockQty = String(condition || 'new').toLowerCase() === 'used'
      ? 1
      : Math.max(0, Number.isFinite(normalizedStockQtyRaw) ? normalizedStockQtyRaw : 0);
    const normalizedInStock = normalizedStockQty > 0;

    const result = await pool.query(
      `UPDATE products SET
        name = $1, description = $2, price = $3, original_price = $4,
        image_url = $5, images = $6, category_id = $7, subcategory_id = $8,
        subsubcategory_id = $9, category_id_2 = $10, brand = $11, in_stock = $12,
        featured = $13, popular = $14, on_sale = $15, condition = $16, rating = $17, specs = $18, slug = $19, stock_qty = $20
      WHERE id = $21
      RETURNING *`,
      [
        name, description, normalizedPrice, normalizedOriginalPrice, image_url, images || [],
        finalCategoryId, finalSubcategoryId, finalSubsubcategoryId, finalCategoryId2, brand,
        normalizedInStock, featured, popular ?? false, on_sale ?? false, 
        condition || 'new', normalizedRating, JSON.stringify(specs || {}), productSlug, normalizedStockQty, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({ error: 'Ошибка обновления товара' });
  }
});

// РЈРґР°Р»РёС‚СЊ С‚РѕРІР°СЂ
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureProductArchiveInfrastructure(client);
    const { id } = req.params;
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM products WHERE id::text = $1 FOR UPDATE', [String(id)]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Товар не найден' });
    }

    await client.query(
      `
        INSERT INTO product_archives (source_product_id, snapshot, reason)
        VALUES ($1, $2::jsonb, $3)
      `,
      [String(existing.rows[0].id), JSON.stringify(existing.rows[0]), 'manual_delete']
    );

    await client.query('DELETE FROM products WHERE id::text = $1', [String(id)]);
    await client.query('COMMIT');
    res.json({ message: 'Товар удален', id: existing.rows[0].id, archived_snapshot: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ error: 'Ошибка удаления товара' });
  } finally {
    client.release();
  }
});

export default router;


