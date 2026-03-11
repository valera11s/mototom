-- Добавление поля slug в таблицу products для SEO-оптимизации URL

-- Добавляем поле slug
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Создаем индекс для быстрого поиска по slug
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Функция для генерации slug из названия товара
CREATE OR REPLACE FUNCTION generate_slug(text_value TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Приводим к нижнему регистру
    result := LOWER(text_value);
    -- Заменяем кириллические буквы на латинские транслитерацией
    result := translate(result, 
        'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
        'abvgdeezhziyklmnoprstufkhchshschiyeyuya'
    );
    -- Заменяем пробелы на дефисы
    result := regexp_replace(result, '\s+', '-', 'g');
    -- Удаляем все не-алфавитно-цифровые символы кроме дефисов
    result := regexp_replace(result, '[^a-z0-9\-]', '', 'g');
    -- Заменяем множественные дефисы на один
    result := regexp_replace(result, '\-+', '-', 'g');
    -- Удаляем дефисы в начале и конце
    result := trim(both '-' from result);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Генерируем slug для всех существующих товаров
UPDATE products 
SET slug = generate_slug(name) || '-' || id
WHERE slug IS NULL OR slug = '';

-- Уникальный индекс на slug (после обновления)
-- Создаем уникальный индекс только если все slug уникальны
DO $$
BEGIN
    -- Проверяем, есть ли дубликаты
    IF NOT EXISTS (
        SELECT 1 
        FROM products 
        GROUP BY slug 
        HAVING COUNT(*) > 1
    ) THEN
        -- Если дубликатов нет, создаем уникальный индекс
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_products_slug_unique'
        ) THEN
            CREATE UNIQUE INDEX idx_products_slug_unique ON products(slug);
        END IF;
    END IF;
END $$;

-- Проверка результата
SELECT id, name, slug FROM products LIMIT 10;





