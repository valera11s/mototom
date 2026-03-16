import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Send,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMotoStore } from '../src/data/motoStore.jsx';
import { createPageUrl, createProductUrl, formatPrice } from '../src/utils.js';
import Seo from '../src/components/Seo.jsx';
import avitoReviews from '../src/data/avitoReviews.json';
import {
  DEFAULT_MARQUEE_PROMOS,
  HOME_CATEGORY_META,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  PRODUCT_BADGE_CLASS,
  parseMarqueePromos,
} from '../src/data/siteTheme.js';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1761903311461-854de9793ed6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    tag: 'НОВАЯ КОЛЛЕКЦИЯ 2026',
    title: 'Экипировка\nдля тех, кто едет дальше',
    subtitle:
      'Премиальные шлемы, мотокуртки и защита для райдеров, которые выбирают не компромисс, а правильную экипировку.',
  },
  {
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    tag: 'ГОРОДСКОЙ СЕЗОН',
    title: 'Городской комплект\nбез лишнего шума',
    subtitle:
      'Точные посадки, понятные материалы и спокойный premium-визуал для ежедневных маршрутов.',
  },
  {
    image: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    tag: 'ДАЛЬНИЕ ПОЕЗДКИ',
    title: 'Комфорт и контроль\nна любой дистанции',
    subtitle:
      'Шлемы, куртки и аксессуары для длинных поездок, когда важна каждая деталь комплекта.',
  },
];

