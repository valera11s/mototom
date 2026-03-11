-- Обновление существующих данных в таблице settings
-- Используйте эти запросы, если таблица settings уже существует и содержит данные

-- Обновление названия компании
UPDATE settings 
SET value = E'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АЛЬ-МАМУН МД АБДУЛЛА',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'company_name';

-- Обновление ИНН
UPDATE settings 
SET value = '502412753882',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'company_inn';

-- Обновление телефона
UPDATE settings 
SET value = '7 (968) 800-86-46',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'phone';

-- Обновление телефона для ссылок
UPDATE settings 
SET value = '79688008646',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'phone_formatted';

-- Обновление адреса (с переносами строк)
UPDATE settings 
SET value = E'Метро: Автозаводская\nЛенинская слобода 26\nБЦ Омега 2\nКорпус А',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'address';

-- Обновление email
UPDATE settings 
SET value = 'info@besttechno.ru',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'email';

-- Обновление режима работы (с переносами строк)
UPDATE settings 
SET value = E'Пн-Пт: 10:00 - 21:00\nСб-Вс: 11:00 - 19:00',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'working_hours';

-- Если какой-то записи нет, можно добавить её
-- (ON CONFLICT обновит, если уже есть, или создаст новую)
INSERT INTO settings (key, value, description) VALUES
('company_name', E'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АЛЬ-МАМУН МД АБДУЛЛА', 'Название компании'),
('company_inn', '502412753882', 'ИНН компании'),
('phone', '7 (968) 800-86-46', 'Номер телефона'),
('phone_formatted', '79688008646', 'Номер телефона для ссылок tel:'),
('address', E'Метро: Автозаводская\nЛенинская слобода 26\nБЦ Омега 2\nКорпус А', 'Адрес компании'),
('email', 'info@besttechno.ru', 'Email компании'),
('working_hours', E'Пн-Пт: 10:00 - 21:00\nСб-Вс: 11:00 - 19:00', 'Режим работы')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;


