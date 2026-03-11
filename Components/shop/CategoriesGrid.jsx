import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../src/utils.js';
import { Button } from "../../Components/ui/button.jsx";
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Маппинг названий категорий к изображениям (для конкретных категорий)
// Используем SVG placeholder вместо внешних URL для надежности
const defaultPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+';

const categoryImages = {
  'Leica': defaultPlaceholder,
  'Фотоаппараты': defaultPlaceholder,
  'Объективы': defaultPlaceholder,
  'Видеокамеры': defaultPlaceholder,
  'Вспышки': defaultPlaceholder,
  'Штативы': defaultPlaceholder,
  'Аксессуары': defaultPlaceholder,
  'Карты памяти': defaultPlaceholder,
  'Бинокли': defaultPlaceholder,
};

// Функция для получения изображения категории из первого товара
const getCategoryImage = (categoryId, categoryName, categoryProductsMap) => {
  // Если есть товары в категории, берем изображение первого товара
  const categoryProducts = categoryProductsMap[categoryId];
  if (categoryProducts && categoryProducts.length > 0) {
    const firstProduct = categoryProducts[0];
    if (firstProduct.image_url) {
      return firstProduct.image_url;
    }
  }
  
  // Если есть изображение в маппинге, используем его
  if (categoryImages[categoryName]) {
    return categoryImages[categoryName];
  }
  
  // Возвращаем placeholder по умолчанию
  return defaultPlaceholder;
};

export default function CategoriesGrid() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['global-categories'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/categories?parent_id=null`);
      if (!response.ok) throw new Error('Ошибка загрузки категорий');
      const data = await response.json();
      return data;
    },
    // Обновляем данные каждые 5 минут, чтобы видеть изменения при удалении категорий
    refetchInterval: 300000,
    // Также обновляем при возвращении фокуса на окно
    refetchOnWindowFocus: true,
  });

  // Порядок категорий для отображения на главной
  const categoryOrder = [
    'Фотоаппараты',
    'Объективы',
    'Видеокамеры',
    'Вспышки',
    'Штативы',
    'Аксессуары',
    'Карты памяти',
    'Бинокли',
  ];

  // Сортируем категории по приоритетному списку
  const sortedCategories = [...categories].sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.name);
    const indexB = categoryOrder.indexOf(b.name);
    
    // Если обе категории в списке, сортируем по порядку в списке
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // Если только A в списке, A идет первым
    if (indexA !== -1) return -1;
    // Если только B в списке, B идет первым
    if (indexB !== -1) return 1;
    // Если обе не в списке, сортируем по алфавиту
    return (a.name || '').localeCompare(b.name || '');
  });

  // Берем первые 5 категорий после сортировки
  const displayCategories = sortedCategories.slice(0, 5);

  // Загружаем первый товар для каждой категории
  const { data: categoryProductsMap = {} } = useQuery({
    queryKey: ['category-products-for-images', displayCategories.map(c => c.id)],
    queryFn: async () => {
      const map = {};
      await Promise.all(
        displayCategories.map(async (category) => {
          try {
            const response = await fetch(`${apiUrl}/api/products?category=${category.id}&limit=1`);
            if (response.ok) {
              const products = await response.json();
              map[category.id] = products;
            }
          } catch (error) {
            console.error(`Ошибка загрузки товаров для категории ${category.id}:`, error);
          }
        })
      );
      return map;
    },
    enabled: displayCategories.length > 0,
  });

  if (isLoading) {
    return (
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <p className="text-slate-500">Загрузка категорий...</p>
          </div>
        </div>
      </section>
    );
  }

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Категории
          </h2>
          <p className="text-slate-500 max-w-lg">
            Выберите интересующую категорию для просмотра товаров
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-6">
          {displayCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                to={createPageUrl('Shop') + `?category=${category.id}`}
                className="flex flex-col items-center group"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 mb-3 group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <img
                    src={getCategoryImage(category.id, category.name, categoryProductsMap)}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = defaultPlaceholder;
                    }}
                  />
                </div>
                <p className="text-sm sm:text-base font-medium text-slate-900 text-center group-hover:text-slate-600 transition-colors">
                  {category.name}
                </p>
              </Link>
            </motion.div>
          ))}
          
          {/* Кнопка "Остальные категории" */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link 
              to={createPageUrl('Shop')}
              className="flex flex-col items-center justify-center group"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden bg-slate-200 mb-3 group-hover:bg-slate-300 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 flex items-center justify-center">
                <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 group-hover:text-slate-900 transition-colors" />
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-900 text-center group-hover:text-slate-600 transition-colors">
                Остальные категории
              </p>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

