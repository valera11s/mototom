-- Скрипт для заполнения категорий (опционально)
-- Можно выполнить после создания таблиц для предзаполнения категорий

-- Пример: добавление основных категорий
INSERT INTO categories (name, parent_id, level) VALUES
('Leica', NULL, 0),
('Фотоаппараты', NULL, 0),
('Объективы', NULL, 0),
('Видеокамеры', NULL, 0),
('Вспышки', NULL, 0),
('Штативы', NULL, 0),
('Аксессуары', NULL, 0),
('Карты памяти', NULL, 0),
('Бинокли', NULL, 0)
ON CONFLICT DO NOTHING;

-- Пример: добавление подкатегорий для Leica
INSERT INTO categories (name, parent_id, level)
SELECT 'Дальномерные', id, 1 FROM categories WHERE name = 'Leica' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, parent_id, level)
SELECT 'Компактные', id, 1 FROM categories WHERE name = 'Leica' LIMIT 1
ON CONFLICT DO NOTHING;

-- И так далее для остальных категорий...



