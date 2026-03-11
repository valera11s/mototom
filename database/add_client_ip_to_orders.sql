-- Добавление поля client_ip в таблицу orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS client_ip VARCHAR(45);

-- Индекс для быстрого поиска по IP
CREATE INDEX IF NOT EXISTS idx_orders_client_ip ON orders(client_ip);



