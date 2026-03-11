-- Исправление кодировки в таблице settings
-- Этот скрипт обновляет адрес и режим работы с правильными переносами строк

-- Проверка текущих данных (можно выполнить для просмотра)
-- SELECT key, value FROM settings ORDER BY key;

-- Вариант 1: Обновление через E'' (Escape string)
UPDATE settings 
SET value = E'Метро: Автозаводская\nЛенинская слобода 26\nБЦ Омега 2\nКорпус А',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'address';

UPDATE settings 
SET value = E'Пн-Пт: 10:00 - 21:00\nСб-Вс: 11:00 - 19:00',
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'working_hours';

-- Вариант 2: Обновление через CHR(10) для переноса строки (если E'' не работает)
-- UPDATE settings 
-- SET value = 'Метро: Автозаводская' || CHR(10) || 'Ленинская слобода 26' || CHR(10) || 'БЦ Омега 2' || CHR(10) || 'Корпус А',
--     updated_at = CURRENT_TIMESTAMP
-- WHERE key = 'address';
--
-- UPDATE settings 
-- SET value = 'Пн-Пт: 10:00 - 21:00' || CHR(10) || 'Сб-Вс: 11:00 - 19:00',
--     updated_at = CURRENT_TIMESTAMP
-- WHERE key = 'working_hours';

-- Проверка результата
SELECT key, value, LENGTH(value) as length FROM settings WHERE key IN ('address', 'working_hours');


