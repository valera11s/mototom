-- System tables/columns for MOTOTOM CRM

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  message TEXT NOT NULL,
  message_type VARCHAR(32) DEFAULT 'feedback',
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) UNIQUE NOT NULL,
  reason TEXT,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blocked_by VARCHAR(255),
  request_count BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_ip VARCHAR(45);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(32) DEFAULT 'feedback';
ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS request_count BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);
CREATE INDEX IF NOT EXISTS idx_orders_client_ip ON orders(client_ip);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address);

INSERT INTO settings (key, value, description) VALUES
  ('site_name', 'MOTOTOM', 'Название сайта'),
  ('phone', '+7 (495) 129-90-77', 'Телефон на сайте'),
  ('phone_link', '+74951299077', 'Телефон для tel: ссылки'),
  ('address', 'Москва, ул. Дубининская, д. 22', 'Адрес магазина'),
  ('email', 'sales@mototom.ru', 'Email магазина'),
  ('working_hours', 'Пн-Пт: 10:00 - 20:00', 'Режим работы')
ON CONFLICT (key) DO NOTHING;
