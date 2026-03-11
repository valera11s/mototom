-- Полное обновление всех настроек с правильной UTF-8 кодировкой
-- Установите кодировку клиента перед выполнением:
-- SET client_encoding = 'UTF8';

-- Обновление всех полей используя CHR(10) для переносов строк
UPDATE settings 
SET value = 'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АЛЬ-МАМУН МД АБДУЛЛА',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'company_name';

UPDATE settings 
SET value = '502412753882',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'company_inn';

UPDATE settings 
SET value = '7 (968) 800-86-46',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'phone';

UPDATE settings 
SET value = '79688008646',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'phone_formatted';

-- Адрес с переносами через CHR(10)
UPDATE settings 
SET value = 'Метро: Автозаводская' || CHR(10) || 
            'Ленинская слобода 26' || CHR(10) || 
            'БЦ Омега 2' || CHR(10) || 
            'Корпус А',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'address';

UPDATE settings 
SET value = 'info@besttechno.ru',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'email';

-- Режим работы с переносами через CHR(10)
UPDATE settings 
SET value = 'Пн-Пт: 10:00 - 21:00' || CHR(10) || 
            'Сб-Вс: 11:00 - 19:00',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'working_hours';

-- Если записей нет, создадим их
INSERT INTO settings (key, value, description) 
SELECT 'company_name', 'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АЛЬ-МАМУН МД АБДУЛЛА', 'Название компании'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'company_name');

INSERT INTO settings (key, value, description) 
SELECT 'company_inn', '502412753882', 'ИНН компании'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'company_inn');

INSERT INTO settings (key, value, description) 
SELECT 'phone', '7 (968) 800-86-46', 'Номер телефона'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'phone');

INSERT INTO settings (key, value, description) 
SELECT 'phone_formatted', '79688008646', 'Номер телефона для ссылок tel:'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'phone_formatted');

INSERT INTO settings (key, value, description) 
SELECT 'address', 'Метро: Автозаводская' || CHR(10) || 'Ленинская слобода 26' || CHR(10) || 'БЦ Омега 2' || CHR(10) || 'Корпус А', 'Адрес компании'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'address');

INSERT INTO settings (key, value, description) 
SELECT 'email', 'info@besttechno.ru', 'Email компании'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'email');

INSERT INTO settings (key, value, description) 
SELECT 'working_hours', 'Пн-Пт: 10:00 - 21:00' || CHR(10) || 'Сб-Вс: 11:00 - 19:00', 'Режим работы'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'working_hours');

-- Проверка результата
SELECT key, value FROM settings ORDER BY key;


