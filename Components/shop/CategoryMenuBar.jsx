import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { createPageUrl } from '../../src/utils.js';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function CategoryMenuBar() {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, width: 0 });
  const categoryRefs = useRef({});
  const dropdownRef = useRef(null);
  const menuContainerRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Количество категорий для отображения (остальные в "Еще")
  const MAX_VISIBLE_CATEGORIES = 5;
  
  // Скрываем меню на странице каталога
  const isShopPage = location.pathname.includes('/shop') || location.pathname.includes(createPageUrl('Shop'));

  // Загружаем все категории одним запросом (оптимизация)
  const { data: allCategoriesData = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['all-categories-menu'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/categories?all=true`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
    cacheTime: 10 * 60 * 1000, // Храним в кэше 10 минут
  });

  // Фильтруем основные категории (level 0) из всех категорий
  // Используем стабильную ссылку на массив, чтобы избежать лишних пересчетов
  const mainCategories = React.useMemo(() => {
    if (!allCategoriesData || allCategoriesData.length === 0) return [];
    return allCategoriesData.filter(cat => cat.level === 0);
  }, [allCategoriesData]);

  // Фильтруем категории по порядку: Видеокамеры, Фотоаппараты, Объективы, Экшен-камеры, Ноутбуки
  // ВАЖНО: используем useMemo и создаем новый массив, а не мутируем исходный
  const orderedCategories = React.useMemo(() => {
    if (!mainCategories || mainCategories.length === 0) return [];
    const order = ['Видеокамеры', 'Фотоаппараты', 'Объективы', 'Экшен-камеры', 'Ноутбуки'];
    // Создаем копию массива перед сортировкой
    const sorted = [...mainCategories].sort((a, b) => {
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [mainCategories]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  // Если данные еще загружаются или страница каталога - не показываем меню
  if (isLoadingCategories || isShopPage || orderedCategories.length === 0) {
    return null;
  }

  // Разделяем категории на видимые и скрытые (для "Еще")
  const visibleCategories = orderedCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hiddenCategories = orderedCategories.slice(MAX_VISIBLE_CATEGORIES);

  const getSubcategories = (categoryId) => {
    return allCategoriesData.filter(cat => cat.parent_id === categoryId);
  };

  const handleCategoryMouseLeave = (e) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    const relatedTarget = e.relatedTarget;
    if (relatedTarget && dropdownRef.current?.contains(relatedTarget)) {
      return;
    }

    leaveTimeoutRef.current = setTimeout(() => {
      if (!dropdownRef.current?.matches(':hover')) {
        setHoveredCategory(null);
      }
    }, 150);
  };

  const handleDropdownMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`${createPageUrl('Shop')}?category=${categoryName}`);
  };

  const handleSubcategoryClick = (e, subcategoryName, categoryName) => {
    e.preventDefault();
    const url = `${createPageUrl('Shop')}?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`;
    navigate(url);
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-[76.8px] z-30 relative">
      <div ref={menuContainerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Мобильная версия - одна кнопка "Каталог товаров" */}
        <div className="md:hidden">
          <Link
            to={createPageUrl('Shop')}
            className="block w-full px-4 py-4 text-base font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors text-center"
          >
            Каталог товаров
          </Link>
        </div>

        {/* Десктопная версия */}
        <nav className="hidden md:flex items-center w-full">
          {visibleCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const hasSubcategories = subcategories.length > 0;

            return (
              <div
                key={category.id}
                ref={(el) => (categoryRefs.current[category.id] = el)}
                className="relative flex-1"
                onMouseEnter={(e) => {
                  // Отменяем таймаут закрытия, если он был
                  if (leaveTimeoutRef.current) {
                    clearTimeout(leaveTimeoutRef.current);
                    leaveTimeoutRef.current = null;
                  }
                  setHoveredCategory(category.id);
                }}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <Link
                  to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center justify-center gap-2 px-4 py-4 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap relative w-full"
                  onClick={(e) => {
                    // При клике на категорию всегда переходим
                    handleCategoryClick(category.name);
                  }}
                >
                  {category.name}
                  {hasSubcategories && (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </Link>
              </div>
            );
          })}
          
          {/* Блок "Еще" для остальных категорий */}
          {hiddenCategories.length > 0 && (
            <div
              ref={(el) => (categoryRefs.current['more'] = el)}
              className="relative flex-1"
              onMouseEnter={(e) => {
                // Отменяем таймаут закрытия, если он был
                if (leaveTimeoutRef.current) {
                  clearTimeout(leaveTimeoutRef.current);
                  leaveTimeoutRef.current = null;
                }
                setHoveredCategory('more');
              }}
              onMouseLeave={handleCategoryMouseLeave}
            >
              <Link
                to={createPageUrl('Shop')}
                className="flex items-center justify-center gap-2 px-4 py-4 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap relative w-full"
                onClick={(e) => {
                  navigate(createPageUrl('Shop'));
                }}
              >
                Еще
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </Link>
            </div>
          )}
        </nav>

        {/* Выпадающее меню с подкатегориями (общее для всех категорий) */}
        <AnimatePresence>
          {hoveredCategory && hoveredCategory !== 'more' && (() => {
            const category = visibleCategories.find(c => c.id === hoveredCategory);
            if (!category) return null;
            const subcategories = getSubcategories(category.id);
            if (subcategories.length === 0) return null;
            
            return (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-[100]"
                onMouseEnter={() => {
                  // Отменяем таймаут закрытия
                  if (leaveTimeoutRef.current) {
                    clearTimeout(leaveTimeoutRef.current);
                    leaveTimeoutRef.current = null;
                  }
                  // Не устанавливаем hoveredCategory, если он уже установлен - избегаем лишних обновлений
                  if (hoveredCategory !== category.id) {
                    setHoveredCategory(category.id);
                  }
                }}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <div className="grid grid-cols-3 gap-4">
                  {subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.id}
                      to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subcategory.name)}`}
                      className="block px-4 py-3 text-base font-bold text-slate-900 hover:bg-slate-50 transition-colors rounded-lg"
                      onClick={(e) => handleSubcategoryClick(e, subcategory.name, category.name)}
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Выпадающее меню "Еще" */}
        <AnimatePresence>
          {hoveredCategory === 'more' && hiddenCategories.length > 0 && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50"
              onMouseEnter={() => {
                // Отменяем таймаут закрытия
                if (leaveTimeoutRef.current) {
                  clearTimeout(leaveTimeoutRef.current);
                  leaveTimeoutRef.current = null;
                }
                // Не устанавливаем hoveredCategory, если он уже установлен - избегаем лишних обновлений
                if (hoveredCategory !== 'more') {
                  setHoveredCategory('more');
                }
              }}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <div className="grid grid-cols-3 gap-4">
                {hiddenCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}`}
                    className="block px-4 py-3 text-base text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors rounded-lg"
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

