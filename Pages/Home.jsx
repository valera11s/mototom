import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Headphones,
  RotateCcw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import Seo from '../src/components/Seo.jsx';
import avitoReviews from '../src/data/avitoReviews.json';
import { useMotoStore } from '../src/data/motoStore.jsx';
import { createPageUrl, createProductUrl, formatPrice } from '../src/utils.js';
import {
  DEFAULT_MARQUEE_PROMOS,
  HOME_CATEGORY_META,
  PRIMARY_BUTTON_CLASS,
  PRODUCT_BADGE_CLASS,
  SECONDARY_BUTTON_CLASS,
  parseMarqueePromos,
} from '../src/data/siteTheme.js';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1761903311461-854de9793ed6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    tag: 'НОВАЯ КОЛЛЕКЦИЯ 2026',
    title: 'Экипировка\nвысшего класса',
    subtitle: 'Премиальные шлемы, куртки и защита для райдеров, которые ценят качество, безопасность и стиль.',
    primary: 'Смотреть коллекцию',
    secondary: 'Каталог шлемов',
    secondaryHref: `${createPageUrl('Shop')}?category=${encodeURIComponent('Шлемы')}`,
  },
  {
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    tag: 'ГОРОДСКОЙ СЕЗОН',
    title: 'Городской комплект\nбез лишнего шума',
    subtitle: 'Точные посадки, понятные материалы и спокойный premium-визуал для ежедневных маршрутов.',
    primary: 'Смотреть коллекцию',
    secondary: 'Каталог курток',
    secondaryHref: `${createPageUrl('Shop')}?category=${encodeURIComponent('Куртки')}`,
  },
  {
    image: 'https://images.unsplash.com/photo-1471478331149-c72f17e33c73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
    tag: 'ДАЛЬНИЕ ПОЕЗДКИ',
    title: 'Комфорт и контроль\nна любой дистанции',
    subtitle: 'Шлемы, куртки и аксессуары для длинных поездок, когда важна каждая деталь комплекта.',
    primary: 'Смотреть коллекцию',
    secondary: 'Собрать образ',
    secondaryHref: createPageUrl('LooksCatalog'),
  },
];

