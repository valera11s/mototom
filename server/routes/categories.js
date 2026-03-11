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

  return slug || `category-${Date.now()}`;
}

// РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ РєР°С‚РµРіРѕСЂРёРё
router.get('/', async (req, res) => {
  try {
    const { parent_id, all } = req.query;
    let query = 'SELECT * FROM categories';
    const params = [];

    // Р•СЃР»Рё РїР°СЂР°РјРµС‚СЂ all=true, РІРѕР·РІСЂР°С‰Р°РµРј РІСЃРµ РєР°С‚РµРіРѕСЂРёРё Р±РµР· С„РёР»СЊС‚СЂР°С†РёРё
    if (all === 'true') {
      query += ' ORDER BY level, name';
      const result = await pool.query(query);
      return res.json(result.rows);
    }

    // РРЅР°С‡Рµ С„РёР»СЊС‚СЂСѓРµРј РїРѕ parent_id
    if (parent_id !== undefined) {
      if (parent_id === 'null') {
        query += ' WHERE parent_id IS NULL';
      } else {
        query += ' WHERE parent_id = $1';
        params.push(parent_id);
      }
    } else {
      query += ' WHERE parent_id IS NULL';
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

// РџРѕР»СѓС‡РёС‚СЊ РІСЃРµ РєР°С‚РµРіРѕСЂРёРё СЃ РёРµСЂР°СЂС…РёРµР№
router.get('/tree', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, parent_id, level, created_at
        FROM categories
        WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, c.name, c.parent_id, c.level, c.created_at
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree ORDER BY level, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения дерева категорий:', error);
    res.status(500).json({ error: 'Ошибка получения дерева категорий' });
  }
});

// РџРѕР»СѓС‡РёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ РїРѕ ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения категории:', error);
    res.status(500).json({ error: 'Ошибка получения категории' });
  }
});

