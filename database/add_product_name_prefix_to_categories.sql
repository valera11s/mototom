-- Добавление поля product_name_prefix в таблицу categories
-- Это поле используется для автоматического добавления префикса к названию товара при отображении

-- Добавляем поле product_name_prefix
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS product_name_prefix VARCHAR(255);

-- Обновляем существующие категории с предустановленными префиксами
UPDATE categories 
SET product_name_prefix = 'Фотоаппарат'
WHERE name = 'Фотоаппараты' AND (product_name_prefix IS NULL OR product_name_prefix = '');

UPDATE categories 
SET product_name_prefix = 'Объектив'
WHERE name = 'Объективы' AND (product_name_prefix IS NULL OR product_name_prefix = '');

-- Проверка результата
SELECT id, name, product_name_prefix FROM categories WHERE product_name_prefix IS NOT NULL;




