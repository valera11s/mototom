-- Создание таблицы брендов
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по имени бренда
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Добавляем внешний ключ к таблице products (опционально, если хотим связать)
-- ALTER TABLE products ADD COLUMN brand_id INTEGER REFERENCES brands(id);
-- Но пока оставляем brand как VARCHAR для обратной совместимости


