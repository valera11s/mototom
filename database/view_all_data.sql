-- Запросы для просмотра всех данных в базе

-- 1. Все категории с иерархией
SELECT 
    id,
    name,
    parent_id,
    level,
    created_at
FROM categories
ORDER BY level, parent_id NULLS FIRST, name;

-- 2. Категории с их подкатегориями (древовидная структура)
SELECT 
    c1.id as category_id,
    c1.name as category_name,
    c2.id as subcategory_id,
    c2.name as subcategory_name,
    c3.id as subsubcategory_id,
    c3.name as subsubcategory_name
FROM categories c1
LEFT JOIN categories c2 ON c2.parent_id = c1.id
LEFT JOIN categories c3 ON c3.parent_id = c2.id
WHERE c1.parent_id IS NULL
ORDER BY c1.name, c2.name, c3.name;

-- 3. Все товары с категориями
SELECT 
    p.id,
    p.name,
    p.price,
    p.brand,
    p.in_stock,
    p.condition,
    c1.name as category_name,
    c1.id as category_id,
    c2.name as subcategory_name,
    c2.id as subcategory_id,
    c3.name as subsubcategory_name,
    p.created_at
FROM products p
LEFT JOIN categories c1 ON p.category_id = c1.id
LEFT JOIN categories c2 ON p.subcategory_id = c2.id
LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
ORDER BY p.id;

-- 4. Товары по категориям (группировка)
SELECT 
    c1.name as category,
    c2.name as subcategory,
    COUNT(p.id) as products_count,
    COUNT(p.id) FILTER (WHERE p.in_stock = true) as in_stock_count
FROM categories c1
LEFT JOIN categories c2 ON c2.parent_id = c1.id
LEFT JOIN products p ON p.category_id = c1.id AND p.subcategory_id = c2.id
WHERE c1.parent_id IS NULL
GROUP BY c1.name, c2.name, c1.id, c2.id
HAVING COUNT(p.id) > 0
ORDER BY c1.name, c2.name;

-- 5. Все бренды
SELECT 
    id,
    name,
    created_at
FROM brands
ORDER BY name;

-- 6. Уникальные бренды из товаров
SELECT DISTINCT 
    brand,
    COUNT(*) as products_count
FROM products
WHERE brand IS NOT NULL
GROUP BY brand
ORDER BY brand;

-- 7. Статистика товаров
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE in_stock = true) as in_stock_count,
    COUNT(*) FILTER (WHERE in_stock = false) as out_of_stock_count,
    COUNT(*) FILTER (WHERE popular = true) as popular_count,
    COUNT(*) FILTER (WHERE featured = true) as featured_count,
    COUNT(*) FILTER (WHERE on_sale = true) as on_sale_count,
    COUNT(DISTINCT brand) as unique_brands
FROM products;

-- 8. Категория "Фотоаппараты" и её подкатегории (детально)
SELECT 
    c1.id,
    c1.name,
    c1.parent_id,
    c1.level,
    CASE 
        WHEN c1.parent_id IS NULL THEN 'Основная категория'
        ELSE 'Подкатегория'
    END as type
FROM categories c1
WHERE c1.name = 'Фотоаппараты' 
   OR c1.parent_id = (SELECT id FROM categories WHERE name = 'Фотоаппараты' AND parent_id IS NULL LIMIT 1)
ORDER BY c1.level, c1.name;

-- 9. Товары в категории "Фотоаппараты"
SELECT 
    p.id,
    p.name,
    p.price,
    p.brand,
    p.in_stock,
    c1.name as category,
    c2.name as subcategory
FROM products p
LEFT JOIN categories c1 ON p.category_id = c1.id
LEFT JOIN categories c2 ON p.subcategory_id = c2.id
WHERE c1.name = 'Фотоаппараты'
ORDER BY c2.name, p.brand, p.name;





