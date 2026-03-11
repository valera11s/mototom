-- Добавление второго поля категории для товаров
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id_2 INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- Создание индекса для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_products_category_2 ON products(category_id_2);

-- Комментарий для документации
COMMENT ON COLUMN products.category_id_2 IS 'Вторая глобальная категория товара';



