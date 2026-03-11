-- Создание таблицы настроек сайта
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка контактной информации (используем UTF-8)
INSERT INTO settings (key, value, description) VALUES
('company_name', E'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ АЛЬ-МАМУН МД АБДУЛЛА', 'Название компании'),
('company_inn', '502412753882', 'ИНН компании'),
('phone', '7 (968) 800-86-46', 'Номер телефона'),
('phone_formatted', '79688008646', 'Номер телефона для ссылок tel:'),
('address', E'Метро: Автозаводская\nЛенинская слобода 26\nБЦ Омега 2\nКорпус А', 'Адрес компании'),
('email', 'info@besttechno.ru', 'Email компании'),
('working_hours', E'Пн-Пт: 10:00 - 21:00\nСб-Вс: 11:00 - 19:00', 'Режим работы')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

