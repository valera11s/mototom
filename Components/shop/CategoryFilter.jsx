import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "../../Components/ui/button.jsx";
import { Input } from "../../Components/ui/input.jsx";
import { Label } from "../../Components/ui/label.jsx";
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

const conditions = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новое' },
  { value: 'used', label: 'Б/У' },
];

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function CategoryFilter({ 
  selectedCategory, 
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedSubSubcategory,
  setSelectedSubSubcategory,
  selectedCondition,
  setSelectedCondition,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax
}) {
  // Получаем все категории из БД
  // Используем тот же queryKey, что и CategoryMenuBar, для единого кэша
  const { data: allCategoriesData = [] } = useQuery({
    queryKey: ['all-categories-menu'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/categories?all=true`);
      if (!response.ok) throw new Error('Ошибка загрузки категорий');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
    cacheTime: 10 * 60 * 1000, // Храним в кэше 10 минут
  });


  // Формируем список основных категорий (level 0)
  const allCategories = useMemo(() => {
    const mainCategories = allCategoriesData
      .filter(cat => cat.level === 0)
      .map(cat => ({
        value: cat.name,
        label: cat.name
      }));
    return [
      { value: 'all', label: 'Все товары' },
      ...mainCategories
    ];
  }, [allCategoriesData]);

  // Получить доступные подкатегории для выбранных категорий из БД
  const getSubcategories = () => {
    if (!selectedCategory || selectedCategory.length === 0) return [];
    
    const allSubcats = new Set();
    selectedCategory.forEach(catName => {
      if (catName !== 'all') {
        // Находим категорию в БД
        const category = allCategoriesData.find(c => c.name === catName && c.level === 0);
        if (category) {
          // Находим все подкатегории (level 1) для этой категории
          const subcats = allCategoriesData.filter(c => c.parent_id === category.id && c.level === 1);
          subcats.forEach(subcat => allSubcats.add(subcat.name));
        }
      }
    });
    return Array.from(allSubcats);
  };

  // Получить доступные под-подкатегории для выбранных подкатегорий из БД
  const getSubSubcategories = () => {
    if (!selectedCategory || selectedCategory.length === 0 || !selectedSubcategory || selectedSubcategory.length === 0) return [];
    
    const allSubSubcats = new Set();
    selectedSubcategory.forEach(subcatName => {
      // Находим подкатегорию в БД
      const subcategory = allCategoriesData.find(c => c.name === subcatName && c.level === 1);
      if (subcategory) {
        // Находим все под-подкатегории (level 2) для этой подкатегории
        const subSubcats = allCategoriesData.filter(c => c.parent_id === subcategory.id && c.level === 2);
        subSubcats.forEach(subSubcat => allSubSubcats.add(subSubcat.name));
      }
    });
    return Array.from(allSubSubcats);
  };

  // Функция для toggle выбора (добавить/удалить из массива)
  const toggleSelection = (currentArray, value, setter) => {
    if (Array.isArray(currentArray)) {
      if (currentArray.includes(value)) {
        setter(currentArray.filter(item => item !== value));
      } else {
        setter([...currentArray, value]);
      }
    } else {
      // Обратная совместимость: если пришел не массив, создаем новый
      setter([value]);
    }
  };

  const subcategories = getSubcategories();
  const subSubcategories = getSubSubcategories();
  
  // Состояния для разворачивания блоков
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [expandedSubcategories, setExpandedSubcategories] = useState(false);
  const [expandedSubSubcategories, setExpandedSubSubcategories] = useState(false);
  
  // Количество элементов для показа до разворачивания
  const INITIAL_ITEMS_COUNT = 8;
  
  return (
    <div className="space-y-6">
      {/* Состояние */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
          Состояние
        </h3>
        <div className="flex flex-wrap gap-2">
          {conditions.map((cond) => (
            <motion.div key={cond.value} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Button
                variant={selectedCondition === cond.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCondition(cond.value)}
                className={`rounded-full px-4 transition-all whitespace-nowrap ${
                  selectedCondition === cond.value 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                {cond.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Цена */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
          Цена, ₽
        </h3>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="от"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="rounded-xl text-sm"
          />
          <span className="text-slate-400">—</span>
          <Input
            type="number"
            placeholder="до"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Категория */}
      <div>
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
          Категория
        </h3>
        <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
          {allCategories.map((cat) => {
            const isSelected = Array.isArray(selectedCategory) 
              ? selectedCategory.includes(cat.value)
              : selectedCategory === cat.value;
            return (
            <motion.div key={cat.value} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (cat.value === 'all') {
                    setSelectedCategory([]);
                  } else {
                    // Используем название категории из БД
                    toggleSelection(selectedCategory, cat.value, setSelectedCategory);
                  }
                }}
                className={`rounded-full px-4 transition-all whitespace-nowrap ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                {cat.label}
              </Button>
            </motion.div>
            );
          })}
        </div>
      </div>

      {/* Подкатегория - показывается только если выбрана категория */}
      {selectedCategory && selectedCategory.length > 0 && subcategories.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
            Подкатегория
          </h3>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
            {subcategories.map((subcat) => {
              const isSelected = Array.isArray(selectedSubcategory)
                ? selectedSubcategory.includes(subcat)
                : selectedSubcategory === subcat;
              return (
              <motion.div key={subcat} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSelection(selectedSubcategory, subcat, setSelectedSubcategory)}
                  className={`rounded-full px-4 transition-all whitespace-nowrap ${
                    isSelected 
                      ? 'bg-slate-700 text-white shadow-lg' 
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {subcat}
                </Button>
              </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Третий уровень категории - показывается только если выбрана подкатегория */}
      {selectedSubcategory && selectedSubcategory.length > 0 && subSubcategories.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
            {(() => {
              // Определяем название в зависимости от контекста
              const firstSubcat = Array.isArray(selectedSubcategory) ? selectedSubcategory[0] : selectedSubcategory;
              if (firstSubcat === 'Объективы' || firstSubcat?.includes('Объективы')) {
                return 'Серия';
              }
              if (firstSubcat?.includes('фотоаппараты') || firstSubcat?.includes('фотокамеры')) {
                return 'Бренд';
              }
              if (firstSubcat === 'Аксессуары') {
                return 'Тип';
              }
              // По умолчанию
              return 'Вариант';
            })()}
          </h3>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
            {subSubcategories.map((subsubcat) => {
              const isSelected = Array.isArray(selectedSubSubcategory)
                ? selectedSubSubcategory.includes(subsubcat)
                : selectedSubSubcategory === subsubcat;
              return (
              <motion.div key={subsubcat} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSelection(selectedSubSubcategory, subsubcat, setSelectedSubSubcategory)}
                  className={`rounded-full px-4 transition-all whitespace-nowrap ${
                    isSelected 
                      ? 'bg-slate-600 text-white shadow-lg' 
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {subsubcat}
                </Button>
              </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}