-- Добавление поля archived в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);


