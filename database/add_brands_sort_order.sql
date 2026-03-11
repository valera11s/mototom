-- Добавление поля sort_order для задания порядка отображения брендов

ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Создаем индекс для быстрой сортировки
CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON brands(sort_order);

-- Задаем порядок для популярных брендов (меньше число = выше в списке)
UPDATE brands SET sort_order = 1 WHERE name = 'Sony';
UPDATE brands SET sort_order = 2 WHERE name = 'Canon';
UPDATE brands SET sort_order = 3 WHERE name = 'Nikon';
UPDATE brands SET sort_order = 4 WHERE name = 'DJI';
UPDATE brands SET sort_order = 5 WHERE name = 'GoPro';
UPDATE brands SET sort_order = 6 WHERE name = 'Fujifilm';
UPDATE brands SET sort_order = 7 WHERE name = 'Panasonic';
UPDATE brands SET sort_order = 8 WHERE name = 'Leica';
UPDATE brands SET sort_order = 9 WHERE name = 'Olympus';

-- Остальные бренды получат sort_order = 0 и будут отсортированы по алфавиту после популярных

-- Проверка
SELECT name, popular, sort_order FROM brands ORDER BY sort_order, name;





