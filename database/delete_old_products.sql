-- Скрипт для удаления старых товаров
-- Оставляет только товары из категории "Фотоаппараты"

-- Сначала посмотрим, сколько товаров будет удалено (для информации)
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE c1.name = 'Фотоаппараты') as cameras_count,
  COUNT(*) FILTER (WHERE c1.name != 'Фотоаппараты' OR c1.name IS NULL) as to_delete_count
FROM products p
LEFT JOIN categories c1 ON p.category_id = c1.id;

-- Удаление товаров, которые НЕ относятся к категории "Фотоаппараты"
DELETE FROM products
WHERE category_id IS NULL 
   OR category_id NOT IN (
     SELECT id FROM categories WHERE name = 'Фотоаппараты'
   );

-- Показываем оставшиеся товары
SELECT 
  p.id,
  p.name,
  p.price,
  c1.name as category_name,
  c2.name as subcategory_name
FROM products p
LEFT JOIN categories c1 ON p.category_id = c1.id
LEFT JOIN categories c2 ON p.subcategory_id = c2.id
ORDER BY p.id;





