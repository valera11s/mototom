-- Fix for API compatibility with current server routes:
-- server/routes/brands.js expects brands.sort_order (+ popular)
-- server/routes/categories.js expects categories.level (+ product_name_prefix)

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON brands(sort_order);

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_name_prefix VARCHAR(255);

-- Rebuild level from parent hierarchy (0 = root, 1 = child, 2 = grandchild...)
WITH RECURSIVE tree AS (
  SELECT id, parent_id, 0 AS depth
  FROM categories
  WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.parent_id, t.depth + 1
  FROM categories c
  JOIN tree t ON c.parent_id = t.id
)
UPDATE categories c
SET level = t.depth
FROM tree t
WHERE c.id = t.id;
