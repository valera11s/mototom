-- Получение списка товаров из категории "Фотоаппараты", подкатегория "Компактные фотокамеры"

SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.original_price,
  p.image_url,
  p.images,
  p.brand,
  p.in_stock,
  p.featured,
  p.popular,
  p.on_sale,
  p.condition,
  p.rating,
  p.specs,
  c1.name as category_name,
  c2.name as subcategory_name,
  c3.name as subsubcategory_name
FROM products p
LEFT JOIN categories c1 ON p.category_id = c1.id
LEFT JOIN categories c2 ON p.subcategory_id = c2.id
LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
WHERE c1.name = 'Фотоаппараты'
  AND c2.name = 'Компактные фотокамеры'
ORDER BY p.id;

-- Также покажем количество товаров
SELECT 
  COUNT(*) as total_compact_cameras
FROM products p
LEFT JOIN categories c1 ON p.category_id = c1.id
LEFT JOIN categories c2 ON p.subcategory_id = c2.id
WHERE c1.name = 'Фотоаппараты'
  AND c2.name = 'Компактные фотокамеры';

