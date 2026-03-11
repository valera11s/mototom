-- Добавление полей popular и on_sale в таблицу products

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS on_sale BOOLEAN DEFAULT false;

-- Создать индексы для оптимизации фильтрации
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(popular);
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(on_sale);