const READY_LOOKS_FALLBACK = [
  {
    slug: 'dark-rider',
    name: 'Dark Rider',
    slides: [
      {
        description: 'Полная защита в тёмном стиле',
        priceText: 'от 24 990 ?',
        countText: '4 товара',
        image: 'https://images.unsplash.com/photo-1569931327952-8cbcd1734ca8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Максимум контроля в городе',
        priceText: 'от 26 490 ?',
        countText: '5 товаров',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
  {
    slug: 'urban-warrior',
    name: 'Urban Warrior',
    slides: [
      {
        description: 'Городской сет с мягкой защитой',
        priceText: 'от 19 990 ?',
        countText: '3 товара',
        image: 'https://images.unsplash.com/photo-1720211466012-dba5663d612d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
      {
        description: 'Лёгкий комплект на каждый день',
        priceText: 'от 21 490 ?',
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
        description: 'Для быстрых вечерних выездов',
        priceText: 'от 32 490 ?',
        countText: '5 товаров',
        image: 'https://images.unsplash.com/photo-1762769665979-52caeade14a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
  {
    slug: 'road-king',
    name: 'Road King',
    slides: [
      {
        description: 'Туринговый комплект без компромиссов',
        priceText: 'от 28 990 ?',
        countText: '4 товара',
        image: 'https://images.unsplash.com/photo-1758615590275-9a46daafc4f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
];

const TELEGRAM_CHANNEL_URL = 'https://t.me/+kpx4Cn3SqUNkODIy';
const TELEGRAM_PREVIEW_IMAGE = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200';
const AVITO_REVIEWS_URL = 'https://www.avito.ru/brands/i175353051?src=ratings';
const AVITO_RATING = '5 из 5';
const AVITO_RATING_COUNT = 'На основе 175 оценок';
const YANDEX_REVIEWS_URL = 'https://yandex.ru/maps/org/mototom/58026783026/reviews/';
const YANDEX_RATING = '5.0';
const YANDEX_REVIEWS_COUNT = '500+ отзывов';
const TRUST_ITEMS = [
  { title: 'Бесплатная доставка', subtitle: 'При заказе от 10 000 ?', Icon: Truck },
  { title: 'Сертификация', subtitle: 'ECE и DOT стандарты', Icon: ShieldCheck },
  { title: 'Простой возврат', subtitle: '30 дней на возврат', Icon: RotateCcw },
  { title: 'Поддержка', subtitle: 'Райдеры помогают райдерам', Icon: Headphones },
];

const revealStyles = `
.reveal-on-scroll { opacity: 0; transform: translateY(28px); transition: opacity .55s ease, transform .55s ease; }
.reveal-on-scroll.revealed { opacity: 1; transform: translateY(0); }
@keyframes mototom-marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.marquee-track { animation: mototom-marquee-left 24s linear infinite; }
.marquee-track:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .reveal-on-scroll { opacity: 1; transform: none; transition: none; }
  .marquee-track { animation: none; }
}
`;

function normalizeCategoryName(name) {
  const value = String(name || '').trim().toLowerCase();
  if (value.includes('шлем')) return 'helmets';
  if (value.includes('куртк') || value.includes('моторубаш')) return 'jackets';
  if (value.includes('перчат')) return 'gloves';
  if (value.includes('ботин')) return 'boots';
  if (value.includes('защит')) return 'protection';
  if (value.includes('аксесс')) return 'accessories';
  return value;
}

function getConditionMeta(condition) {
  const isUsed = String(condition || 'new').toLowerCase() === 'used';
  return {
    label: isUsed ? 'Б/У' : 'Новый',
    className: isUsed ? PRODUCT_BADGE_CLASS.used : PRODUCT_BADGE_CLASS.new,
  };
}

function ProductCard({ item, navigate, addToCart, getCartQuantity, getMaxAllowedQty, badgeText }) {
  const condition = getConditionMeta(item.condition);
  const cartQty = getCartQuantity(item.productId, null);
  const maxAllowed = getMaxAllowedQty(item.productId);
  const canAdd = maxAllowed > cartQty;

  return (
    <article
      onClick={() => navigate(createProductUrl({ id: item.productId, slug: item.slug, name: item.name }))}
      className="group flex h-full cursor-pointer snap-start flex-col overflow-hidden rounded-[22px] border border-[#1E1E22] bg-[#16161A]"
    >
      <div className="relative h-[240px] overflow-hidden sm:h-[260px]">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {badgeText ? <span className="rounded-full bg-[#54A0C5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FAFAF9]">{badgeText}</span> : null}
          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${condition.className}`}>{condition.label}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#54A0C5]">{item.brand || 'MOTOTOM'}</p>
          <p className="mt-2 min-h-[48px] text-[17px] font-semibold leading-6 text-[#FAFAF9] line-clamp-2">{item.name}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#A0A0A5]">
          <Star className="h-3.5 w-3.5 fill-[#54A0C5] text-[#54A0C5]" />
          <span>{item.rating}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <p className="text-[24px] font-bold tracking-[-0.4px] text-[#FAFAF9]">{item.priceText}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addToCart(item.productId, 1);
            }}
            disabled={!canAdd}
            className={`${PRIMARY_BUTTON_CLASS} h-11 min-w-[132px] px-4 py-0 text-[13px] ${!canAdd ? 'cursor-not-allowed opacity-55 hover:translate-y-0 hover:shadow-none' : ''}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{canAdd ? 'В корзину' : 'Лимит'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
function ProductSection({ title, href, buttonLabel, items, navigate, addToCart, getCartQuantity, getMaxAllowedQty }) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-10 xl:px-20">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54A0C5]">Подборка</p>
            <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.5px] text-[#FAFAF9] sm:text-[30px]">{title}</h3>
          </div>
          <Link to={href} className={PRIMARY_BUTTON_CLASS}>
            <span>{buttonLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
          {items.map((item, idx) => (
            <div key={`${title}-${item.productId}-${idx}`} className="w-[86vw] shrink-0 sm:w-auto">
              <ProductCard
                item={item}
                badgeText={idx === 0 ? 'Хит продаж' : ''}
                navigate={navigate}
                addToCart={addToCart}
                getCartQuantity={getCartQuantity}
                getMaxAllowedQty={getMaxAllowedQty}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReadyLookCard({ look, current, onSelectSlide }) {
  const slides = look.slides;
  const slide = slides[current] || slides[0];

  return (
    <Link to={`${createPageUrl('ReadySet')}/${look.slug}`} className="group overflow-hidden rounded-[22px]">
      <div className="relative h-72 overflow-hidden rounded-[22px] border border-[#1E1E22] bg-[#16161A] sm:h-80">
        {slides.map((item, idx) => (
          <img
            key={`${look.slug}-${idx}`}
            src={item.image}
            alt={look.name}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D0D0FEA] via-[#0D0D0F82] to-transparent p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[20px] font-semibold text-[#FAFAF9]">{look.name}</p>
              <p className="mt-2 text-sm text-[#D7D7DC]">{slide.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-[#54A0C5]">{slide.priceText}</span>
                <span className="text-xs text-[#A0A0A5]">{slide.countText}</span>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-[#FAFAF9] transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={`${look.slug}-dot-${idx}`}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onSelectSlide(idx);
              }}
              className={`h-1.5 rounded-full ${idx === current ? 'w-8 bg-[#54A0C5]' : 'w-2 bg-[#D0D3DA6B]'}`}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { addToCart, products, categories, sets, settings, getMaxAllowedQty, getCartQuantity } = useMotoStore();
  const [heroIndex, setHeroIndex] = useState(0);
  const [readyLookSlides, setReadyLookSlides] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [expandedReviewMap, setExpandedReviewMap] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (nodes.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [products.length, categories.length, sets.length]);

  const topLevelCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories.filter((item) => item.parent_id == null) : [];
    const byKey = new Map(list.map((item) => [normalizeCategoryName(item.name), item]));

    return Object.entries(HOME_CATEGORY_META).map(([key, meta]) => {
      const fromDb = byKey.get(key);
      const linkedProduct = products.find((product) => normalizeCategoryName(product.category) === key);
      return {
        key,
        name: fromDb?.name || meta.name,
        description: meta.description,
        image: fromDb?.image || linkedProduct?.image || meta.image,
      };
    });
  }, [categories, products]);

  const marqueePromos = useMemo(() => {
    const parsed = parseMarqueePromos(settings?.home_marquee_promos);
    return parsed.length > 0 ? parsed : DEFAULT_MARQUEE_PROMOS;
  }, [settings]);

  const readyLooks = useMemo(() => {
    if (!Array.isArray(sets) || sets.length === 0) return READY_LOOKS_FALLBACK;

    const looks = sets.map((setItem, idx) => {
      const items = (setItem.productIds || []).map((id) => products.find((product) => String(product.id) === String(id))).filter(Boolean);
      const slides = items.slice(0, 4).map((product) => ({
        description: product.name,
        priceText: `от ${formatPrice(product.price)} ?`,
        countText: `${items.length} ${items.length === 1 ? 'товар' : items.length < 5 ? 'товара' : 'товаров'}`,
        image: product.image,
      }));

      return {
        slug: setItem.slug || `look-${idx}`,
        name: setItem.name || `Образ ${idx + 1}`,
        slides: slides.length > 0 ? slides : [{
          description: setItem.description || 'Готовый образ',
          priceText: 'от 0 ?',
          countText: '0 товаров',
          image: setItem.coverImage || READY_LOOKS_FALLBACK[idx % READY_LOOKS_FALLBACK.length].slides[0].image,
        }],
      };
    });

    return looks.slice(0, 4);
  }, [sets, products]);

  useEffect(() => {
    setReadyLookSlides((prev) => readyLooks.map((look, idx) => (Number.isInteger(prev[idx]) ? Math.min(prev[idx], look.slides.length - 1) : 0)));
  }, [readyLooks]);

  const mapProductCard = (item) => ({
    productId: item.id,
    slug: item.slug || null,
    brand: item.brand || 'MOTOTOM',
    name: item.name,
    condition: item.condition || 'new',
    image: item.image || item.image_url,
    priceText: `${formatPrice(item.price || 0)} ?`,
    rating: `${Number(item.rating || 4.8).toFixed(1)} (${item.reviews_count || 20} отз.)`,
  });

  const helmetProducts = useMemo(() => products.filter((item) => normalizeCategoryName(item.category) === 'helmets').slice(0, 4).map(mapProductCard), [products]);
  const jacketProducts = useMemo(() => products.filter((item) => normalizeCategoryName(item.category) === 'jackets').slice(0, 4).map(mapProductCard), [products]);
  const featuredFallback = useMemo(() => products.slice(0, 8).map(mapProductCard), [products]);
  const popularHelmets = helmetProducts.length > 0 ? helmetProducts : featuredFallback.slice(0, 4);
  const popularJackets = jacketProducts.length > 0 ? jacketProducts : featuredFallback.slice(4, 8).length > 0 ? featuredFallback.slice(4, 8) : featuredFallback.slice(0, 4);

  const activeReviews = useMemo(() => (Array.isArray(avitoReviews) ? avitoReviews.slice(0, 6) : []), []);
  const activeReview = activeReviews[reviewIndex] || null;
  const currentSlide = HERO_SLIDES[heroIndex];

  const homeStructuredData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mototom.ru';
    return {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: 'MOTOTOM', url: origin, logo: `${origin}/logo.png` },
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
      <Seo title="Мотоэкипировка и готовые образы" description="MOTOTOM: шлемы, мотокуртки, защита и аксессуары. Подбор экипировки и доставка по России." structuredData={homeStructuredData} />
      <style>{revealStyles}</style>
      <section className="relative h-[640px] overflow-hidden sm:h-[700px] lg:h-[760px]">
        {HERO_SLIDES.map((item, idx) => (
          <img key={item.image} src={item.image} alt="Hero" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === heroIndex ? 'opacity-100' : 'opacity-0'}`} />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,6,8,0.88)_0%,rgba(6,6,8,0.56)_40%,rgba(6,6,8,0.22)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(84,160,197,0.28),transparent_34%)]" />

        <div className="relative mx-auto flex h-full w-full max-w-[1440px] flex-col justify-end px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pb-16 xl:px-20">
          <div className="max-w-[700px]">
            <p className="inline-flex rounded-full border border-[#7eb8d355] bg-[#54A0C51F] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#CBE9F6]">{currentSlide.tag}</p>
            <h1 className="mt-5 whitespace-pre-line text-[42px] font-semibold uppercase leading-[0.94] tracking-[-2px] text-[#FAFAF9] sm:text-[58px] lg:text-[82px]">{currentSlide.title}</h1>
            <p className="mt-5 max-w-[560px] text-sm leading-7 text-[#D6D9DF] sm:text-base sm:leading-8">{currentSlide.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={createPageUrl('Shop')} className={PRIMARY_BUTTON_CLASS}>
                <span>Смотреть коллекцию</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={createPageUrl('LooksCatalog')} className={SECONDARY_BUTTON_CLASS}>
                <span>Готовые образы</span>
              </Link>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button key={`hero-${idx}`} type="button" onClick={() => setHeroIndex(idx)} className={`h-1.5 rounded-full transition-all ${idx === heroIndex ? 'w-12 bg-[#54A0C5]' : 'w-2 bg-[#d7d7dc69]'}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#1E1E22] bg-[#101013]">
        <div className="relative mx-auto flex w-full max-w-[1440px] overflow-hidden px-0 py-4 sm:px-6 lg:px-10 xl:px-20">
          <div className="marquee-track flex min-w-full shrink-0 items-center gap-10 pr-10">
            <img src="/assets/brand-strip-combined.png" alt="Brand strip" className="h-6 w-auto shrink-0 object-contain opacity-90 sm:h-7" />
            <img src="/assets/brand-strip-combined.png" alt="Brand strip repeat" className="h-6 w-auto shrink-0 object-contain opacity-90 sm:h-7" />
            <img src="/assets/brand-strip-combined.png" alt="Brand strip repeat second" className="hidden h-6 w-auto shrink-0 object-contain opacity-90 lg:block lg:h-7" />
            {marqueePromos.map((promo) => (
              <span key={promo} className="shrink-0 rounded-full border border-[#2A2A2E] bg-[#151519] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4D8DE]">{promo}</span>
            ))}
          </div>

          <div aria-hidden className="marquee-track absolute left-full top-4 flex min-w-full items-center gap-10 pr-10">
            <img src="/assets/brand-strip-combined.png" alt="Brand strip" className="h-6 w-auto shrink-0 object-contain opacity-90 sm:h-7" />
            <img src="/assets/brand-strip-combined.png" alt="Brand strip repeat" className="h-6 w-auto shrink-0 object-contain opacity-90 sm:h-7" />
            <img src="/assets/brand-strip-combined.png" alt="Brand strip repeat second" className="hidden h-6 w-auto shrink-0 object-contain opacity-90 lg:block lg:h-7" />
            {marqueePromos.map((promo) => (
              <span key={`${promo}-clone`} className="shrink-0 rounded-full border border-[#2A2A2E] bg-[#151519] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4D8DE]">{promo}</span>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="reveal-on-scroll px-4 py-10 sm:px-6 sm:py-12 lg:px-10 xl:px-20">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54A0C5]">Каталог</p>
              <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.5px] text-[#FAFAF9] sm:text-[30px]">Категории товаров</h3>
            </div>
            <Link to={createPageUrl('Shop')} className={SECONDARY_BUTTON_CLASS}>
              <span>Все категории</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {topLevelCategories.map((category) => (
              <Link key={category.key} to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}`} className="overflow-hidden rounded-[18px] border border-[#1E1E22] bg-[#16161A]">
                <img src={category.image} alt={category.name} className="h-[120px] w-full object-cover sm:h-[136px]" />
                <div className="flex min-h-[72px] items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#FAFAF9]">{category.name}</p>
                    <p className="mt-1 text-[11px] text-[#8D929C]">{category.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#8D929C]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductSection title="Популярные шлемы" href={`${createPageUrl('Shop')}?category=${encodeURIComponent('Шлемы')}`} buttonLabel="Все шлемы" items={popularHelmets} navigate={navigate} addToCart={addToCart} getCartQuantity={getCartQuantity} getMaxAllowedQty={getMaxAllowedQty} />
      <ProductSection title="Популярные мотокуртки" href={`${createPageUrl('Shop')}?category=${encodeURIComponent('Куртки')}`} buttonLabel="Все мотокуртки" items={popularJackets} navigate={navigate} addToCart={addToCart} getCartQuantity={getCartQuantity} getMaxAllowedQty={getMaxAllowedQty} />

      <section data-reveal className="reveal-on-scroll px-4 py-10 sm:px-6 sm:py-12 lg:px-10 xl:px-20">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54A0C5]">Looks</p>
              <h3 className="mt-2 text-[24px] font-semibold tracking-[-0.5px] text-[#FAFAF9] sm:text-[30px]">Готовые образы</h3>
            </div>
            <Link to={createPageUrl('LooksCatalog')} className={PRIMARY_BUTTON_CLASS}>
              <span>Смотреть все</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {readyLooks.map((look, idx) => (
              <ReadyLookCard key={look.slug} look={look} current={readyLookSlides[idx] || 0} onSelectSlide={(slideIdx) => setReadyLookSlides((prev) => prev.map((value, currentIdx) => (currentIdx === idx ? slideIdx : value)))} />
            ))}
          </div>
        </div>
      </section>
      <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-10 xl:px-20">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 rounded-[30px] border border-[#1E1E22] bg-[linear-gradient(180deg,#151519_0%,#101013_100%)] p-5 sm:p-7 lg:grid-cols-[300px_minmax(0,1fr)] lg:p-8">
          <div className="flex min-h-[320px] flex-col items-center justify-between rounded-[24px] border border-[#232329] bg-[#18181D] px-6 py-7 text-center">
            <div>
              <p className="text-[34px] font-semibold text-[#FAFAF9]">{AVITO_RATING}</p>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[#F4B400]">
                {Array.from({ length: 5 }).map((_, idx) => <Star key={`summary-star-${idx}`} className="h-8 w-8 fill-current" />)}
              </div>
            </div>
            <div>
              <p className="text-[30px] font-semibold tracking-[-0.8px] text-[#FAFAF9]">Avito</p>
              <p className="mt-3 text-sm text-[#8E8E95]">{AVITO_RATING_COUNT}</p>
            </div>
            <a href={AVITO_REVIEWS_URL} target="_blank" rel="noreferrer" className={PRIMARY_BUTTON_CLASS}>Смотреть отзывы</a>
          </div>

          <div className="flex flex-col gap-4">
            {activeReview ? (
              <article className="rounded-[24px] border border-[#2A2A2E] bg-[#F3F0EA] p-5 text-[#1C1C20] shadow-[0_14px_30px_rgba(0,0,0,0.18)] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 overflow-hidden rounded-full bg-[#D0D84A] text-[#FAFAF9]">
                      {activeReview.avatarUrl ? <img src={activeReview.avatarUrl} alt={activeReview.name || 'Покупатель'} loading="lazy" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{activeReview.name || 'Покупатель'}</p>
                      <div className="mt-2 flex items-center gap-1 text-[#F4B400]">
                        {Array.from({ length: 5 }).map((_, idx) => <Star key={`active-review-star-${idx}`} className={`h-4 w-4 ${idx < Number(activeReview.rating || 0) ? 'fill-current' : 'text-[#D2C9BA]'}`} />)}
                      </div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button type="button" onClick={() => activeReviews.length > 0 && setReviewIndex((prev) => (prev - 1 + activeReviews.length) % activeReviews.length)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D5CEC3] text-[#5E554B] transition-colors hover:border-[#8B5E3C] hover:text-[#8B5E3C]">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => activeReviews.length > 0 && setReviewIndex((prev) => (prev + 1) % activeReviews.length)} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#D5CEC3] text-[#5E554B] transition-colors hover:border-[#8B5E3C] hover:text-[#8B5E3C]">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-6 text-[28px] font-medium leading-tight tracking-[-0.5px] text-[#2A2420]">«{activeReview.product}»</p>
                <p className="mt-6 min-h-[96px] text-[18px] leading-8 text-[#3A342F]">
                  {expandedReviewMap[reviewIndex] || String(activeReview.text || '').length <= 160 ? String(activeReview.text || '') : `${String(activeReview.text || '').slice(0, 160)}...`}
                </p>
                {String(activeReview.text || '').length > 160 ? (
                  <button type="button" onClick={() => setExpandedReviewMap((prev) => ({ ...prev, [reviewIndex]: !prev[reviewIndex] }))} className="mt-3 text-sm font-medium text-[#8B5E3C] hover:text-[#6f4a2f]">
                    {expandedReviewMap[reviewIndex] ? 'Свернуть' : 'Читать полностью'}
                  </button>
                ) : null}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <a href={AVITO_REVIEWS_URL} target="_blank" rel="noreferrer" className="text-sm text-[#5E554B] underline-offset-4 hover:text-[#1C1C20] hover:underline">Отзыв Avito</a>
                  <div className="flex min-w-[220px] items-center gap-3">
                    <div className="h-px flex-1 bg-[#D8D2C7]" />
                    <div className="flex items-center gap-1.5">
                      {activeReviews.map((_, idx) => (
                        <button key={`review-dot-${idx}`} type="button" onClick={() => setReviewIndex(idx)} className={`h-1.5 rounded-full transition-all ${idx === reviewIndex ? 'w-12 bg-[#8B5E3C]' : 'w-2 bg-[#D8D2C7]'}`} aria-label={`Отзыв ${idx + 1}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a href={YANDEX_REVIEWS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-xl border border-[#2A2A2E] bg-[#18181D] px-4 py-3 text-[#FAFAF9] transition-colors hover:border-[#54A0C5]">
                <span className="text-sm font-medium text-[#C0B39F]">Москва</span>
                <span className="text-base font-semibold">{YANDEX_RATING}</span>
                <div className="flex items-center gap-0.5 text-[#F4B400]">
                  {Array.from({ length: 5 }).map((_, idx) => <Star key={`yandex-star-${idx}`} className="h-3.5 w-3.5 fill-current" />)}
                </div>
              </a>
              <a href={YANDEX_REVIEWS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-xl border border-[#2A2A2E] bg-[#18181D] px-4 py-3 text-[#FAFAF9] transition-colors hover:border-[#54A0C5]">
                <span className="text-sm font-medium text-[#C0B39F]">Яндекс Карты</span>
                <span className="text-sm text-[#A0A0A5]">{YANDEX_REVIEWS_COUNT}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 sm:pb-12 lg:px-10 xl:px-20">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 rounded-[28px] border border-[#1E1E22] bg-[linear-gradient(135deg,#121216_0%,#0d0d10_100%)] p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
          <div className="max-w-[560px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#54A0C5]">Telegram-канал</p>
            <h3 className="mt-4 whitespace-pre-line text-[34px] font-semibold uppercase leading-[1.04] tracking-[-1.4px] text-[#FAFAF9] sm:text-[46px]">Хотите узнавать{`\n`}о новых поступлениях{`\n`}раньше всех?</h3>
            <p className="mt-5 max-w-[420px] text-base leading-8 text-[#A0A0A5]">В канале раньше всех показываем свежие поступления, редкие позиции и коротко рассказываем, что уже приехало в шоурум.</p>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noreferrer" className={`${PRIMARY_BUTTON_CLASS} mt-7`}>
              <Send className="h-4 w-4" />
              Подписаться на Telegram
            </a>
          </div>

          <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noreferrer" className="relative ml-auto block w-full max-w-[520px] overflow-hidden rounded-[22px] border border-[#2A2A2E] bg-[#F4F1EA] text-[#171717] shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between border-b border-[#D9D2C7] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111114] text-sm font-semibold text-[#FAFAF9]">MT</div>
                <div>
                  <p className="text-[22px] font-medium leading-none text-[#8B5E3C]">Mototom</p>
                  <p className="mt-1 text-xs text-[#6C655B]">Telegram</p>
                </div>
              </div>
              <Send className="h-6 w-6 text-[#2CA5E0]" />
            </div>
            <img src={TELEGRAM_PREVIEW_IMAGE} alt="Telegram preview" className="h-[260px] w-full object-cover" />
            <div className="space-y-4 px-5 py-5">
              <p className="text-[15px] leading-8 text-[#1E1E22]">Скоро покажем новые шлемы, перчатки и куртки. Самые интересные позиции сначала публикуем в канале, а уже потом на сайте.</p>
              <p className="text-[15px] font-medium text-[#1E1E22]">#новинки #экипировка</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6C655B]">
                <span className="rounded-full bg-[#E8E0D2] px-3 py-1">8 огонь</span>
                <span className="rounded-full bg-[#E8E0D2] px-3 py-1">1 лайк</span>
                <span className="ml-auto text-xs">t.me/mototom</span>
              </div>
            </div>
          </a>
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
