-- Скрипт для добавления всех основных брендов в таблицу brands
-- Бренды из хардкода на фронте

-- Добавляем все бренды, которых еще нет
INSERT INTO brands (name)
SELECT brand_name
FROM unnest(ARRAY[
  'Sony',
  'Canon',
  'Nikon',
  'Fujifilm',
  'Panasonic',
  'Leica',
  'Olympus',
  'Sigma',
  'Tamron',
  'Hasselblad',
  'Zenit',
  'Samyang',
  'Tokina',
  'Pentax',
  'Voigtlaender',
  'Yongnuo',
  'GoPro',
  'Blackmagic',
  'JVC',
  'Carl Zeiss',
  'ZEISS Batis',
  'Ricoh'
]) AS brand_name
WHERE NOT EXISTS (
  SELECT 1 FROM brands WHERE brands.name = brand_name
);

-- Показываем все бренды
SELECT * FROM brands ORDER BY name;

