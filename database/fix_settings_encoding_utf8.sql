-- Исправление кодировки для таблицы settings с правильным UTF-8
-- Убедитесь, что ваша сессия PostgreSQL использует UTF-8:
-- SET client_encoding = 'UTF8';

-- Вариант 1: Прямая вставка без E'' (рекомендуется)
UPDATE settings 
SET value = 'Метро: Автозаводская' || CHR(10) || 
            'Ленинская слобода 26' || CHR(10) || 
            'БЦ Омега 2' || CHR(10) || 
            'Корпус А',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'address';

UPDATE settings 
SET value = 'Пн-Пт: 10:00 - 21:00' || CHR(10) || 
            'Сб-Вс: 11:00 - 19:00',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'working_hours';

-- Вариант 2: Если нужно полностью пересоздать записи
-- Сначала удалите старые записи и создайте новые:
-- DELETE FROM settings WHERE key IN ('address', 'working_hours');
-- 
-- INSERT INTO settings (key, value, description) VALUES
-- ('address', 'Метро: Автозаводская' || CHR(10) || 'Ленинская слобода 26' || CHR(10) || 'БЦ Омега 2' || CHR(10) || 'Корпус А', 'Адрес компании'),
-- ('working_hours', 'Пн-Пт: 10:00 - 21:00' || CHR(10) || 'Сб-Вс: 11:00 - 19:00', 'Режим работы');

-- Проверка результата
SELECT key, value, LENGTH(value) as length 
FROM settings 
WHERE key IN ('address', 'working_hours');


