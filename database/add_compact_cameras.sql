-- Скрипт для добавления товаров с брендом DJI
-- Категория: Фотоаппараты (существующая)
-- Подкатегория: Зеркальные фотоаппараты (существующая)

-- 1. Добавляем бренд DJI если его нет
INSERT INTO brands (name)
SELECT 'DJI'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'DJI');

-- 2. Получаем ID существующих категорий
DO $$
DECLARE
    v_category_id INTEGER;
    v_subcategory_id INTEGER;
BEGIN
    -- Находим существующую категорию "Фотоаппараты"
    SELECT id INTO v_category_id FROM categories WHERE name = 'Фотоаппараты' AND parent_id IS NULL LIMIT 1;
    
    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Категория "Фотоаппараты" не найдена. Создайте её сначала.';
    END IF;
    
    -- Находим существующую подкатегорию "Зеркальные фотоаппараты"
    SELECT id INTO v_subcategory_id FROM categories WHERE name = 'Зеркальные фотоаппараты' AND parent_id = v_category_id LIMIT 1;
    
    IF v_subcategory_id IS NULL THEN
        RAISE EXCEPTION 'Подкатегория "Зеркальные фотоаппараты" не найдена. Создайте её сначала.';
    END IF;
    
    -- Добавляем товары DJI (только если их еще нет)
    INSERT INTO products (name, price, brand, category_id, subcategory_id, image_url, in_stock, condition)
    SELECT * FROM (VALUES 
        ('DJI Osmo 360 Action Standard Combo', 36000, 'DJI', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/65/2621562945/large_1753964941_1900217.jpg', true, 'new'),
        ('DJI Osmo 360 Action Adventure Combo', 38500, 'DJI', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/6657/2621561345/large_1753983162_1900218.jpg', true, 'new'),
        ('DJI Osmo Action 5 Pro Standard Combo', 28000, 'DJI', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/1884/920348508/large_1726735599_1846517.jpg', true, 'new'),
        ('DJI Osmo Action 5 Pro Adventure Combo', 33500, 'DJI', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/1370/920347994/large_1726735599_1846517.jpg', true, 'new')
    ) AS v(name, price, brand, category_id, subcategory_id, image_url, in_stock, condition)
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = v.name);
    
    -- Добавляем товары Sony (только если их еще нет)
    INSERT INTO products (name, price, brand, category_id, subcategory_id, image_url, in_stock, condition)
    SELECT * FROM (VALUES 
        ('Sony Cyber-shot DSC-RX100M7G', 95000, 'Sony', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/6860/899676876/large_1570800636_IMG_1265277.jpg', true, 'new'),
        ('Sony ZV-1F', 36500, 'Sony', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/5650/611653138/large_4_large.png', true, 'new'),
        ('Sony Cyber-shot DSC-RX10M4', 200000, 'Sony', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/586/596558410/large_375de19bd6b9c6779f8e50b863fc2a60.jpg', false, 'new'),
        ('Sony ZV-1 Black', 46500, 'Sony', v_category_id, v_subcategory_id, 'https://static.insales-cdn.com/images/products/1/3535/551169487/large_ZV-1_0.jpg', false, 'new')
    ) AS v(name, price, brand, category_id, subcategory_id, image_url, in_stock, condition)
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = v.name);
    
    RAISE NOTICE 'Товары успешно добавлены. Категория ID: %, Подкатегория ID: %', v_category_id, v_subcategory_id;
END $$;

-- Проверка добавленных товаров
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
WHERE c1.name = 'Фотоаппараты' AND c2.name = 'Зеркальные фотоаппараты' AND p.brand IN ('DJI', 'Sony')
ORDER BY p.brand, p.name;

