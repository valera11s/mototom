export async function ensureOperationalSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
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
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id SERIAL PRIMARY KEY,
      ip_address VARCHAR(45) UNIQUE NOT NULL,
      reason TEXT,
      blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      blocked_by VARCHAR(255),
      request_count BIGINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
  `);
  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS client_ip VARCHAR(45);
  `);

  await pool.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS message_type VARCHAR(32) DEFAULT 'feedback';
  `);
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 0;
  `);
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS reserved_qty INTEGER DEFAULT 0;
  `);
  await pool.query(`
    UPDATE products
    SET stock_qty = CASE
      WHEN condition = 'used' THEN 1
      WHEN in_stock = true AND COALESCE(stock_qty, 0) <= 0 THEN 1
      WHEN in_stock = false THEN 0
      ELSE COALESCE(stock_qty, 0)
    END
    WHERE stock_qty IS NULL OR stock_qty < 0;
  `);
  await pool.query(`
    UPDATE products
    SET in_stock = CASE WHEN COALESCE(stock_qty, 0) > 0 THEN true ELSE false END
    WHERE in_stock IS DISTINCT FROM (COALESCE(stock_qty, 0) > 0);
  `);
  await pool.query(`
    UPDATE products
    SET stock_qty = 1, in_stock = true
    WHERE condition = 'used' AND COALESCE(stock_qty, 0) <> 1;
  `);
  await pool.query(`
    ALTER TABLE blocked_ips
      ADD COLUMN IF NOT EXISTS request_count BIGINT DEFAULT 0;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_archived ON orders(archived);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_client_ip ON orders(client_ip);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_products_stock_qty ON products(stock_qty);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address);
  `);
}
