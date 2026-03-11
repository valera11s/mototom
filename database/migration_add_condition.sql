-- Добавление поля состояния (condition) к таблице товаров
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'new';

-- Добавляем CHECK constraint для валидации значений
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_condition_check;
ALTER TABLE products ADD CONSTRAINT products_condition_check 
  CHECK (condition IN ('new', 'used', 'Новое', 'Б/У') OR condition IS NULL);

-- Обновляем существующие записи, устанавливая значение по умолчанию
UPDATE products SET condition = 'new' WHERE condition IS NULL;