// РЎРѕР·РґР°С‚СЊ РєР°С‚РµРіРѕСЂРёСЋ
router.post('/', async (req, res) => {
  try {
    const { name, parent_id, level, product_name_prefix } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const cleanName = String(name).trim();
    const slug = slugify(cleanName);
    if (!slug) {
      return res.status(400).json({ error: 'Некорректное название категории' });
    }

    let resolvedLevel = Number(level || 0);
    if (parent_id) {
      const parent = await pool.query('SELECT level FROM categories WHERE id = $1', [parent_id]);
      if (parent.rows.length === 0) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }
      resolvedLevel = Number(parent.rows[0].level || 0) + 1;
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, parent_id, level, product_name_prefix)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name,
           parent_id = EXCLUDED.parent_id,
           level = EXCLUDED.level,
           product_name_prefix = EXCLUDED.product_name_prefix,
           updated_at = now()
       RETURNING *`,
      [cleanName, slug, parent_id || null, resolvedLevel, product_name_prefix || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

// РћР±РЅРѕРІРёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, level, product_name_prefix } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const cleanName = String(name).trim();
    const slug = slugify(cleanName);
    if (!slug) {
      return res.status(400).json({ error: 'Некорректное название категории' });
    }

    let resolvedLevel = Number(level || 0);
    if (parent_id) {
      const parent = await pool.query('SELECT level FROM categories WHERE id = $1', [parent_id]);
      if (parent.rows.length === 0) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }
      resolvedLevel = Number(parent.rows[0].level || 0) + 1;
    }
    
    const result = await pool.query(
      `UPDATE categories
       SET name = $1,
           slug = $2,
           parent_id = $3,
           level = $4,
           product_name_prefix = $5,
           updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [cleanName, slug, parent_id || null, resolvedLevel, product_name_prefix || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// РџРѕР»СѓС‡РёС‚СЊ С‚РѕРІР°СЂС‹ РєР°С‚РµРіРѕСЂРёРё
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        p.*,
        c1.name as category_name,
        c1.product_name_prefix as category_product_name_prefix,
        c2.name as subcategory_name,
        c2.product_name_prefix as subcategory_product_name_prefix,
        c3.name as subsubcategory_name,
        c3.product_name_prefix as subsubcategory_product_name_prefix
      FROM products p
      LEFT JOIN categories c1 ON p.category_id = c1.id
      LEFT JOIN categories c2 ON p.subcategory_id = c2.id
      LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
      WHERE p.category_id = $1 OR p.subcategory_id = $1 OR p.subsubcategory_id = $1
      ORDER BY p.name`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения товаров категории:', error);
    res.status(500).json({ error: 'Ошибка получения товаров категории' });
  }
});

// РњР°СЃСЃРѕРІС‹Р№ РїРµСЂРµРЅРѕСЃ С‚РѕРІР°СЂРѕРІ РёР· РѕРґРЅРѕР№ РєР°С‚РµРіРѕСЂРёРё РІ РґСЂСѓРіСѓСЋ
router.post('/:id/move-products', async (req, res) => {
  try {
    const { id } = req.params;
    // РџРѕРґРґРµСЂР¶РёРІР°РµРј РѕР±Р° С„РѕСЂРјР°С‚Р°: snake_case Рё camelCase
    const { 
      target_category_id, 
      clear_subcategory, 
      clear_subsubcategory,
      targetCategoryId,
      clearSubcategory,
      clearSubsubcategory
    } = req.body;
    
    // РСЃРїРѕР»СЊР·СѓРµРј camelCase РµСЃР»Рё snake_case РЅРµ Р·Р°РґР°РЅ
    const finalTargetCategoryId = target_category_id || targetCategoryId;
    const finalClearSubcategory = clear_subcategory !== undefined ? clear_subcategory : (clearSubcategory !== undefined ? clearSubcategory : false);
    const finalClearSubsubcategory = clear_subsubcategory !== undefined ? clear_subsubcategory : (clearSubsubcategory !== undefined ? clearSubsubcategory : false);
    
    // РћРїСЂРµРґРµР»СЏРµРј, РєР°РєРѕРµ РїРѕР»Рµ РЅСѓР¶РЅРѕ РѕР±РЅРѕРІР»СЏС‚СЊ РЅР° РѕСЃРЅРѕРІРµ СѓСЂРѕРІРЅСЏ РєР°С‚РµРіРѕСЂРёРё
    const categoryInfo = await pool.query('SELECT level FROM categories WHERE id = $1', [id]);
    if (categoryInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    const categoryLevel = categoryInfo.rows[0].level;
    let updateQuery;
    let updateParams = [];
    
    if (categoryLevel === 0) {
      // РћСЃРЅРѕРІРЅР°СЏ РєР°С‚РµРіРѕСЂРёСЏ - РѕР±РЅРѕРІР»СЏРµРј category_id
      updateQuery = 'UPDATE products SET category_id = $1';
      updateParams = [finalTargetCategoryId];
      if (finalClearSubcategory) {
        updateQuery += ', subcategory_id = NULL';
      }
      if (finalClearSubsubcategory) {
        updateQuery += ', subsubcategory_id = NULL';
      }
      updateQuery += ' WHERE category_id = $2';
      updateParams.push(id);
    } else if (categoryLevel === 1) {
      // РџРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕР±РЅРѕРІР»СЏРµРј subcategory_id
      updateQuery = 'UPDATE products SET subcategory_id = $1';
      updateParams = [finalTargetCategoryId || null];
      if (finalClearSubsubcategory) {
        updateQuery += ', subsubcategory_id = NULL';
      }
      updateQuery += ' WHERE subcategory_id = $2';
      updateParams.push(id);
    } else {
      // РџРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕР±РЅРѕРІР»СЏРµРј subsubcategory_id
      updateQuery = 'UPDATE products SET subsubcategory_id = $1 WHERE subsubcategory_id = $2';
      updateParams = [finalTargetCategoryId || null, id];
    }
    
    const result = await pool.query(updateQuery, updateParams);
    
    res.json({ 
      message: 'Товары успешно перенесены', 
      affected: result.rowCount 
    });
  } catch (error) {
    console.error('Ошибка переноса товаров:', error);
    res.status(500).json({ error: 'Ошибка переноса товаров' });
  }
});

// Р РµРєСѓСЂСЃРёРІРЅР°СЏ С„СѓРЅРєС†РёСЏ РґР»СЏ СѓРґР°Р»РµРЅРёСЏ РєР°С‚РµРіРѕСЂРёРё Рё РІСЃРµС… РµС‘ РґРѕС‡РµСЂРЅРёС… РєР°С‚РµРіРѕСЂРёР№
async function deleteCategoryRecursive(categoryId, pool) {
  // РџРѕР»СѓС‡Р°РµРј РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РєР°С‚РµРіРѕСЂРёРё
  const categoryInfo = await pool.query('SELECT level FROM categories WHERE id = $1', [categoryId]);
  if (categoryInfo.rows.length === 0) return;
  
  const categoryLevel = categoryInfo.rows[0].level;
  
  // РџРѕР»СѓС‡Р°РµРј РІСЃРµ РґРѕС‡РµСЂРЅРёРµ РєР°С‚РµРіРѕСЂРёРё
  const children = await pool.query(
    'SELECT id FROM categories WHERE parent_id = $1',
    [categoryId]
  );
  
  // Р РµРєСѓСЂСЃРёРІРЅРѕ СѓРґР°Р»СЏРµРј РІСЃРµ РґРѕС‡РµСЂРЅРёРµ РєР°С‚РµРіРѕСЂРёРё
  for (const child of children.rows) {
    await deleteCategoryRecursive(child.id, pool);
  }
  
  // РћС‡РёС‰Р°РµРј РїСЂРёРІСЏР·РєРё С‚РѕРІР°СЂРѕРІ РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ СѓСЂРѕРІРЅСЏ РєР°С‚РµРіРѕСЂРёРё
  if (categoryLevel === 1) {
    // РџРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕС‡РёС‰Р°РµРј subcategory_id Рё subsubcategory_id
    await pool.query(
      'UPDATE products SET subcategory_id = NULL, subsubcategory_id = NULL WHERE subcategory_id = $1',
      [categoryId]
    );
  } else if (categoryLevel === 2) {
    // РџРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕС‡РёС‰Р°РµРј subsubcategory_id
    await pool.query(
      'UPDATE products SET subsubcategory_id = NULL WHERE subsubcategory_id = $1',
      [categoryId]
    );
  }
  
  // РЈРґР°Р»СЏРµРј СЃР°РјСѓ РєР°С‚РµРіРѕСЂРёСЋ
  await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
}

// РЈРґР°Р»РёС‚СЊ РєР°С‚РµРіРѕСЂРёСЋ
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { with_children } = req.query;
    
    // РџРѕР»СѓС‡Р°РµРј РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РєР°С‚РµРіРѕСЂРёРё
    const categoryInfo = await pool.query('SELECT level, name FROM categories WHERE id = $1', [id]);
    if (categoryInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    const categoryLevel = categoryInfo.rows[0].level;
    const categoryName = categoryInfo.rows[0].name;
    
    // РџСЂРѕРІРµСЂСЏРµРј, РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ Р»Рё РєР°С‚РµРіРѕСЂРёСЏ РІ С‚РѕРІР°СЂР°С… (РІ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РѕС‚ СѓСЂРѕРІРЅСЏ РєР°С‚РµРіРѕСЂРёРё)
    let productsCheckQuery;
    if (categoryLevel === 0) {
      // РћСЃРЅРѕРІРЅР°СЏ РєР°С‚РµРіРѕСЂРёСЏ - РїСЂРѕРІРµСЂСЏРµРј С‚РѕР»СЊРєРѕ category_id
      productsCheckQuery = 'SELECT COUNT(*) as count FROM products WHERE category_id = $1';
    } else if (categoryLevel === 1) {
      // РџРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РїСЂРѕРІРµСЂСЏРµРј С‚РѕР»СЊРєРѕ subcategory_id
      productsCheckQuery = 'SELECT COUNT(*) as count FROM products WHERE subcategory_id = $1';
    } else {
      // РџРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РїСЂРѕРІРµСЂСЏРµРј С‚РѕР»СЊРєРѕ subsubcategory_id
      productsCheckQuery = 'SELECT COUNT(*) as count FROM products WHERE subsubcategory_id = $1';
    }
    
    const productsCheck = await pool.query(productsCheckQuery, [id]);
    const productsCount = parseInt(productsCheck.rows[0].count);
    
    // РџСЂРѕРІРµСЂСЏРµРј, РµСЃС‚СЊ Р»Рё РґРѕС‡РµСЂРЅРёРµ РєР°С‚РµРіРѕСЂРёРё
    const childrenCheck = await pool.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [id]
    );
    const childrenCount = parseInt(childrenCheck.rows[0].count);
    
    // Р•СЃР»Рё РµСЃС‚СЊ РґРѕС‡РµСЂРЅРёРµ РєР°С‚РµРіРѕСЂРёРё Рё РЅРµ СѓРєР°Р·Р°РЅ РїР°СЂР°РјРµС‚СЂ with_children
    if (childrenCount > 0 && with_children !== 'true') {
      return res.status(400).json({ 
        error: 'Категория имеет подкатегории и не может быть удалена',
        childrenCount: childrenCount
      });
    }
    
    // Р•СЃР»Рё СѓРєР°Р·Р°РЅ РїР°СЂР°РјРµС‚СЂ with_children, СѓРґР°Р»СЏРµРј РІСЃРµ РґРѕС‡РµСЂРЅРёРµ РєР°С‚РµРіРѕСЂРёРё СЂРµРєСѓСЂСЃРёРІРЅРѕ
    if (with_children === 'true') {
      let totalDeletedChildren = 0;
      
      // Р•СЃР»Рё РµСЃС‚СЊ РґРѕС‡РµСЂРЅРёРµ РєР°С‚РµРіРѕСЂРёРё, РїРѕРґСЃС‡РёС‚С‹РІР°РµРј РёС… (РІРєР»СЋС‡Р°СЏ РІР»РѕР¶РµРЅРЅС‹Рµ)
      if (childrenCount > 0) {
        const allChildren = await pool.query(
          `WITH RECURSIVE children AS (
            SELECT id FROM categories WHERE parent_id = $1
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN children ch ON c.parent_id = ch.id
          ) SELECT COUNT(*) as count FROM children`,
          [id]
        );
        totalDeletedChildren = parseInt(allChildren.rows[0].count);
      }
      
      // РћС‡РёС‰Р°РµРј РїСЂРёРІСЏР·РєРё С‚РѕРІР°СЂРѕРІ РґР»СЏ РѕСЃРЅРѕРІРЅРѕР№ РєР°С‚РµРіРѕСЂРёРё РїРµСЂРµРґ СѓРґР°Р»РµРЅРёРµРј
      if (categoryLevel === 0 && productsCount > 0) {
        // Р”Р»СЏ РѕСЃРЅРѕРІРЅРѕР№ РєР°С‚РµРіРѕСЂРёРё РѕС‡РёС‰Р°РµРј category_id, subcategory_id Рё subsubcategory_id
        await pool.query(
          'UPDATE products SET category_id = NULL, subcategory_id = NULL, subsubcategory_id = NULL WHERE category_id = $1',
          [id]
        );
      } else if (categoryLevel === 1 && productsCount > 0) {
        // РџРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕС‡РёС‰Р°РµРј subcategory_id Рё subsubcategory_id
        await pool.query(
          'UPDATE products SET subcategory_id = NULL, subsubcategory_id = NULL WHERE subcategory_id = $1',
          [id]
        );
      } else if (categoryLevel === 2 && productsCount > 0) {
        // РџРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕС‡РёС‰Р°РµРј subsubcategory_id
        await pool.query(
          'UPDATE products SET subsubcategory_id = NULL WHERE subsubcategory_id = $1',
          [id]
        );
      }
      
      // РЈРґР°Р»СЏРµРј РєР°С‚РµРіРѕСЂРёСЋ Рё РІСЃРµ РµС‘ РґРѕС‡РµСЂРЅРёРµ РєР°С‚РµРіРѕСЂРёРё СЂРµРєСѓСЂСЃРёРІРЅРѕ
      await deleteCategoryRecursive(id, pool);
      
      // РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РєР°С‚РµРіРѕСЂРёСЏ Р±С‹Р»Р° СѓРґР°Р»РµРЅР°
      const checkResult = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
      if (checkResult.rows.length > 0) {
        return res.status(500).json({ error: 'Ошибка удаления категории' });
      }
      
      return res.json({ 
        message: `Категория "${categoryName}"${totalDeletedChildren > 0 ? ` и все её подкатегории (${totalDeletedChildren})` : ''} успешно удалена.${productsCount > 0 ? ` Привязки ${productsCount} товаров были автоматически очищены.` : ''}`, 
        category: categoryInfo.rows[0],
        deletedChildren: totalDeletedChildren
      });
    }
    
    // Р•СЃР»Рё СЌС‚Рѕ РїРѕРґРєР°С‚РµРіРѕСЂРёСЏ РёР»Рё РїРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЏ, Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РѕС‡РёС‰Р°РµРј РїСЂРёРІСЏР·РєРё
    if (productsCount > 0) {
      if (categoryLevel === 1) {
        // РџРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕС‡РёС‰Р°РµРј subcategory_id Рё subsubcategory_id
        await pool.query(
          'UPDATE products SET subcategory_id = NULL, subsubcategory_id = NULL WHERE subcategory_id = $1',
          [id]
        );
      } else if (categoryLevel === 2) {
        // РџРѕРґ-РїРѕРґРєР°С‚РµРіРѕСЂРёСЏ - РѕС‡РёС‰Р°РµРј subsubcategory_id
        await pool.query(
          'UPDATE products SET subsubcategory_id = NULL WHERE subsubcategory_id = $1',
          [id]
        );
      } else {
        // РћСЃРЅРѕРІРЅР°СЏ РєР°С‚РµРіРѕСЂРёСЏ - РЅРµ СѓРґР°Р»СЏРµРј, РЅСѓР¶РЅРѕ СЏРІРЅРѕ РїРµСЂРµРЅРѕСЃРёС‚СЊ С‚РѕРІР°СЂС‹
        // РџРѕР»СѓС‡Р°РµРј РґРµС‚Р°Р»СЊРЅСѓСЋ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ РїСЂРёРІСЏР·РєР°С…
        const detailsCheck = await pool.query(
          'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
          [id]
        );
        const directCount = parseInt(detailsCheck.rows[0].count);
        return res.status(400).json({ 
          error: `Категория используется в ${directCount} товарах (привязано через category_id) и не может быть удалена. Используйте функцию переноса товаров в админке.`,
          productsCount: directCount,
          categoryLevel: categoryLevel
        });
      }
    }
    
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json({ 
      message: productsCount > 0 
        ? `Категория удалена. Привязки ${productsCount} товаров были автоматически очищены.` 
        : 'Категория удалена', 
      category: result.rows[0] 
    });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

export default router;



