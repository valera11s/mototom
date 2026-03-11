import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Star, Search, SearchX, ShoppingBag } from 'lucide-react';
import { useMotoStore } from '../src/data/motoStore.jsx';
import { createProductUrl, formatPrice } from '../src/utils.js';
import Seo from '../src/components/Seo.jsx';

const GLOBAL_CATEGORIES = [
  {
    key: 'helmets',
    label: 'Шлемы',
    sourceCategories: ['Шлемы'],
    subtypeTitle: 'Тип шлема',
    subtypes: ['Интегралы', 'Модуляры', 'Открытые', 'Кроссовые'],
  },
  {
    key: 'shirts',
    label: 'Моторубашки',
    sourceCategories: ['Куртки'],
    subtypeTitle: 'Тип экипировки',
    subtypes: ['Моторубашки', 'Текстильные', 'Кожаные'],
  },
  {
    key: 'gloves',
    label: 'Перчатки',
    sourceCategories: ['Перчатки'],
    subtypeTitle: 'Тип перчаток',
    subtypes: ['Городские', 'Спортивные', 'Туринговые'],
  },
  {
    key: 'boots',
    label: 'Ботинки',
    sourceCategories: ['Ботинки'],
    subtypeTitle: 'Тип ботинок',
    subtypes: ['Городские', 'Туринговые', 'Спортивные'],
  },
  {
    key: 'protection',
    label: 'Защита',
    sourceCategories: ['Защита'],
    subtypeTitle: 'Тип защиты',
    subtypes: ['Спина', 'Грудь', 'Локти/Колени'],
  },
  {
    key: 'accessories',
    label: 'Аксессуары',
    sourceCategories: ['Аксессуары'],
    subtypeTitle: 'Тип аксессуаров',
    subtypes: ['Интеркомы', 'Визоры', 'Сумки'],
  },
];

const TYPE_BY_BRAND = {
  helmets: {
    Shoei: 'Интегралы',
    AGV: 'Интегралы',
    Arai: 'Интегралы',
    HJC: 'Модуляры',
    Shark: 'Кроссовые',
    Schuberth: 'Модуляры',
  },
  shirts: {
    "REV'IT!": 'Моторубашки',
    Alpinestars: 'Кожаные',
  },
  gloves: {
    Alpinestars: 'Спортивные',
  },
  boots: {
    TCX: 'Городские',
  },
  protection: {
    D3O: 'Спина',
  },
  accessories: {
    Cardo: 'Интеркомы',
  },
};

const perPage = 6;
const RU_SIZE_TO_INT_SIZE = {
  '42': 'XS',
  '44': 'S',
  '46': 'S',
  '48': 'M',
  '50': 'L',
  '52': 'XL',
  '54': '2XL',
  '56': '3XL',
  '58': '4XL',
  '60': '5XL',
  '62': '6XL',
  '64': '7XL',
  '66': '8XL',
};
const RU_SIZE_ORDER = Object.keys(RU_SIZE_TO_INT_SIZE);

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function resolveCategoryKey(paramCategory) {
  if (!paramCategory) return 'helmets';
  const normalized = paramCategory.toLowerCase();
  const found = GLOBAL_CATEGORIES.find((entry) =>
    entry.label.toLowerCase() === normalized ||
    entry.sourceCategories.some((source) => source.toLowerCase() === normalized)
  );
  return found?.key || 'helmets';
}

function inferSubtype(product, config, index) {
  const mapped = TYPE_BY_BRAND[config.key]?.[product.brand];
  if (mapped) return mapped;
  if (config.subtypes.length === 0) return 'Базовый';
  return config.subtypes[index % config.subtypes.length];
}

function stripVariantId(id) {
  return String(id || '').replace(/_v\d+$/, '');
}

