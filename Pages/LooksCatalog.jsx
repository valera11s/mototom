import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { createPageUrl, formatPrice } from '../src/utils.js';
import { useMotoStore } from '../src/data/motoStore.jsx';
import Seo from '../src/components/Seo.jsx';

const FILTERS = ['Все образы', 'Город', 'Спорт', 'Классика', 'Туризм', 'Новинки'];

function inferCategory(name, explicitCategory) {
  const normalizedExplicit = String(explicitCategory || '').trim();
  if (normalizedExplicit) return normalizedExplicit;
  const normalized = (name || '').toLowerCase();
  if (normalized.includes('urban') || normalized.includes('city') || normalized.includes('dark')) return 'Город';
  if (normalized.includes('track') || normalized.includes('sport')) return 'Спорт';
  if (normalized.includes('road') || normalized.includes('classic')) return 'Классика';
  if (normalized.includes('tour')) return 'Туризм';
  return 'Город';
}

function normalizeCategories(item) {
  const fromArray = Array.isArray(item?.categories) && item.categories.length > 0
    ? item.categories
    : Array.isArray(item?.look_categories) && item.look_categories.length > 0
      ? item.look_categories
      : [item?.category || item?.look_category || ''];
  const cleaned = [...new Set(fromArray.map((x) => String(x || '').trim()).filter(Boolean))];
  if (cleaned.length > 0) return cleaned;
  return [inferCategory(item?.name, item?.category || item?.look_category)];
}

export default function LooksCatalog() {
  const { sets, products } = useMotoStore();
  const [activeFilter, setActiveFilter] = useState('Все образы');

  const looks = useMemo(() => {
    return (sets || []).map((setItem) => {
      const setProducts = (setItem.productIds || [])
        .map((id) => products.find((product) => product.id === id))
        .filter(Boolean);
      const minPrice = setProducts.length > 0 ? Math.min(...setProducts.map((item) => item.price || 0)) : 0;
      const categories = normalizeCategories(setItem);
      return {
        category: categories[0] || inferCategory(setItem.name, setItem.category || setItem.look_category),
        categories,
        name: setItem.name,
        description: setItem.description || 'Готовый комплект экипировки.',
        price: minPrice > 0 ? `от ${formatPrice(minPrice)} ₽` : 'по запросу',
        count: `${setProducts.length} товара`,
        image: setItem.coverImage || setProducts[0]?.image || 'https://images.unsplash.com/photo-1569931327952-8cbcd1734ca8?auto=format&fit=crop&w=1200&q=80',
        href: `${createPageUrl('ReadySet')}/${setItem.slug}`,
      };
    });
  }, [sets, products]);

  const filteredLooks = useMemo(() => {
    if (activeFilter === 'Все образы') return looks;
    if (activeFilter === 'Новинки') return looks.slice(0, 4);
    return looks.filter((item) => (item.categories || []).includes(activeFilter) || item.category === activeFilter);
  }, [activeFilter, looks]);

  return (
    <div className="bg-[#0D0D0F] text-[#FAFAF9]">
      <Seo
        title="Каталог готовых образов"
        description="Готовые комплекты мотоэкипировки в MOTOTOM: подборки по стилю и сценарию поездок."
      />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 text-[13px] text-[#6B6B70] md:px-12">
        Главная / <span className="font-medium text-[#54A0C5]">Образы</span>
      </div>

      <section
        className="px-4 py-10 sm:px-8 md:py-14 lg:px-20"
        style={{
          backgroundImage:
            'radial-gradient(80% 100% at 50% 60%, rgba(84, 160, 197, 0.10) 0%, rgba(84, 160, 197, 0) 100%)',
        }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded border border-[#54A0C560] bg-[#54A0C520] px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-[#54A0C5]">
              ПОДБОРКА ОТ ЭКСПЕРТОВ
            </div>
            <h1 className="text-[32px] font-bold tracking-[-1px] text-[#FAFAF9] sm:text-[40px] md:text-[48px]">Каталог образов</h1>
            <p className="w-full max-w-[560px] text-base leading-[1.5] text-[#A0A0A5]">
              Подобранные комплекты экипировки от профессионалов. Стиль, защита и комфорт в одном наборе.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveFilter(item)}
                className={`rounded-full px-6 py-2.5 text-[13px] ${
                  activeFilter === item ? 'bg-[#54A0C5] text-[#FAFAF9]' : 'border border-[#2A2A2E] text-[#A0A0A5]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-[#1E1E22]" />

      <section className="px-4 py-10 sm:px-8 md:py-12 lg:px-20">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-[#FAFAF9]">{filteredLooks.length} образов</p>
            <button type="button" className="flex items-center gap-2 text-[13px] text-[#A0A0A5]">
              Сортировка: Популярные
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {filteredLooks.map((look) => (
              <Link key={look.name} to={look.href} className="group block h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-lg border border-[#1E1E22] bg-[#16161A] transition-colors group-hover:border-[#54A0C5]">
                  <img src={look.image} alt={look.name} className="h-[280px] w-full object-cover" />
                  <div className="flex flex-1 flex-col gap-2.5 p-4">
                    <span className="w-fit rounded bg-[#54A0C515] px-2 py-1 text-[11px] font-semibold uppercase tracking-[1px] text-[#54A0C5]">{look.category}</span>
                    <h3 className="text-lg font-bold text-[#FAFAF9]">{look.name}</h3>
                    <p className="h-[58px] overflow-hidden text-[13px] leading-[1.5] text-[#6B6B70]">{look.description}</p>
                    <div className="mt-auto flex items-center justify-between border-t border-[#1E1E22] pt-2.5">
                      <span className="text-sm font-semibold text-[#54A0C5]">{look.price}</span>
                      <span className="text-xs text-[#4A4A50]">{look.count}</span>
                    </div>
                    <div className="mt-0.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#1E1E22] text-[13px] font-medium text-[#FAFAF9]">
                      Смотреть образ
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#1E1E22] bg-[#111114] px-4 py-10 sm:px-8 md:py-14 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-5 text-center">
          <h2 className="text-2xl font-bold text-[#FAFAF9]">Не нашли свой стиль?</h2>
          <p className="max-w-[720px] text-sm leading-[1.5] text-[#A0A0A5]">
            Соберите собственный образ из нашего каталога или свяжитесь с консультантом.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={createPageUrl('Shop')}
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#54A0C5] px-8 text-sm font-medium text-[#FAFAF9]"
            >
              Собрать свой образ
            </Link>
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-md border border-[#2A2A2E] px-8 text-sm font-medium text-[#A0A0A5]"
            >
              Связаться с консультантом
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
