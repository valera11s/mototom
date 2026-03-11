-- Добавление поля popular в таблицу brands для отметки популярных брендов

ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;

-- Создаем индекс для быстрой сортировки
CREATE INDEX IF NOT EXISTS idx_brands_popular ON brands(popular);

-- Отмечаем популярные бренды (можно изменить список по необходимости)
UPDATE brands 
SET popular = true 
WHERE name IN ('Sony', 'Canon', 'Nikon', 'DJI', 'GoPro', 'Fujifilm', 'Panasonic', 'Leica', 'Olympus');

-- Проверка
SELECT name, popular FROM brands ORDER BY popular DESC, name;





