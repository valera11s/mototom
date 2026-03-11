import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl, formatPrice, createProductUrl } from '../../src/utils.js';
import { Button } from "../../Components/ui/button.jsx";
import { ArrowRight, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Загружаем товары для карусели
  const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['hero-products'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/products`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Фильтруем и рандомизируем товары (особенно акционные)
  const carouselProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    
    // Исключаем товар "Sony A6400"
    const filteredProducts = allProducts.filter(p => 
      !p.name || !p.name.toLowerCase().includes('sony a6400')
    );
    
    // Сначала берем акционные товары (on_sale или со скидкой)
    const saleProducts = filteredProducts.filter(p => 
      p.on_sale || (p.original_price && p.original_price > p.price)
    );
    
    // Перемешиваем их
    const shuffledSale = [...saleProducts].sort(() => Math.random() - 0.5);
    
    // Берем остальные товары и перемешиваем
    const otherProducts = filteredProducts.filter(p => 
      !p.on_sale && (!p.original_price || p.original_price <= p.price)
    ).sort(() => Math.random() - 0.5);
    
    // Объединяем: сначала акционные, потом остальные
    const combined = [...shuffledSale, ...otherProducts].slice(0, 10);
    
    return combined;
  }, [allProducts]);

  // Автоматическая смена слайдов каждые 4 секунды (циклично)
  useEffect(() => {
    if (carouselProducts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % carouselProducts.length;
        if (next === 1) setHasAnimatedOnce(true); // Отмечаем, что была хотя бы одна анимация
        return next;
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, [carouselProducts.length]);

  const goToSlide = (index) => {
    if (index !== 0) setHasAnimatedOnce(true);
    setCurrentSlide(index);
  };

  const goToPrev = () => {
    setHasAnimatedOnce(true);
    setCurrentSlide((prev) => (prev - 1 + carouselProducts.length) % carouselProducts.length);
  };

  const goToNext = () => {
    setHasAnimatedOnce(true);
    setCurrentSlide((prev) => (prev + 1) % carouselProducts.length);
  };
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
        }} />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh] py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 relative z-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-slate-300">Новая коллекция 2025</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Запечатлейте каждый
              <span className="block bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
                момент
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
              Продаем камеры, фотоаппараты, экшен-камеры и различную периферию для начинающих, любителей и профессиональных фотографов. У нас вы найдете все необходимое по лучшей цене.
            </p>
            
            <div className="flex flex-wrap gap-4 relative z-30">
              <Button 
                size="lg" 
                onClick={() => navigate(createPageUrl('Shop'))}
                className="h-14 px-8 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-xl hover:shadow-2xl transition-all relative z-30"
              >
                В каталог
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate(createPageUrl('Contacts'))}
                className="h-14 px-8 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 font-semibold backdrop-blur-sm relative z-30"
              >
                <Phone className="mr-2 h-5 w-5" />
                Контакты
              </Button>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm text-slate-400">Товаров</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <p className="text-3xl font-bold">50 тыс+</p>
                <p className="text-sm text-slate-400">Клиентов</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <p className="text-3xl font-bold">4.9</p>
                <p className="text-sm text-slate-400">Рейтинг</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block z-10"
          >
            {!isLoadingProducts && carouselProducts.length > 0 ? (
              <div className="relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-transparent rounded-3xl blur-3xl pointer-events-none" />
                
                {/* Карусель товаров */}
                <div className="relative w-full max-w-lg mx-auto rounded-3xl overflow-hidden shadow-2xl">
                  {carouselProducts[currentSlide] && (
                    <>
                      {currentSlide === 0 && !hasAnimatedOnce ? (
                        // Первый слайд без анимации - показываем сразу
                        <div style={{ display: 'flex' }}>
                          <Link to={createProductUrl(carouselProducts[currentSlide])} className="w-full">
                            <div className="relative aspect-square bg-transparent p-12">
                              <img
                                src={carouselProducts[currentSlide]?.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+'}
                                alt={carouselProducts[currentSlide]?.name || 'Товар'}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+';
                                }}
                              />
                            </div>
                          </Link>
                        </div>
                      ) : (
                        // Остальные слайды с анимацией
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.5 }}
                            style={{ display: 'flex' }}
                          >
                            <Link to={createProductUrl(carouselProducts[currentSlide])} className="w-full">
                              <div className="relative aspect-square bg-transparent p-12">
                                <img
                                  src={carouselProducts[currentSlide]?.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+'}
                                  alt={carouselProducts[currentSlide]?.name || 'Товар'}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+';
                                  }}
                                />
                              </div>
                            </Link>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </>
                  )}

                  {/* Стрелки навигации */}
                  {carouselProducts.length > 1 && (
                    <>
                      <button
                        onClick={goToPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10"
                        aria-label="Предыдущий слайд"
                      >
                        <ChevronLeft className="w-5 h-5 text-slate-900" />
                      </button>
                      <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10"
                        aria-label="Следующий слайд"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-900" />
                      </button>
                    </>
                  )}

                  {/* Индикаторы слайдов */}
                  {carouselProducts.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {carouselProducts.slice(0, Math.min(5, carouselProducts.length)).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`h-2 rounded-full transition-all ${
                            currentSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/50'
                          }`}
                          aria-label={`Перейти к слайду ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Маленький блок с ценой наложен сверху карусели */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg z-20 min-w-[180px]"
                  >
                    <p className="text-xs text-slate-500 mb-1">
                      {(carouselProducts[currentSlide]?.on_sale || (carouselProducts[currentSlide]?.original_price && carouselProducts[currentSlide]?.original_price > carouselProducts[currentSlide]?.price)) 
                        ? 'Акция' 
                        : 'Хит продаж'}
                    </p>
                    <p className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">
                      {carouselProducts[currentSlide]?.name}
                    </p>
                    <p className="text-sm text-emerald-600 font-semibold">
                      {formatPrice(carouselProducts[currentSlide]?.price || 0)} ₽
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="relative w-full max-w-lg mx-auto rounded-3xl bg-slate-100 aspect-square flex items-center justify-center">
                <p className="text-slate-400">Загрузка товаров...</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}