const READY_LOOKS_FALLBACK = [
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
    ],
  },
  {
    slug: 'urban-warrior',
    name: 'Urban Warrior',
    slides: [
      {
        description: 'Городской сет с мягкой защитой',
        priceText: 'от 19 990 ₽',
        countText: '3 товара',
        image: 'https://images.unsplash.com/photo-1720211466012-dba5663d612d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
  {
    slug: 'night-cruiser',
    name: 'Night Cruiser',
    slides: [
      {
        description: 'Для быстрых вечерних выездов',
        priceText: 'от 32 490 ₽',
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
        priceText: 'от 28 990 ₽',
        countText: '4 товара',
        image: 'https://images.unsplash.com/photo-1758615590275-9a46daafc4f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    ],
  },
];

const TELEGRAM_CHANNEL_URL = 'https://t.me/+kpx4Cn3SqUNkODIy';
const TELEGRAM_PREVIEW_IMAGE = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200';
const AVITO_REVIEWS_URL = 'https://www.avito.ru/brands/i175353051?src=ratings';
const YANDEX_REVIEWS_URL = 'https://yandex.ru/maps/org/mototom/58026783026/reviews/';

const TRUST_ITEMS = [
  { title: 'Бесплатная доставка', subtitle: 'При заказе от 10 000 ₽', Icon: Truck },
  { title: 'Сертификация', subtitle: 'ECE и DOT стандарты', Icon: ShieldCheck },
  { title: 'Простой возврат', subtitle: '30 дней на возврат', Icon: RotateCcw },
  { title: 'Поддержка', subtitle: 'Райдеры помогают райдерам', Icon: Headphones },
];

const HOME_STYLES = `
.home-marquee-track { animation: home-marquee 28s linear infinite; }
.home-marquee-track:hover { animation-play-state: paused; }
@keyframes home-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.home-thumbs::-webkit-scrollbar { display: none; }
.home-thumbs { scrollbar-width: none; -ms-overflow-style: none; }
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

function buildReadyLooks(sets, products) {
  if (!Array.isArray(sets) || sets.length === 0) return READY_LOOKS_FALLBACK;

  return sets.slice(0, 4).map((setItem, idx) => {
    const items = (setItem.productIds || [])
      .map((id) => products.find((product) => String(product.id) === String(id)))
      .filter(Boolean);

    const slides = items.slice(0, 12).map((product) => ({
      description: product.name,
      priceText: `от ${formatPrice(product.price)} ₽`,
      countText: `${items.length} ${items.length === 1 ? 'товар' : items.length < 5 ? 'товара' : 'товаров'}`,
      image: product.image || product.image_url,
    }));

    return {
      slug: setItem.slug || `look-${idx}`,
      name: setItem.name || `Образ ${idx + 1}`,
      slides: slides.length > 0
        ? slides
        : [{
            description: setItem.description || 'Готовый образ',
            priceText: 'от 0 ₽',
            countText: '0 товаров',
            image: setItem.coverImage || READY_LOOKS_FALLBACK[idx % READY_LOOKS_FALLBACK.length].slides[0].image,
          }],
    };
  });
}

function mapProductCard(item) {
  return {
    productId: item.id,
    slug: item.slug || null,
    brand: item.brand || 'MOTOTOM',
    name: item.name,
    condition: item.condition || 'new',
    image: item.image || item.image_url,
    priceText: `${formatPrice(item.price || 0)} ₽`,
    ratingText: `${Number(item.rating || 4.8).toFixed(1)} (${item.reviews_count || 20} отз.)`,
  };
}

function SectionHeader({ title, actionLabel, actionHref, className = '' }) {
  return (
    <div className={`mb-5 flex items-center justify-between gap-4 md:mb-7 ${className}`}>
      <h2 className="text-[24px] font-bold tracking-[-0.03em] text-[#FAFAF9] md:text-[28px]">{title}</h2>
      {actionLabel && actionHref ? (
        <Link to={actionHref} className="inline-flex items-center gap-2 text-[13px] font-medium text-[#A0A0A5] transition-colors hover:text-[#FAFAF9]">
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function ThumbStrip({ items, activeIndex, onChange, className = '' }) {
  return (
    <div className={`home-thumbs flex gap-2 overflow-x-auto pr-8 ${className}`}>
      {items.map((item, idx) => (
        <button
          key={`${item.image}-${idx}`}
          type="button"
          onClick={() => onChange(idx)}
          className={`relative h-16 w-[84px] shrink-0 overflow-hidden rounded-lg border transition-all ${idx === activeIndex ? 'border-[#54A0C5]' : 'border-[#26262B]'}`}
        >
          <img src={item.image} alt="" className="h-full w-full object-cover" />
          {idx !== activeIndex ? <div className="absolute inset-0 bg-black/25" /> : null}
        </button>
      ))}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#16161A] to-transparent" />
    </div>
  );
}
function DesktopHero({ slide, index, setIndex }) {
  return (
    <section className="relative overflow-hidden border-b border-[#1E1E22]">
      <div className="relative h-[600px]">
        {HERO_SLIDES.map((item, idx) => (
          <img
            key={item.image}
            src={item.image}
            alt={item.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === index ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,13,15,0.9)_0%,rgba(13,13,15,0.6)_52%,rgba(13,13,15,0.8)_100%)]" />
        <div className="relative mx-auto h-full w-full max-w-[1440px]">
          <div className="absolute left-20 top-40 flex w-[600px] flex-col gap-6">
            <div className="inline-flex w-fit rounded-[4px] border border-[#54A0C560] bg-[#54A0C520] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#54A0C5]">
              {slide.tag}
            </div>
            <h1 className="whitespace-pre-line text-[48px] font-bold leading-[1.1] tracking-[-0.04em] text-[#FAFAF9]">
              {slide.title}
            </h1>
            <p className="max-w-[480px] text-[16px] leading-6 text-[#A0A0A5]">
              {slide.subtitle}
            </p>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Shop')} className={PRIMARY_BUTTON_CLASS}>
                <span>{slide.primary}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={slide.secondaryHref} className={SECONDARY_BUTTON_CLASS}>
                {slide.secondary}
              </Link>
            </div>
          </div>

          <div className="absolute bottom-[47px] left-20 flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setIndex(idx)}
                aria-label={`Слайд ${idx + 1}`}
                className={`h-[3px] rounded-[2px] ${idx === index ? 'bg-[#54A0C5]' : 'bg-[#FAFAF930]'}`}
                style={{ width: 24 }}
              />
            ))}
          </div>
          <div className="absolute bottom-[41px] right-20 text-[12px] font-medium tracking-[0.16em] text-[#A0A0A5]">
            {String(index + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileHero({ slide, index }) {
  return (
    <section className="relative overflow-hidden border-b border-[#1E1E22] md:hidden">
      <div className="relative h-[520px]">
        <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,15,0.76)_0%,rgba(13,13,15,0.38)_30%,rgba(13,13,15,0.94)_100%)]" />
        <div className="relative h-full">
          <div className="absolute left-6 top-[138px] flex w-[300px] flex-col gap-[18px]">
          <div className="inline-flex w-fit rounded-[4px] border border-[#54A0C560] bg-[#54A0C518] px-[10px] py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#54A0C5]">
            {slide.tag}
          </div>
          <h1 className="whitespace-pre-line text-[34px] font-bold leading-[1.1] tracking-[-0.04em] text-[#FAFAF9]">
            {slide.title}
          </h1>
          <p className="text-[14px] leading-[1.5] text-[#A0A0A5]">
            {slide.subtitle}
          </p>
          <div className="flex flex-col gap-3">
            <Link to={createPageUrl('Shop')} className={`${PRIMARY_BUTTON_CLASS} h-12`}>
              <span>{slide.primary}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to={slide.secondaryHref} className={`${SECONDARY_BUTTON_CLASS} h-11`}>
              {slide.secondary}
            </Link>
          </div>
          </div>
          <div className="absolute bottom-[31px] left-6 flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <span key={idx} className={`h-[3px] w-6 rounded-[2px] ${idx === index ? 'bg-[#54A0C5]' : 'bg-[#FAFAF930]'}`} />
            ))}
          </div>
          <div className="absolute bottom-[26px] right-6 text-[12px] font-medium tracking-[0.16em] text-[#A0A0A5]">
            {String(index + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
          </div>
        </div>
      </div>
    </section>
  );
}

function MarqueeBanner({ promos }) {
  return (
    <section className="overflow-hidden border-y border-[#1E1E22] bg-[#0A0A0C]">
      <div className="home-marquee-track flex min-w-max items-center gap-0 whitespace-nowrap py-[19px] md:py-[19px]">
        {[0, 1].map((loop) => (
          <div key={loop} className="flex shrink-0 items-center">
            <img src="/assets/brand-strip-combined.png" alt="Бренды" className="h-[24px] w-[660px] shrink-0 object-contain md:h-[30px] md:w-[825px]" />
            <img src="/assets/brand-strip-combined.png" alt="Бренды" className="h-[24px] w-[660px] shrink-0 object-contain md:h-[30px] md:w-[825px]" />
            <img src="/assets/brand-strip-combined.png" alt="Бренды" className="h-[24px] w-[660px] shrink-0 object-contain md:h-[30px] md:w-[825px]" />
            <span className="block h-px w-[36px] shrink-0" />
            <div className="flex shrink-0 items-center gap-3 pl-0">
              {promos.map((promo, idx) => (
                <span key={`${promo}-${idx}-${loop}`} className="inline-flex h-[30px] items-center rounded-full border border-[#1F2A36] bg-[#10141A] px-[14px] text-[11px] font-bold uppercase tracking-[0.12em] text-[#DDF6FF] md:text-[12px]">
                  {promo}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DesktopLookCard({ look }) {
  const slide = look.slides[0] || {};
  return (
    <Link to={createPageUrl('LooksCatalog')} className="group overflow-hidden rounded-[8px] border border-[#1E1E22] bg-[#16161A]">
      <div className="relative h-[320px] overflow-hidden">
        <img src={slide.image} alt={look.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.48)_100%)]" />
      </div>
      <div className="space-y-2 p-4">
        <div>
          <h3 className="text-[18px] font-semibold text-[#FAFAF9]">{look.name}</h3>
          <p className="mt-1 text-[13px] text-[#A0A0A5]">{slide.description}</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <p className="text-[18px] font-bold tracking-[-0.03em] text-[#FAFAF9]">{slide.priceText}</p>
          <p className="text-[13px] text-[#A0A0A5]">{slide.countText}</p>
        </div>
      </div>
    </Link>
  );
}

function MobileReadyLook({ looks, activeIndex, onChange }) {
  const currentLook = looks[activeIndex] || looks[0];
  const slide = currentLook?.slides?.[0];
  if (!currentLook || !slide) return null;

  const thumbItems = looks.map((look) => ({
    image: look.slides?.[0]?.image,
    name: look.name,
  })).filter((item) => item.image);

  return (
    <div className="rounded-xl border border-[#1E1E22] bg-[#16161A]">
      <div className="relative h-[260px] overflow-hidden rounded-t-xl">
        <img src={slide.image} alt={currentLook.name} className="h-full w-full object-cover" />
        <div className="absolute bottom-3 left-3 rounded-full bg-[#0D0D0FCC] px-3 py-1 text-[11px] font-semibold text-[#FAFAF9]">
          {activeIndex + 1} / {looks.length}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[#FAFAF9]">{currentLook.name}</p>
            <p className="mt-1 text-sm text-[#A0A0A5]">{slide.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[22px] font-bold tracking-[-0.03em] text-[#FAFAF9]">{slide.priceText}</p>
          <p className="text-xs text-[#A0A0A5]">{slide.countText}</p>
        </div>
        <div className="relative">
          <ThumbStrip items={thumbItems} activeIndex={activeIndex} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ item, compact = false }) {
  return (
    <Link to={`${createPageUrl('Shop')}?category=${encodeURIComponent(item.name)}`} className={`group overflow-hidden rounded-[14px] border border-[#1E1E22] bg-[#15161A] ${compact ? '' : 'min-w-[190px] flex-1'}`}>
      <div className={`overflow-hidden ${compact ? 'h-[110px]' : 'h-[132px]'}`}>
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-[15px] font-medium text-[#FAFAF9]">{item.name}</p>
          {!compact ? <p className="mt-1 text-[12px] text-[#8F8F96]">{item.description}</p> : null}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#7D7D84] transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
function DesktopProductCard({ item, badgeText, navigate, addToCart, getCartQuantity, getMaxAllowedQty }) {
  const condition = getConditionMeta(item.condition);
  const cartQty = getCartQuantity(item.productId, null);
  const maxAllowed = getMaxAllowedQty(item.productId);
  const canAdd = maxAllowed > cartQty;

  return (
    <article
      onClick={() => navigate(createProductUrl({ id: item.productId, slug: item.slug, name: item.name }))}
      className="group cursor-pointer overflow-hidden rounded-[12px] border border-[#1E1E22] bg-[#16161A]"
    >
      <div className="relative h-[320px] overflow-hidden">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        {badgeText ? (
          <span className="absolute left-3 top-3 rounded bg-[#54A0C5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FAFAF9]">
            {badgeText}
          </span>
        ) : null}
        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${condition.className}`}>
          {condition.label}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-[16px] font-medium text-[#FAFAF9]">{item.name}</p>
        <div className="flex items-center gap-1.5 text-xs text-[#A0A0A5]">
          <Star className="h-3.5 w-3.5 fill-[#54A0C5] text-[#54A0C5]" />
          <span>{item.ratingText}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[20px] font-bold text-[#FAFAF9]">{item.priceText}</p>
          <button
            type="button"
            disabled={!canAdd}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(item.productId, 1);
            }}
            className={`${PRIMARY_BUTTON_CLASS} h-10 px-4 py-0 text-[13px] ${!canAdd ? 'cursor-not-allowed opacity-55 hover:translate-y-0 hover:shadow-none' : ''}`}
          >
            <ShoppingBag className="h-4 w-4" />
            {canAdd ? 'В корзину' : 'Лимит'}
          </button>
        </div>
      </div>
    </article>
  );
}

function MobileProductShowcase({ title, actionLabel, actionHref, items, activeIndex, onChange, badgeText, navigate, addToCart, getCartQuantity, getMaxAllowedQty }) {
  const item = items[activeIndex] || items[0];
  if (!item) return null;
  const condition = getConditionMeta(item.condition);
  const cartQty = getCartQuantity(item.productId, null);
  const maxAllowed = getMaxAllowedQty(item.productId);
  const canAdd = maxAllowed > cartQty;

  return (
    <section className="px-4 py-8 md:hidden">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[24px] font-bold tracking-[-0.04em] text-[#FAFAF9]">{title}</h2>
        <Link to={actionHref} className="text-xs font-medium uppercase tracking-[0.14em] text-[#A0A0A5]">{actionLabel}</Link>
      </div>
      <article className="overflow-hidden rounded-xl border border-[#1E1E22] bg-[#16161A]">
        <div className="relative h-[260px] overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            onClick={() => navigate(createProductUrl({ id: item.productId, slug: item.slug, name: item.name }))}
          />
          {badgeText ? (
            <span className="absolute left-3 top-3 rounded bg-[#54A0C5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FAFAF9]">
              {badgeText}
            </span>
          ) : null}
          <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${condition.className}`}>
            {condition.label}
          </span>
          <div className="absolute bottom-3 left-3 rounded-full bg-[#0D0D0FCC] px-3 py-1 text-[11px] font-semibold text-[#FAFAF9]">
            {activeIndex + 1} / {items.length}
          </div>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-[18px] font-medium text-[#FAFAF9]">{item.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-[#A0A0A5]">
            <Star className="h-3.5 w-3.5 fill-[#54A0C5] text-[#54A0C5]" />
            <span>{item.ratingText}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[24px] font-bold tracking-[-0.03em] text-[#FAFAF9]">{item.priceText}</p>
            <button
              type="button"
              disabled={!canAdd}
              onClick={() => addToCart(item.productId, 1)}
              className={`${PRIMARY_BUTTON_CLASS} h-11 px-4 py-0 text-[13px] ${!canAdd ? 'cursor-not-allowed opacity-55 hover:translate-y-0 hover:shadow-none' : ''}`}
            >
              <ShoppingBag className="h-4 w-4" />
              {canAdd ? 'В корзину' : 'Лимит'}
            </button>
          </div>
          <div className="relative">
            <ThumbStrip items={items} activeIndex={activeIndex} onChange={onChange} />
          </div>
        </div>
      </article>
    </section>
  );
}

function DesktopReviews({ review }) {
  return (
    <section className="bg-[#0D0D0F] px-6 py-14 text-[#FAFAF9] md:px-10 xl:px-20">
      <div className="mx-auto max-w-[1440px]">
        <h2 className="text-center text-[36px] font-extrabold uppercase tracking-[0.12em] text-[#FFFFFF]">ЧТО ГОВОРЯТ НАШИ ПОКУПАТЕЛИ</h2>
        <div className="mt-12 grid grid-cols-[260px_1fr] gap-6">
          <div className="space-y-4">
            <div className="rounded-[12px] border border-[#1E1E22] bg-[#16161A] p-5 text-center">
              <p className="text-[28px] font-bold tracking-[-0.03em] text-[#FAFAF9]">5 из 5</p>
              <div className="mt-3 flex justify-center gap-1 text-[#FFB800]">
                {Array.from({ length: 5 }).map((_, idx) => <Star key={idx} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mt-4 text-sm text-[#A0A0A5]">На основе отзывов Avito</p>
            </div>
            <div className="rounded-[12px] border border-[#1E1E22] bg-[#16161A] p-5 text-center">
              <p className="text-[28px] font-bold tracking-[-0.03em] text-[#FAFAF9]">5.0</p>
              <div className="mt-3 flex justify-center gap-1 text-[#FFB800]">
                {Array.from({ length: 5 }).map((_, idx) => <Star key={`y-${idx}`} className="h-5 w-5 fill-current" />)}
              </div>
              <p className="mt-4 text-sm text-[#A0A0A5]">Яндекс Карты</p>
            </div>
          </div>
          <div>
            <article className="rounded-[12px] border border-[#1E1E22] bg-[#16161A] p-6">
              <div className="flex items-start gap-4">
                <img src={review.avatarUrl} alt={review.name} className="h-14 w-14 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-[18px] font-semibold text-[#FAFAF9]">{review.name}</p>
                  <div className="mt-2 flex items-center gap-1 text-[#FFB800]">
                    {Array.from({ length: review.rating || 5 }).map((_, idx) => <Star key={idx} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="mt-4 text-[20px] font-semibold tracking-[-0.03em] text-[#FAFAF9]">{review.product}</p>
                  <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[#A0A0A5]">{review.text}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#26262A] pt-5">
                <a href={review.reviewUrl || AVITO_REVIEWS_URL} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#FAFAF9] underline underline-offset-4">Отзыв Avito</a>
                <a href={YANDEX_REVIEWS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#111114] px-4 py-2 text-sm text-[#D4D4D8]">
                  <span className="font-semibold text-[#FAFAF9]">5.0</span>
                  <span>Яндекс</span>
                </a>
              </div>
            </article>
            <div className="mt-4 flex items-center gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#3A3A3E] text-[#FAFAF9]">‹</div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#3A3A3E] text-[#FAFAF9]">›</div>
              <div className="h-[3px] flex-1 rounded-full bg-[#2A2A2E]">
                <div className="h-full w-[18%] rounded-full bg-[#54A0C5]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileReviews({ review }) {
  return (
    <section className="space-y-4 px-4 py-8 md:hidden">
      <div className="grid grid-cols-2 gap-2">
        <a href={AVITO_REVIEWS_URL} target="_blank" rel="noreferrer" className="min-w-0 rounded-xl border border-[#1E1E22] bg-[#16161A] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#A0A0A5]">Avito</p>
          <div className="mt-2 flex items-center gap-2 text-[#FAFAF9]">
            <span className="text-[20px] font-bold">5.0</span>
            <div className="flex gap-0.5 text-[#FFB800]">{Array.from({ length: 5 }).map((_, idx) => <Star key={idx} className="h-3.5 w-3.5 fill-current" />)}</div>
          </div>
        </a>
        <a href={YANDEX_REVIEWS_URL} target="_blank" rel="noreferrer" className="min-w-0 rounded-xl border border-[#1E1E22] bg-[#16161A] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[#A0A0A5]">Яндекс</p>
          <div className="mt-2 flex items-center gap-2 text-[#FAFAF9]">
            <span className="text-[20px] font-bold">5.0</span>
            <div className="flex gap-0.5 text-[#FFB800]">{Array.from({ length: 5 }).map((_, idx) => <Star key={idx} className="h-3.5 w-3.5 fill-current" />)}</div>
          </div>
        </a>
      </div>
      <article className="min-w-0 overflow-hidden rounded-xl border border-[#1E1E22] bg-[#16161A] p-4">
        <div className="flex items-start gap-3">
          <img src={review.avatarUrl} alt={review.name} className="h-12 w-12 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#FAFAF9]">{review.name}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#54A0C5]">Avito</p>
              </div>
              <div className="flex gap-1 text-[#FFB800]">{Array.from({ length: review.rating || 5 }).map((_, idx) => <Star key={idx} className="h-3.5 w-3.5 fill-current" />)}</div>
            </div>
            <p className="mt-3 break-words text-sm font-medium text-[#FAFAF9]">{review.product}</p>
            <p className="mt-3 break-words text-sm leading-6 text-[#A0A0A5]">{review.text}</p>
          </div>
        </div>
        <a href={AVITO_REVIEWS_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-[#FAFAF9] underline underline-offset-4">Смотреть все отзывы</a>
      </article>
    </section>
  );
}
function TelegramSection() {
  return (
    <section className="px-6 py-14 md:px-10 xl:px-20">
      <div className="mx-auto max-w-[1440px]">
        <div className="rounded-[12px] border border-[#1E1E22] bg-[#111114] p-6 md:flex md:items-center md:gap-8 md:px-9 md:py-8">
          <div className="flex-1">
            <h2 className="text-[22px] font-extrabold uppercase leading-[1.3] tracking-[-0.02em] text-[#FFFFFF]">
              ЖЕЛАЕТЕ УЗНАВАТЬ{'\n'}О НОВЫХ ПОСТУПЛЕНИЯХ{'\n'}РАНЬШЕ ВСЕХ?
            </h2>
            <p className="mt-4 max-w-[420px] text-[13px] leading-[1.5] text-[#A0A0A5]">
              В Telegram-канале рассказываем о новых поступлениях и делимся новостями
            </p>
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-11 items-center justify-center rounded-[8px] border border-[#3A3A3E] px-6 text-[14px] font-medium text-[#FAFAF9]">
              Подписаться на Telegram
            </a>
          </div>
          <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noreferrer" className="mt-6 block w-full overflow-hidden rounded-[12px] border border-[#2A2A2E] bg-[#222226] md:mt-0 md:w-[320px]">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-black" />
                <div>
                  <p className="font-semibold text-[#FAFAF9]">Prizrak.shop</p>
                  <p className="text-xs text-[#7E7E84]">Telegram post preview</p>
                </div>
              </div>
              <Send className="h-5 w-5 text-[#54A0C5]" />
            </div>
            <img src={TELEGRAM_PREVIEW_IMAGE} alt="Telegram preview" className="h-[200px] w-full object-cover" />
            <div className="space-y-4 px-4 py-4">
              <p className="text-[15px] leading-7 text-[#FAFAF9]">Скоро можно будет выгулять новые перчатки и куртку в пути. Шлем и очки придется доставать самостоятельно.</p>
              <p className="text-[#54A0C5]">#новинки</p>
              <div className="flex items-center justify-between text-sm text-[#8D8D93]">
                <span>t.me/prizrakV2/449</span>
                <span>2.64K просмотров</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-[#1E1E22] bg-[#111114] px-4 py-10 sm:px-6 lg:px-10 xl:px-20">
      <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TRUST_ITEMS.map(({ title, subtitle, Icon }) => (
          <div key={title} className="rounded-[14px] border border-[#1E1E22] bg-[#15161A] p-5">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#54A0C51C] text-[#54A0C5]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[16px] font-semibold text-[#FAFAF9]">{title}</p>
                <p className="mt-1 text-sm text-[#A0A0A5]">{subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { products, sets, settings, addToCart, getCartQuantity, getMaxAllowedQty } = useMotoStore();
  const [heroIndex, setHeroIndex] = useState(0);
  const [readyLookIndex, setReadyLookIndex] = useState(0);
  const [helmetIndex, setHelmetIndex] = useState(0);
  const [jacketIndex, setJacketIndex] = useState(0);

  const marqueePromos = useMemo(() => {
    const raw = settings?.home_marquee_promos || settings?.homeMarqueePromos || settings?.marquee_promos;
    const parsed = Array.isArray(raw) ? raw : parseMarqueePromos(raw);
    return parsed.length > 0 ? parsed : DEFAULT_MARQUEE_PROMOS;
  }, [settings]);

  const readyLooks = useMemo(() => buildReadyLooks(sets, products), [sets, products]);

  const categoryCards = useMemo(() => {
    return Object.values(HOME_CATEGORY_META).map((item) => ({
      ...item,
      key: normalizeCategoryName(item.name),
    }));
  }, []);

  const featuredHelmets = useMemo(() => {
    return products
      .filter((item) => normalizeCategoryName(item.category) === 'helmets')
      .slice(0, 4)
      .map(mapProductCard);
  }, [products]);

  const featuredJackets = useMemo(() => {
    return products
      .filter((item) => normalizeCategoryName(item.category) === 'jackets')
      .slice(0, 4)
      .map(mapProductCard);
  }, [products]);

  const fallbackFeatured = useMemo(() => {
    const cards = products.slice(0, 8).map(mapProductCard);
    return {
      helmets: featuredHelmets.length > 0 ? featuredHelmets : cards.slice(0, 4),
      jackets:
        featuredJackets.length > 0
          ? featuredJackets
          : cards.slice(4, 8).length > 0
            ? cards.slice(4, 8)
            : cards.slice(0, 4),
    };
  }, [products, featuredHelmets, featuredJackets]);

  const review = avitoReviews[0] || {
    name: 'Покупатель',
    rating: 5,
    product: 'Отзыв о магазине',
    text: 'Отличный магазин с понятным сервисом и хорошей консультацией.',
    avatarUrl: '/logo.png',
    reviewUrl: AVITO_REVIEWS_URL,
  };

  const currentLook = readyLooks[readyLookIndex] || readyLooks[0] || READY_LOOKS_FALLBACK[0];
  const currentHero = HERO_SLIDES[heroIndex];

  return (
    <>
      <Seo
        title="Премиальная мотоэкипировка"
        description="Шлемы, куртки, перчатки, ботинки и готовые образы для райдеров. Каталог премиальной мотоэкипировки MOTOTOM."
        image={currentHero.image}
      />
      <style>{HOME_STYLES}</style>

      <div className="hidden md:block">
        <DesktopHero slide={currentHero} index={heroIndex} setIndex={setHeroIndex} />
      </div>
      <MobileHero slide={currentHero} index={heroIndex} />

      <MarqueeBanner promos={marqueePromos} />

      <section className="hidden px-6 py-16 md:block md:px-10 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeader title="Готовые образы" actionLabel="Все образы" actionHref={createPageUrl('LooksCatalog')} />
          <div className="grid grid-cols-4 gap-5">
            {readyLooks.slice(0, 4).map((look) => <DesktopLookCard key={look.slug} look={look} />)}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:hidden">
        <SectionHeader title="Готовые образы" actionLabel="Все образы" actionHref={createPageUrl('LooksCatalog')} className="mb-4" />
        <MobileReadyLook looks={readyLooks} activeIndex={readyLookIndex} onChange={setReadyLookIndex} />
      </section>

      <section className="px-6 py-10 md:px-10 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeader title="Категории товаров" actionLabel="Все категории" actionHref={createPageUrl('Shop')} />
          <div className="hidden gap-4 md:flex">
            {categoryCards.map((item) => <CategoryCard key={item.key} item={item} />)}
          </div>
          <div className="grid grid-cols-2 gap-3 md:hidden">
            {categoryCards.map((item) => <CategoryCard key={item.key} item={item} compact />)}
          </div>
        </div>
      </section>

      <section className="hidden px-6 py-8 md:block md:px-10 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeader title="Популярные шлемы" actionLabel="Все шлемы" actionHref={`${createPageUrl('Shop')}?category=${encodeURIComponent('Шлемы')}`} />
          <div className="grid grid-cols-4 gap-5">
            {fallbackFeatured.helmets.slice(0, 4).map((item, idx) => (
              <DesktopProductCard
                key={item.productId}
                item={item}
                badgeText={idx === 0 ? 'Хит' : idx === 2 ? 'Новинка' : ''}
                navigate={navigate}
                addToCart={addToCart}
                getCartQuantity={getCartQuantity}
                getMaxAllowedQty={getMaxAllowedQty}
              />
            ))}
          </div>
        </div>
      </section>

      <MobileProductShowcase
        title="Популярные шлемы"
        actionLabel="Все шлемы"
        actionHref={`${createPageUrl('Shop')}?category=${encodeURIComponent('Шлемы')}`}
        items={fallbackFeatured.helmets}
        activeIndex={helmetIndex}
        onChange={setHelmetIndex}
        badgeText="Хит"
        navigate={navigate}
        addToCart={addToCart}
        getCartQuantity={getCartQuantity}
        getMaxAllowedQty={getMaxAllowedQty}
      />

      <section className="hidden px-6 py-8 md:block md:px-10 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <SectionHeader title="Популярные мотокуртки" actionLabel="Все мотокуртки" actionHref={`${createPageUrl('Shop')}?category=${encodeURIComponent('Куртки')}`} />
          <div className="grid grid-cols-4 gap-5">
            {fallbackFeatured.jackets.slice(0, 4).map((item, idx) => (
              <DesktopProductCard
                key={item.productId}
                item={item}
                badgeText={idx === 0 ? 'Хит продаж' : idx === 1 ? 'Новинка' : ''}
                navigate={navigate}
                addToCart={addToCart}
                getCartQuantity={getCartQuantity}
                getMaxAllowedQty={getMaxAllowedQty}
              />
            ))}
          </div>
        </div>
      </section>

      <MobileProductShowcase
        title="Популярные мотокуртки"
        actionLabel="Все мотокуртки"
        actionHref={`${createPageUrl('Shop')}?category=${encodeURIComponent('Куртки')}`}
        items={fallbackFeatured.jackets}
        activeIndex={jacketIndex}
        onChange={setJacketIndex}
        badgeText="Хит продаж"
        navigate={navigate}
        addToCart={addToCart}
        getCartQuantity={getCartQuantity}
        getMaxAllowedQty={getMaxAllowedQty}
      />

      <div className="hidden md:block">
        <DesktopReviews review={review} />
      </div>
      <MobileReviews review={review} />

      <TelegramSection />
      <TrustBar />
    </>
  );
}
