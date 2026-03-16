import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { createPageUrl, formatPrice } from './utils.js';
import { useMotoStore } from './data/motoStore.jsx';
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from './data/siteTheme.js';
import logoTransparent from '../LOGO-transparent.png';

const DESKTOP_NAV = [
  { label: 'Шлемы', href: `${createPageUrl('Shop')}?category=${encodeURIComponent('Шлемы')}` },
  { label: 'Куртки', href: `${createPageUrl('Shop')}?category=${encodeURIComponent('Куртки')}` },
  { label: 'Перчатки', href: `${createPageUrl('Shop')}?category=${encodeURIComponent('Перчатки')}` },
  { label: 'Ботинки', href: `${createPageUrl('Shop')}?category=${encodeURIComponent('Ботинки')}` },
  { label: 'Защита', href: `${createPageUrl('Shop')}?category=${encodeURIComponent('Защита')}` },
  { label: 'Аксессуары', href: `${createPageUrl('Shop')}?category=${encodeURIComponent('Аксессуары')}` },
];

const FOOTER_CATEGORY_LINKS = ['Каталог', 'Шлемы', 'Мотокуртки', 'Перчатки', 'Ботинки', 'Защита'];
const FOOTER_INFO_LINKS = ['О нас', 'Возврат', 'Доставка', 'Контакты', 'Размеры'];
const FOOTER_SOCIALS = ['Telegram', 'Avito', 'VK'];