export default function Shop() {
  const navigate = useNavigate();
  const { products, addToCart } = useMotoStore();
  const [params] = useSearchParams();

  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState(() => [resolveCategoryKey(params.get('category'))]);
  const [sort, setSort] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubtypes, setSelectedSubtypes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedRuSizes, setSelectedRuSizes] = useState([]);
  const [minPrice, setMinPrice] = useState(5000);
  const [maxPrice, setMaxPrice] = useState(80000);
  const [page, setPage] = useState(1);
  const [showAllFilters, setShowAllFilters] = useState(false);

  useEffect(() => {
    setSelectedCategoryKeys([resolveCategoryKey(params.get('category'))]);
  }, [params]);

  const selectedCategories = useMemo(() => {
    const list = GLOBAL_CATEGORIES.filter((item) => selectedCategoryKeys.includes(item.key));
    return list.length > 0 ? list : [GLOBAL_CATEGORIES[0]];
  }, [selectedCategoryKeys]);
  const primaryCategory = selectedCategories[0];

  const source = useMemo(() => {
    const categoryNames = unique(selectedCategories.flatMap((entry) => entry.sourceCategories));
    const base = products.filter((item) => categoryNames.includes(item.category));
    if (base.length >= 18) return base;

    const extra = [...base];
    let i = 0;
    while (extra.length < 24 && base.length > 0) {
      const origin = base[i % base.length];
      extra.push({
        ...origin,
        id: `${origin.id}_v${i + 1}`,
        name: `${origin.name}${i % 2 ? ' Edition' : ''}`,
        price: origin.price + ((i % 4) + 1) * 900,
      });
      i += 1;
    }
    return extra;
  }, [products, selectedCategories]);

  const full = useMemo(
    () => source.map((item, idx) => ({
      ...item,
      subtype: inferSubtype(item, primaryCategory, idx),
      rating: item.rating || 4.8,
      reviews: 25 + ((idx + 3) * 11) % 120,
    })),
    [source, primaryCategory]
  );

  const availableSubtypes = useMemo(
    () => unique([...selectedCategories.flatMap((item) => item.subtypes), ...full.map((item) => item.subtype)]),
    [selectedCategories, full]
  );
  const availableBrands = useMemo(() => unique(full.map((item) => item.brand)), [full]);
  const availableSizes = useMemo(() => unique(full.flatMap((item) => item.sizes || [])).slice(0, 12), [full]);
  const availableRuSizes = useMemo(
    () => RU_SIZE_ORDER.filter((ru) => availableSizes.includes(RU_SIZE_TO_INT_SIZE[ru])),
    [availableSizes]
  );
  const effectiveIntlSizes = useMemo(
    () => unique([...selectedSizes, ...selectedRuSizes.map((ru) => RU_SIZE_TO_INT_SIZE[ru]).filter(Boolean)]),
    [selectedSizes, selectedRuSizes]
  );

  useEffect(() => {
    const prices = full.map((item) => item.price);
    const min = Math.min(...prices, 5000);
    const max = Math.max(...prices, 80000);
    setMinPrice(min);
    setMaxPrice(max);
    setSelectedSubtypes([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedRuSizes([]);
    setPage(1);
  }, [selectedCategoryKeys.join('|'), full.length]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return full
      .filter((item) => selectedSubtypes.length === 0 || selectedSubtypes.includes(item.subtype))
      .filter((item) => selectedBrands.length === 0 || selectedBrands.includes(item.brand))
      .filter((item) => effectiveIntlSizes.length === 0 || effectiveIntlSizes.some((size) => item.sizes?.includes(size)))
      .filter((item) => item.price >= minPrice && item.price <= maxPrice)
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        if (sort === 'new') return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      });
  }, [full, selectedSubtypes, selectedBrands, effectiveIntlSizes, minPrice, maxPrice, searchQuery, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, pages);
  const items = filtered.slice((current - 1) * perPage, current * perPage);

  const toggle = (value, arr, setter) => {
    setter(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
    setPage(1);
  };

  const reset = () => {
    setSearchQuery('');
    setSelectedSubtypes([]);
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedRuSizes([]);
    const prices = full.map((item) => item.price);
    setMinPrice(Math.min(...prices, 5000));
    setMaxPrice(Math.max(...prices, 80000));
    setSort('popular');
    setPage(1);
  };

  const getCanonicalProductUrl = (item) => {
    const baseId = stripVariantId(item.id);
    const baseProduct = products.find((p) => String(p.id) === String(baseId));
    return createProductUrl({
      id: baseId,
      slug: baseProduct?.slug || item.slug,
      name: baseProduct?.name || item.name,
    });
  };

  const Check = ({ checked }) => (
    <span className={`inline-block h-[16px] w-[16px] rounded border ${checked ? 'border-[#54A0C5] bg-[#54A0C5]' : 'border-[#3A3A3E] bg-transparent'}`}>
      {checked && <span className="block text-center text-[11px] leading-[14px] text-white">✓</span>}
    </span>
  );

  const shopStructuredData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mototom.ru';
    const categoryLabel = selectedCategories.map((item) => item.label).join(', ');
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Каталог: ${categoryLabel}`,
      description: `Каталог мотоэкипировки MOTOTOM в категориях «${categoryLabel}».`,
      url: typeof window !== 'undefined' ? window.location.href : `${origin}/shop`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: filtered.slice(0, 24).map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          url: `${origin}${getCanonicalProductUrl(item)}`,
        })),
      },
    };
  }, [selectedCategories, filtered, products]);

  return (
    <div className="mx-auto w-full max-w-[1440px] pb-12 text-slate-100">
      <Seo
        title={`${selectedCategories.map((item) => item.label).join(', ')} — каталог мотоэкипировки`}
        description={`Купить экипировку в категориях ${selectedCategories.map((item) => item.label.toLowerCase()).join(', ')} в MOTOTOM. ${filtered.length} товаров с ценами, фильтрами и быстрой доставкой.`}
        structuredData={shopStructuredData}
      />
      <div className="px-4 py-4 text-[13px] font-normal text-[#6B6B70] md:px-12">
        Главная / <span className="text-[#FAFAF9]">Каталог</span>
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 pb-6 md:px-12 lg:grid-cols-[260px_1fr] lg:gap-8">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#FAFAF9]">Каталог</h1>
          <span className="text-sm font-normal text-[#6B6B70]">{filtered.length} товара</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-9 w-full max-w-[320px] items-center gap-2 rounded-lg border border-[#2A2A2E] bg-[#16161A] px-3">
            <Search className="h-4 w-4 text-[#6B6B70]" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Поиск по названию..."
              className="w-full bg-transparent text-[13px] font-normal text-[#FAFAF9] outline-none placeholder:text-[#4A4A50]"
            />
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-[13px] font-normal text-[#A0A0A5]">Сортировка:</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-md border border-[#2A2A2E] bg-[#16161A] px-3.5 py-2 pr-8 text-[13px] text-[#FAFAF9]"
              >
                <option value="popular">По популярности</option>
                <option value="new">Сначала новинки</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#6B6B70]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 md:px-12 lg:grid-cols-[260px_1fr] lg:gap-8">
        <aside className="space-y-7">
          <div className="space-y-3.5">
            <p className="text-sm font-semibold text-[#FAFAF9]">Категория</p>
            <div className="grid grid-cols-2 gap-3">
              {GLOBAL_CATEGORIES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryKeys((prev) => {
                      if (prev.includes(item.key)) {
                        return prev.length > 1 ? prev.filter((key) => key !== item.key) : prev;
                      }
                      return [...prev, item.key];
                    });
                  }}
                  className={`min-h-[40px] rounded-md border px-2 py-1 text-xs font-medium ${selectedCategoryKeys.includes(item.key) ? 'border-[#54A0C5] bg-[#54A0C5] text-[#FAFAF9]' : 'border-[#2A2A2E] text-[#A0A0A5]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAllFilters((prev) => !prev)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#2A2A2E] text-[13px] font-medium text-[#A0A0A5] hover:text-[#FAFAF9] lg:hidden"
          >
            <span>{showAllFilters ? 'Скрыть фильтры' : 'Развернуть все фильтры'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAllFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className={`${showAllFilters ? 'block' : 'hidden'} space-y-6 lg:block`}>
            <>
              <div className="h-px bg-[#1E1E22]" />

              <div className="space-y-3.5">
                <p className="text-sm font-semibold text-[#FAFAF9]">Тип экипировки</p>
                {availableSubtypes.map((type) => (
                  <button key={type} type="button" onClick={() => toggle(type, selectedSubtypes, setSelectedSubtypes)} className="flex items-center gap-2.5 text-left text-[13px] text-[#A0A0A5]">
                    <Check checked={selectedSubtypes.includes(type)} />
                    <span>{type}</span>
                  </button>
                ))}
              </div>

              <div className="h-px bg-[#1E1E22]" />

              <div className="space-y-3.5">
                <p className="text-sm font-semibold text-[#FAFAF9]">Бренд</p>
                {availableBrands.map((brand) => (
                  <button key={brand} type="button" onClick={() => toggle(brand, selectedBrands, setSelectedBrands)} className="flex items-center gap-2.5 text-left text-[13px] text-[#A0A0A5]">
                    <Check checked={selectedBrands.includes(brand)} />
                    <span>{brand}</span>
                  </button>
                ))}
              </div>

              <div className="h-px bg-[#1E1E22]" />

              <div className="space-y-3.5">
                <p className="text-sm font-semibold text-[#FAFAF9]">Цена, ₽</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value) || minPrice)}
                    className="w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-2.5 py-2 text-xs text-[#FAFAF9]"
                  />
                  <span className="text-[#6B6B70]">—</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value) || maxPrice)}
                    className="w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-2.5 py-2 text-xs text-[#FAFAF9]"
                  />
                </div>
                <input className="price-range w-full" type="range" min={0} max={120000} value={Math.min(minPrice, 120000)} onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 100))} />
                <input className="price-range w-full" type="range" min={0} max={120000} value={Math.min(maxPrice, 120000)} onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 100))} />
              </div>

              {availableRuSizes.length > 0 && (
                <>
                  <div className="h-px bg-[#1E1E22]" />

                  <div className="space-y-3.5">
                    <p className="text-sm font-semibold text-[#FAFAF9]">Российский размер</p>
                    <div className="grid grid-cols-5 gap-2">
                      {availableRuSizes.map((ruSize) => (
                        <button
                          key={ruSize}
                          type="button"
                          onClick={() => toggle(ruSize, selectedRuSizes, setSelectedRuSizes)}
                          className={`h-9 rounded-md border px-1 text-xs font-medium ${selectedRuSizes.includes(ruSize) ? 'border-[#54A0C5] bg-[#54A0C5] text-[#FAFAF9]' : 'border-[#2A2A2E] text-[#A0A0A5]'}`}
                        >
                          {ruSize}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {availableSizes.length > 0 && (
                <>
                  <div className="h-px bg-[#1E1E22]" />

                  <div className="space-y-3.5">
                    <p className="text-sm font-semibold text-[#FAFAF9]">Размер</p>
                    <div className="grid grid-cols-6 gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggle(size, selectedSizes, setSelectedSizes)}
                          className={`h-9 rounded-md border px-1 text-xs font-medium ${selectedSizes.includes(size) ? 'border-[#54A0C5] bg-[#54A0C5] text-[#FAFAF9]' : 'border-[#2A2A2E] text-[#A0A0A5]'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="h-px bg-[#1E1E22]" />

              <button type="button" onClick={reset} className="h-10 w-full rounded-md border border-[#2A2A2E] text-[13px] font-medium text-[#A0A0A5] hover:text-[#FAFAF9]">Сбросить фильтры</button>
            </>
          </div>
        </aside>

        <section className="space-y-5">
          {filtered.length === 0 ? (
            <div className="flex min-h-[560px] flex-col items-center justify-center gap-6 rounded-2xl border border-[#1E1E22] bg-[#16161A] px-10 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#54A0C515]">
                <SearchX className="h-8 w-8 text-[#54A0C5]" />
              </div>
              <h3 className="text-[28px] font-bold text-[#FAFAF9]">Товаров не найдено</h3>
              <p className="max-w-[520px] whitespace-pre-line text-sm leading-[1.7] text-[#6B6B70]">
                {searchQuery
                  ? `По запросу «${searchQuery}» ничего не найдено. Попробуйте другой запрос или сбросьте фильтры.`
                  : 'По выбранным фильтрам товары не найдены. Попробуйте изменить фильтры.'}
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSearchQuery('')} className="rounded-md bg-[#54A0C5] px-5 py-2.5 text-xs font-medium text-[#FAFAF9]">
                  Сбросить поиск
                </button>
                <button type="button" onClick={reset} className="rounded-md border border-[#2A2A2E] px-5 py-2.5 text-xs font-medium text-[#A0A0A5]">
                  Показать всё
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item, idx) => (
                  <article
                    key={`${item.id}-${idx}`}
                    onClick={() => navigate(getCanonicalProductUrl(item))}
                    className="cursor-pointer overflow-hidden rounded-lg border border-[#1E1E22] bg-[#16161A]"
                  >
                    <div className="relative h-[260px]">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      {idx === 0 && <span className="absolute left-3 top-3 rounded bg-[#54A0C5] px-2.5 py-1 text-[10px] font-semibold tracking-[1px] text-[#FAFAF9]">ХИТ ПРОДАЖ</span>}
                      {item.isNew && idx !== 0 && <span className="absolute left-3 top-3 rounded bg-[#2A2A2E] px-2.5 py-1 text-[10px] font-semibold tracking-[1px] text-[#FAFAF9]">НОВИНКА</span>}
                    </div>
                    <div className="space-y-3 p-5">
                      <p className="text-[15px] font-medium text-[#FAFAF9]">{item.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-[#A0A0A5]"><Star className="h-3.5 w-3.5 fill-[#54A0C5] text-[#54A0C5]" />{item.rating.toFixed(1)} ({item.reviews} отз.)</div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-[#FAFAF9]">{formatPrice(item.price)} ₽</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const baseId = stripVariantId(item.id);
                            addToCart(baseId, 1, item.sizes?.[0] || 'M');
                          }}
                          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#54A0C5] px-4 text-sm font-medium text-[#FAFAF9] transition-colors hover:bg-[#4a94b7]"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          В корзину
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-9 w-9 rounded-md border border-[#2A2A2E] text-[#A0A0A5]">‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setPage(n)} className={`h-9 w-9 rounded-md border text-xs ${n === current ? 'border-[#54A0C5] bg-[#54A0C5] text-[#FAFAF9]' : 'border-[#2A2A2E] text-[#A0A0A5]'}`}>{n}</button>
                ))}
                <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} className="h-9 w-9 rounded-md border border-[#2A2A2E] text-[#A0A0A5]">›</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}


