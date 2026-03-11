import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Truck, ShieldCheck, RotateCcw, Headphones, ArrowRight } from 'lucide-react';
import { useMotoStore } from '../src/data/motoStore.jsx';
import { createPageUrl, createProductUrl } from '../src/utils.js';
import Seo from '../src/components/Seo.jsx';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1761903311461-854de9793ed6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1440',
    tag: 'НОВАЯ КОЛЛЕКЦИЯ 2026',
    title: 'Экипировка\nвысшего класса',
    subtitle: 'Премиальные шлемы, куртки и защита для райдеров, которые ценят качество, безопасность и стиль.',
  },
  {
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1440',
    tag: 'ГОРОДСКОЙ СЕЗОН',
    title: 'Максимум\nзащиты в городе',
    subtitle: 'Современные материалы, продуманная вентиляция и надежная посадка для ежедневных маршрутов.',
  },
  {
    image: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1440',
    tag: 'ДАЛЬНИЕ МАРШРУТЫ',
    title: 'Комфорт\nна любой дистанции',
    subtitle: 'Готовые решения для поездок на дальние расстояния без компромиссов по безопасности.',
  },
];

const READY_LOOKS = [
  {
    slug: 'dark-rider',
    name: 'Dark Rider',
    slides: [
      {
        description: 'Полная защита в тёмном стиле',
        priceText: 'от 24 990 ₽',
        countText: '4 товара',
        image: 'https://images.unsplash.com/photo-1569931327952-8cbcd1734ca8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Максимум контроля в городе',
        priceText: 'от 26 490 ₽',
        countText: '5 товаров',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Сет для ежедневных поездок',
        priceText: 'от 23 990 ₽',
        countText: '3 товара',
        image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
  {
    slug: 'urban-warrior',
    name: 'Urban Warrior',
    slides: [
      {
        description: 'Городской стиль с максимальной защитой',
        priceText: 'от 19 990 ₽',
        countText: '3 товара',
        image: 'https://images.unsplash.com/photo-1720211466012-dba5663d612d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Лёгкий комплект на каждый день',
        priceText: 'от 21 490 ₽',
        countText: '4 товара',
        image: 'https://images.unsplash.com/photo-1694676043796-7ae250a81f3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
  {
    slug: 'night-cruiser',
    name: 'Night Cruiser',
    slides: [
      {
        description: 'Для вечерних поездок по городу',
        priceText: 'от 32 490 ₽',
        countText: '5 товаров',
        image: 'https://images.unsplash.com/photo-1762769665979-52caeade14a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Комфорт и заметность ночью',
        priceText: 'от 31 290 ₽',
        countText: '4 товара',
        image: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Для быстрых городских выездов',
        priceText: 'от 29 990 ₽',
        countText: '3 товара',
        image: 'https://images.unsplash.com/photo-1591217554009-7aedf8ec3244?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
  {
    slug: 'road-king',
    name: 'Road King',
    slides: [
      {
        description: 'Классический образ для дальних поездок',
        priceText: 'от 28 990 ₽',
        countText: '4 товара',
        image: 'https://images.unsplash.com/photo-1758615590275-9a46daafc4f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Туринговый набор повышенного комфорта',
        priceText: 'от 33 490 ₽',
        countText: '5 товаров',
        image: 'https://images.unsplash.com/photo-1665009490901-ca1f40408047?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
];

const HOME_CATEGORIES = [
  { name: 'Шлемы', image: 'https://images.unsplash.com/photo-1645021081534-93ce573e3dce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { name: 'Куртки', image: 'https://images.unsplash.com/photo-1694852860772-ec8598c72c15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { name: 'Перчатки', image: 'https://images.unsplash.com/photo-1662707645694-36d3e81afd85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { name: 'Ботинки', image: 'https://images.unsplash.com/photo-1693679117329-da630cfbf90c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { name: 'Защита', image: 'https://images.unsplash.com/photo-1644435234001-ceb5f78330f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { name: 'Аксессуары', image: 'https://images.unsplash.com/photo-1719212752790-fb82dd11de88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
];

const FEATURED_PRODUCTS = [
  {
    productId: 'helmet-shoei-rf1400-matte',
    name: 'Shoei RF-1400 Матовый',
    rating: '4.9 (128 отз.)',
    priceText: '54 900 ₽',
    image: 'https://images.unsplash.com/photo-1591216117012-82597d240978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    badge: 'ХИТ ПРОДАЖ',
    badgeClass: 'bg-[#54A0C5] text-[#FAFAF9]',
  },
  {
    productId: 'jacket-revit-eclipse',
    name: "Rev'It Eclipse 2 Куртка",
    rating: '4.7 (94 отз.)',
    priceText: '38 900 ₽',
    image: 'https://images.unsplash.com/photo-1694676043796-7ae250a81f3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    productId: 'gloves-sp8-black',
    name: 'Alpinestars SP-8 Перчатки',
    rating: '4.8 (67 отз.)',
    priceText: '12 900 ₽',
    image: 'https://images.unsplash.com/photo-1569932353341-b518d82f8a54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    badge: 'НОВИНКА',
    badgeClass: 'bg-[#2A2A2E] text-[#FAFAF9]',
  },
  {
    productId: 'boots-tcx-street',
    name: 'TCX Street 3 Ботинки',
    rating: '4.6 (52 отз.)',
    priceText: '21 900 ₽',
    image: 'https://images.unsplash.com/photo-1591217554009-7aedf8ec3244?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
];

const TRUST_ITEMS = [
  { title: 'Бесплатная доставка', subtitle: 'При заказе от 10 000 ₽', Icon: Truck },
  { title: 'Сертификация', subtitle: 'ECE и DOT стандарты', Icon: ShieldCheck },
  { title: 'Простой возврат', subtitle: '30 дней на возврат', Icon: RotateCcw },
  { title: 'Поддержка', subtitle: 'Райдеры помогают райдерам', Icon: Headphones },
];
const MARQUEE_BRANDS = ['Shoei', 'Alpinestars', 'Dainese', 'AGV', 'REVIT', 'BELL', 'ARAI', 'ICON', 'SENA', 'SHARK', 'SCHUBERTH', 'HJC'];
const READY_LOOKS_DOMINO_INTERVAL_MS = 1800;

const revealStyles = `
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(28px) scale(0.985);
  transition: opacity .55s ease, transform .55s ease;
  will-change: transform, opacity;
}
.reveal-on-scroll.revealed {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.reveal-card {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity .45s ease, transform .45s ease;
}
.reveal-card.revealed {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll,
  .reveal-card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
`;

function ReadyLookCard({ look, current, onSelectSlide }) {
  const slides = look.slides;

  const slide = slides[current];

  return (
    <Link to={`${createPageUrl('ReadySet')}/${look.slug}`} className="overflow-hidden rounded-lg">
      <div className="relative h-64 w-full overflow-hidden rounded-lg sm:h-72 lg:h-80">
        {slides.map((item, idx) => (
          <img
            key={`${look.slug}-${idx}`}
            src={item.image}
            alt={look.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={`${look.slug}-dot-${idx}`}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onSelectSlide(idx);
              }}
              className={`h-1 rounded-[2px] ${idx === current ? 'w-4 bg-[#54A0C5]' : 'w-1 bg-[#6B6B70]'}`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 pt-4">
        <p className="text-base font-semibold text-[#FAFAF9]">{look.name}</p>
        <p className="text-xs font-normal text-[#A0A0A5]">{slide.description}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-[13px] font-medium text-[#54A0C5]">{slide.priceText}</p>
          <p className="text-xs font-normal text-[#6B6B70]">{slide.countText}</p>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { addToCart, products, categories, sets, getMaxAllowedQty, getCartQuantity } = useMotoStore();
  const [slide, setSlide] = useState(0);
  const [readyLookSlides, setReadyLookSlides] = useState([]);
  const [activeReadyLook, setActiveReadyLook] = useState(0);
  const [addedPulseByProduct, setAddedPulseByProduct] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const homeCategoriesData = React.useMemo(() => {
    const topLevel = Array.isArray(categories) ? categories.filter((c) => c.parent_id == null) : [];
    const byName = new Map(topLevel.map((c) => [String(c.name || '').toLowerCase(), c]));

    return HOME_CATEGORIES.map((base) => {
      const fromDb = byName.get(String(base.name).toLowerCase());
      const linked = products.find(
        (item) =>
          (fromDb?.id && String(item.categoryId || '') === String(fromDb.id)) ||
          String(item.category || '').toLowerCase() === String((fromDb?.name || base.name) || '').toLowerCase()
      );

      return {
        name: fromDb?.name || base.name,
        image: fromDb?.image || linked?.image || base.image,
      };
    });
  }, [categories, products]);

  const readyLooksData = React.useMemo(() => {
    if (!Array.isArray(sets) || sets.length === 0) return READY_LOOKS.slice(0, 4);

    const fromDb = sets
      .map((setItem, idx) => {
        const items = (setItem.productIds || [])
          .map((id) => products.find((product) => product.id === id))
          .filter(Boolean);

        const slidesFromProducts = items.slice(0, 4).map((product) => ({
          description: product.name,
          priceText: `от ${Number(product.price || 0).toLocaleString('ru-RU')} ₽`,
          countText: `${items.length} ${items.length === 1 ? 'товар' : items.length < 5 ? 'товара' : 'товаров'}`,
          image: product.image,
        }));

        const fallbackImage = setItem.coverImage || HOME_CATEGORIES[idx % HOME_CATEGORIES.length]?.image || HOME_CATEGORIES[0].image;
        const slides =
          slidesFromProducts.length > 0
            ? slidesFromProducts
            : [
                {
                  description: setItem.description || 'Готовый образ',
                  priceText: 'от 0 ₽',
                  countText: '0 товаров',
                  image: fallbackImage,
                },
              ];

        return {
          slug: setItem.slug || `look-${idx}`,
          name: setItem.name || `Образ ${idx + 1}`,
          slides,
        };
      })
      .filter((item) => item.slug && item.name);

    return (fromDb.length > 0 ? fromDb : READY_LOOKS).slice(0, 4);
  }, [sets, products]);

  useEffect(() => {
    setReadyLookSlides((prev) => readyLooksData.map((_, idx) => (Number.isInteger(prev[idx]) ? prev[idx] : 0)));
    setActiveReadyLook((prev) => (readyLooksData.length > 0 ? Math.min(prev, readyLooksData.length - 1) : 0));
  }, [readyLooksData]);

  const revealTargetsKey = React.useMemo(
    () =>
      `${readyLooksData.map((item) => item.slug).join('|')}::${homeCategoriesData
        .map((item) => item.name)
        .join('|')}`,
    [readyLooksData, homeCategoriesData]
  );

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (nodes.length === 0) return undefined;

    const revealIfVisible = (node) => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top <= viewportHeight * 0.95 && rect.bottom >= viewportHeight * 0.05;
    };

    nodes.forEach((node) => {
      if (revealIfVisible(node)) {
        node.classList.add('revealed');
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -2% 0px' }
    );

    nodes.forEach((node) => {
      if (!node.classList.contains('revealed')) {
        observer.observe(node);
      }
    });
    return () => observer.disconnect();
  }, [revealTargetsKey]);

  useEffect(() => {
    if (readyLooksData.length === 0) return undefined;
    const timer = setInterval(() => {
      setReadyLookSlides((prev) =>
        prev.map((currentSlide, idx) =>
          idx === activeReadyLook ? (currentSlide + 1) % readyLooksData[idx].slides.length : currentSlide
        )
      );
      setActiveReadyLook((prev) => (prev + 1) % readyLooksData.length);
    }, READY_LOOKS_DOMINO_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeReadyLook, readyLooksData]);

  const visibleFeatured = React.useMemo(() => {
    const source = Array.isArray(products) ? products : [];
    const prioritized = source.filter((item) => item.featured || item.popular || item.on_sale);
    const base = (prioritized.length >= 4 ? prioritized : source).slice(0, 4);

    const mapped = base.map((item, idx) => {
      const ratingValue = Number(item.rating || 4.6);
      const productId = item.id || item.product_id || item.slug || `featured-${idx}`;
      const rawPrice = Number(item.price);
      const normalizedPrice = Number.isFinite(rawPrice) ? rawPrice : 0;
      return {
        productId,
        slug: item.slug || null,
        name: item.name,
        rating: `${Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : '4.6'} (${item.reviews_count || 30 + idx * 7} отз.)`,
        priceText: `${normalizedPrice.toLocaleString('ru-RU')} ₽`,
        image: item.image || item.image_url || 'https://images.unsplash.com/photo-1591216117012-82597d240978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        badge: item.featured ? 'ХИТ ПРОДАЖ' : item.on_sale ? 'ВЫГОДА' : item.popular ? 'ПОПУЛЯРНОЕ' : '',
        badgeClass: item.featured ? 'bg-[#54A0C5] text-[#FAFAF9]' : item.on_sale ? 'bg-[#1E1E22] text-[#FAFAF9]' : 'bg-[#2A2A2E] text-[#FAFAF9]',
      };
    });

    return mapped.length > 0 ? mapped : FEATURED_PRODUCTS;
  }, [products]);

  const currentSlide = HERO_SLIDES[slide];

  const triggerAddAnimation = (productId) => {
    setAddedPulseByProduct((prev) => ({ ...prev, [productId]: true }));
    window.setTimeout(() => {
      setAddedPulseByProduct((prev) => ({ ...prev, [productId]: false }));
    }, 850);
  };

  const homeStructuredData = React.useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mototom.ru';
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'MOTOTOM',
          url: origin,
          logo: `${origin}/logo.png`,
        },
        {
          '@type': 'WebSite',
          name: 'MOTOTOM',
          url: origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${origin}/shop?search={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    };
  }, []);

  return (
    <div className="bg-[#0D0D0F] text-slate-100">
      <Seo
        title="Мотоэкипировка и готовые образы"
        description="MOTOTOM: шлемы, куртки, перчатки, ботинки и готовые образы. Подбор экипировки и доставка по России."
        structuredData={homeStructuredData}
      />
      <style>{revealStyles}</style>
      <section className="relative h-[560px] w-full overflow-hidden sm:h-[620px] lg:h-[680px]">
        {HERO_SLIDES.map((item, idx) => (
          <img
            key={item.image}
            src={item.image}
            alt="MotoTom Hero"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === slide ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0Fe6] via-[#0D0D0F99] to-[#0D0D0FCC]" />

        <div className="absolute left-4 right-4 top-24 flex max-w-[620px] flex-col gap-5 sm:left-8 sm:right-auto sm:top-28 sm:gap-6 lg:left-12 lg:top-32 xl:left-20 xl:top-40">
          <span className="w-fit rounded border border-[#54A0C560] bg-[#54A0C520] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#54A0C5]">{currentSlide.tag}</span>
          <h1 className="whitespace-pre-line text-[36px] font-bold leading-[0.95] tracking-[-1px] text-[#FAFAF9] sm:text-[46px] lg:text-[56px]">{currentSlide.title}</h1>
          <p className="max-w-[520px] text-sm font-normal leading-[1.5] text-[#A0A0A5] sm:text-[15px]">{currentSlide.subtitle}</p>
          <div className="flex flex-wrap gap-3 text-sm sm:gap-4">
            <Link to={createPageUrl('Shop')} className="inline-flex items-center gap-2 rounded bg-[#54A0C5] px-5 py-3 font-semibold text-[#FAFAF9] sm:px-7 sm:py-3.5">
              Смотреть каталог <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={`${createPageUrl('ReadySet')}/dark-rider`} className="rounded border border-[#FAFAF930] bg-[#FAFAF908] px-5 py-3 font-medium text-[#FAFAF9] sm:px-7 sm:py-3.5">
              Готовые образы
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-4 flex items-center gap-2 sm:bottom-10 sm:left-8 lg:left-12 xl:left-20">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSlide(idx)}
              className={`h-[3px] rounded-[2px] transition-all ${idx === slide ? 'w-6 bg-[#54A0C5]' : 'w-6 bg-[#FAFAF930]'}`}
            />
          ))}
        </div>
        <div className="absolute bottom-8 right-4 text-xs font-medium tracking-[0.14em] text-[#A0A0A5] sm:bottom-10 sm:right-8 lg:right-12 xl:right-20">{String(slide + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}</div>
      </section>

      <section data-reveal className="reveal-on-scroll border-y border-[#1E1E22] bg-[#0A0A0C] px-4 py-4 sm:px-6 lg:px-10 xl:px-20">
        <div className="mx-auto w-full max-w-[1440px] overflow-hidden">
          <div className="brand-marquee">
            {[...MARQUEE_BRANDS, ...MARQUEE_BRANDS].map((brand, idx) => (
              <span key={`${brand}-${idx}`} className="mr-12 text-[11px] uppercase tracking-[0.16em] text-slate-400">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="reveal-on-scroll bg-[#111114] px-4 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-14 xl:px-20" style={{ backgroundImage: 'radial-gradient(50% 80% at 10% 70%, rgba(84,160,197,0.07) 0%, rgba(84,160,197,0) 100%)' }}>
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-3">
            <h2 className="text-[24px] font-bold tracking-[-0.5px] text-[#FAFAF9] sm:text-[28px]">Готовые образы</h2>
            <p className="max-w-[480px] text-sm font-normal leading-[1.5] text-[#A0A0A5]">Стиль и практичность в каждой детали. Собранные комплекты для настоящих райдеров.</p>
            </div>
            <Link to={createPageUrl('LooksCatalog')} className="flex items-center gap-1.5 text-[13px] font-medium text-[#A0A0A5] hover:text-[#FAFAF9]">
              <span>Все образы</span>
              <span>→</span>
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {readyLooksData.map((look, idx) => (
              <div key={look.slug} data-reveal className="reveal-card" style={{ transitionDelay: `${Math.min(idx * 70, 260)}ms` }}>
                <ReadyLookCard
                  look={look}
                  current={readyLookSlides[idx] || 0}
                  onSelectSlide={(selectedIdx) => {
                    setReadyLookSlides((prev) => prev.map((value, i) => (i === idx ? selectedIdx : value)));
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="reveal-on-scroll px-4 py-10 sm:px-6 sm:py-12 lg:px-10 xl:px-20" style={{ backgroundImage: 'radial-gradient(60% 80% at 85% 0%, rgba(84,160,197,0.1) 0%, rgba(84,160,197,0) 100%)' }}>
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[22px] font-semibold tracking-[-0.5px] text-[#FAFAF9] sm:text-2xl">Категории товаров</h3>
            <Link to={createPageUrl('Shop')} className="flex items-center gap-1.5 text-[13px] font-medium text-[#A0A0A5] hover:text-[#FAFAF9]">
              <span>Все категории</span>
              <span>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {homeCategoriesData.map((category, idx) => (
              <div key={category.name} data-reveal className="reveal-card" style={{ transitionDelay: `${Math.min(idx * 50, 250)}ms` }}>
                <Link to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}`} className="flex h-[180px] flex-col overflow-hidden rounded-lg border border-[#1E1E22] bg-[#16161A]">
                  <img src={category.image} alt={category.name} className="h-[120px] w-full object-cover" />
                  <div className="flex h-[60px] items-center justify-between px-4">
                    <span className="text-sm font-medium text-[#FAFAF9]">{category.name}</span>
                    <span className="text-base text-[#A0A0A5]">›</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-10 xl:px-20" style={{ backgroundImage: 'radial-gradient(40% 60% at 90% 30%, rgba(84,160,197,0.06) 0%, rgba(84,160,197,0) 100%)' }}>
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[22px] font-semibold tracking-[-0.5px] text-[#FAFAF9] sm:text-2xl">Популярные товары</h3>
            <Link to={createPageUrl('Shop')} className="flex items-center gap-1.5 rounded border border-[#2A2A2E] px-5 py-2.5 text-[13px] font-medium text-[#FAFAF9]">
              <span>Весь каталог</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {visibleFeatured.map((item, idx) => (
              <div key={item.productId || `${item.name}-${idx}`} className="h-full">
                <article
                  onClick={() => navigate(createProductUrl({ id: item.productId, slug: item.slug, name: item.name }))}
                  className="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-[#1E1E22] bg-[#16161A]"
                >
                  <div className="relative h-[220px] w-full sm:h-[240px] lg:h-[260px]">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    {item.badge && <span className={`absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-semibold tracking-[1px] ${item.badgeClass}`}>{item.badge}</span>}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <p className="min-h-[44px] text-[15px] font-medium text-[#FAFAF9] line-clamp-2">{item.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[#A0A0A5]"><Star className="h-3.5 w-3.5 fill-[#54A0C5] text-[#54A0C5]" /><span>{item.rating}</span></div>
                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-lg font-bold text-[#FAFAF9]">{item.priceText}</p>
                      {(() => {
                        const cartQty = getCartQuantity(item.productId, null);
                        const maxAllowed = getMaxAllowedQty(item.productId);
                        const canAdd = maxAllowed > cartQty;
                        const justAdded = Boolean(addedPulseByProduct[item.productId]);
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const result = addToCart(item.productId, 1);
                              if (result?.added) {
                                triggerAddAnimation(item.productId);
                              }
                            }}
                            disabled={!canAdd}
                            className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-all sm:px-4 ${
                              canAdd
                                ? justAdded
                                  ? 'bg-[#32D583] text-[#0D0D0F] scale-[1.03]'
                                  : 'bg-[#54A0C5] text-[#FAFAF9] hover:bg-[#4a94b7]'
                                : 'bg-[#2A2A2E] text-[#6B6B70] cursor-not-allowed'
                            }`}
                          >
                            {justAdded ? <span className="text-base leading-none">✓</span> : <ShoppingBag className="h-4 w-4" />}
                            <span className="hidden sm:inline">{justAdded ? 'Добавлено' : canAdd ? 'В корзину' : 'Лимит'}</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="reveal-on-scroll border-y border-[#1E1E22] bg-[#111114] px-4 py-10 sm:px-6 lg:px-10 xl:px-20">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex items-center gap-3.5 rounded-lg border border-[#1E1E22] bg-[#141418] p-4 sm:border-none sm:bg-transparent sm:p-0">
              <item.Icon className="h-6 w-6 text-[#54A0C5]" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-[#FAFAF9]">{item.title}</p>
                <p className="text-xs font-normal text-[#A0A0A5]">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