export default function MotoLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, cartDetailed, subtotal, shipping, total, updateCartQuantity, removeFromCart, getMaxAllowedQty } = useMotoStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState(null);
  const hideTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onCartAdd = (event) => {
      const productName = event?.detail?.productName || 'Товар';
      const quantity = Math.max(1, Number(event?.detail?.quantity || 1));
      setCartNotice({ productName, quantity, show: false });

      const animateIn = () => setCartNotice((prev) => (prev ? { ...prev, show: true } : prev));
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(animateIn);
      } else {
        setTimeout(animateIn, 0);
      }

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setCartNotice((prev) => (prev ? { ...prev, show: false } : prev));
      }, 1600);
      clearTimerRef.current = setTimeout(() => setCartNotice(null), 1950);
    };

    window.addEventListener('mototom:cart:add', onCartAdd);
    return () => {
      window.removeEventListener('mototom:cart:add', onCartAdd);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const goCheckout = () => {
    setCartOpen(false);
    navigate(createPageUrl('Checkout'));
  };

  if (
    location.pathname.startsWith('/admin') ||
    location.pathname === createPageUrl('Checkout') ||
    location.pathname === createPageUrl('OrderStatus')
  ) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-[#1E1E22] bg-[#0D0D0F]/95 backdrop-blur-sm">
        <div className="mx-auto hidden h-20 w-full max-w-[1440px] items-center justify-between gap-6 px-10 xl:flex xl:px-20">
          <Link to={createPageUrl('Home')} className="shrink-0">
            <img src={logoTransparent} alt="MOTOTOM" className="h-[34px] w-auto object-contain" />
          </Link>

          <nav className="flex min-w-0 items-center gap-7 text-[14px] font-medium text-[#D4D4D8]">
            {DESKTOP_NAV.map((item) => (
              <Link key={item.label} to={item.href} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-[#FAFAF9]">
            <button type="button" aria-label="Поиск" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#26262A] bg-[#15161A]">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Профиль" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#26262A] bg-[#15161A]">
              <User className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setCartOpen(true)} aria-label="Корзина" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#26262A] bg-[#15161A]">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#54A0C5] px-1 text-[10px] font-semibold text-[#FAFAF9]">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="flex h-[72px] items-center justify-between px-4 xl:hidden">
          <Link to={createPageUrl('Home')} className="text-[26px] font-black tracking-[-0.08em] text-[#FAFAF9]">
            MOTOTOM
          </Link>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCartOpen(true)} aria-label="Корзина" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#26262A] bg-[#15161A]">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#54A0C5] px-1 text-[10px] font-semibold text-[#FAFAF9]">
                  {cartCount}
                </span>
              ) : null}
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Меню" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#26262A] bg-[#15161A]">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/60 xl:hidden" onClick={() => setMobileMenuOpen(false)}>
          <nav className="absolute right-0 top-0 flex h-full w-[280px] flex-col bg-[#111114] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-[22px] font-black tracking-[-0.08em] text-[#FAFAF9]">MOTOTOM</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Закрыть">
                <X className="h-5 w-5 text-[#A0A0A5]" />
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-5">
              {DESKTOP_NAV.map((item) => (
                <Link key={item.label} to={item.href} className="text-[16px] font-medium text-[#D4D4D8]">
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}

      <main>{children}</main>

      {cartNotice ? (
        <div className={`fixed right-3 top-3 z-[70] w-[calc(100vw-1.5rem)] max-w-[360px] rounded-lg border border-[#2A2A2E] bg-[#111114] p-4 shadow-2xl transition-all duration-300 ${cartNotice.show ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}>
          <div className="flex items-start gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#32D58325]">
              <div className="absolute inset-0 rounded-md animate-ping bg-[#32D58322]" />
              <Check className="relative h-4 w-4 text-[#32D583]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-[#FAFAF9]">Товар добавлен в корзину</p>
              <p className="mt-1 truncate text-[12px] font-normal text-[#A0A0A5]">
                {cartNotice.productName} · {cartNotice.quantity} шт.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <footer id="footer" className="bg-[#0A0A0C] px-4 pb-8 pt-12 md:px-6 xl:px-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="bg-[linear-gradient(180deg,rgba(84,160,197,0.08)_0%,rgba(10,10,12,0)_100%)] px-0 pb-10 pt-6">
            <div className="overflow-hidden text-[52px] font-black leading-none tracking-[-0.08em] text-transparent [background:linear-gradient(90deg,#BFEFFF_0%,#54A0C5_52%,#2F5E84_100%)] [background-clip:text] [-webkit-background-clip:text] md:text-[110px] xl:text-[188px]">
              MOTOTOM
            </div>

            <p className="mt-4 max-w-[560px] text-sm leading-7 text-[#8D8D93] md:text-[15px]">
              Премиальная мотоэкипировка для райдеров, которые ценят качество, безопасность и инженерную точность.
            </p>

            <div className="mt-8 hidden space-y-3 xl:block">
              <div className="flex flex-wrap gap-3">
                {FOOTER_CATEGORY_LINKS.map((item) => (
                  <span key={item} className="inline-flex min-h-[42px] items-center rounded-full border border-[#54A0C53D] bg-[#111318] px-4 text-sm font-medium text-[#EAF8FF]">
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {FOOTER_INFO_LINKS.map((item) => (
                  <span key={item} className="inline-flex min-h-[42px] items-center rounded-full border border-[#2A2A2E] bg-[#131418] px-4 text-sm font-medium text-[#D3D3D7]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 xl:hidden">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8D8D93]">Категории</p>
                <div className="grid grid-cols-2 gap-2">
                  {FOOTER_CATEGORY_LINKS.map((item) => (
                    <span key={item} className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-[#54A0C53D] bg-[#111318] px-3 text-sm font-medium text-[#EAF8FF]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#8D8D93]">Информация</p>
                <div className="grid grid-cols-2 gap-2">
                  {FOOTER_INFO_LINKS.map((item) => (
                    <span key={item} className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-[#2A2A2E] bg-[#131418] px-3 text-sm font-medium text-[#D3D3D7]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-[#1E1E22] pt-6 text-xs text-[#5F5F65] md:flex-row md:items-center md:justify-between">
              <p>© 2026 Mototom. Все права защищены.</p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {FOOTER_SOCIALS.map((item, idx) => (
                  <span
                    key={item}
                    className={`inline-flex min-h-[38px] items-center rounded-full border px-4 text-sm font-medium ${
                      idx === 0
                        ? 'border-[#54A0C53D] bg-[#111826] text-[#BFEFFF]'
                        : idx === 1
                          ? 'border-[#4C4252] bg-[#17151B] text-[#F4EDF7]'
                          : 'border-[#323947] bg-[#14161D] text-[#DDEBFF]'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {cartOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setCartOpen(false)}>
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-[#1E1E22] bg-[#111114]" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-16 items-center justify-between border-b border-[#1E1E22] px-6">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-[#FAFAF9]">Корзина</h2>
                <span className="rounded-full bg-[#54A0C530] px-2 py-0.5 text-[10px] text-[#54A0C5]">{cartCount} товара</span>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} className="text-[#A0A0A5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {cartDetailed.length === 0 ? <p className="text-sm text-[#A0A0A5]">Корзина пуста</p> : null}
              {cartDetailed.map((entry) => (
                <div key={entry.key} className="space-y-5">
                  <div className="flex gap-4">
                    <img src={entry.product.image} alt={entry.product.name} className="h-20 w-20 rounded-md object-cover" />
                    <div className="flex flex-1 flex-col gap-2">
                      <p className="text-sm text-[#FAFAF9]">{entry.product.name}</p>
                      <p className="text-xs text-[#A0A0A5]">Размер: {entry.size || 'M'} · {entry.product.brand}</p>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-md border border-[#2A2A2E] px-2 py-1 text-xs text-[#FAFAF9]">
                          <button type="button" onClick={() => updateCartQuantity(entry.key, entry.quantity - 1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span>{entry.quantity}</span>
                          <button type="button" disabled={entry.quantity >= getMaxAllowedQty(entry.product.id)} onClick={() => updateCartQuantity(entry.key, entry.quantity + 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm text-[#FAFAF9]">{formatPrice(entry.lineTotal)} ₽</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFromCart(entry.key)} className="text-[#A0A0A5]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="h-px bg-[#1E1E22]" />
                </div>
              ))}
            </div>

            <div className="space-y-4 border-t border-[#1E1E22] p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0A0A5]">Подытог</span>
                <span className="text-[#FAFAF9]">{formatPrice(subtotal)} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0A0A5]">Доставка</span>
                <span className="text-[#32D583]">{shipping === 0 ? 'Бесплатно' : `${formatPrice(shipping)} ₽`}</span>
              </div>
              <div className="h-px bg-[#1E1E22]" />
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#FAFAF9]">Итого</span>
                <span className="text-[18px] font-bold text-[#FAFAF9]">{formatPrice(total)} ₽</span>
              </div>
              <button type="button" onClick={goCheckout} className={`${PRIMARY_BUTTON_CLASS} h-12 w-full`}>
                Оформить заказ <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setCartOpen(false)} className={`${SECONDARY_BUTTON_CLASS} h-10 w-full text-[13px] text-[#A0A0A5]`}>
                Продолжить покупки
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
