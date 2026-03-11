import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Instagram, Twitter, Youtube, X, ArrowRight, Menu, Phone, User, Check, Plus, Minus, Trash2 } from 'lucide-react';
import { createPageUrl, formatPrice } from './utils.js';
import { useMotoStore } from './data/motoStore.jsx';

export default function MotoLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount, cartDetailed, subtotal, shipping, total, updateCartQuantity, removeFromCart, getMaxAllowedQty } = useMotoStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState(null);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackSending, setCallbackSending] = useState(false);
  const [callbackForm, setCallbackForm] = useState({ name: '', phone: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hideTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const goCheckout = () => {
    setCartOpen(false);
    navigate(createPageUrl('Checkout'));
  };

  const sendCallbackRequest = async () => {
    const name = callbackForm.name.trim();
    const phone = callbackForm.phone.trim();
    if (!name || !phone) return;

    try {
      setCallbackSending(true);
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
      const response = await fetch(`${apiBase}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: '',
          message_type: 'callback',
          message: `Заказ звонка. Телефон: ${phone}`,
        }),
      });
      if (!response.ok) throw new Error('Ошибка отправки');
      setCallbackOpen(false);
      setCallbackForm({ name: '', phone: '' });
    } catch (error) {
      console.error('Callback request error:', error);
      alert('Не удалось отправить заявку. Попробуйте еще раз.');
    } finally {
      setCallbackSending(false);
    }
  };

  useEffect(() => {
    const onCartAdd = (event) => {
      const productName = event?.detail?.productName || 'Товар';
      const quantity = Math.max(1, Number(event?.detail?.quantity || 1));
      setCartNotice({ productName, quantity, show: false });
      const animateIn = () => {
        setCartNotice((prev) => (prev ? { ...prev, show: true } : prev));
      };
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

      clearTimerRef.current = setTimeout(() => {
        setCartNotice(null);
      }, 1950);
    };

    window.addEventListener('mototom:cart:add', onCartAdd);
    return () => {
      window.removeEventListener('mototom:cart:add', onCartAdd);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  if (
    location.pathname.startsWith('/admin') ||
    location.pathname === createPageUrl('Checkout') ||
    location.pathname === createPageUrl('OrderStatus')
  ) {
    return <>{children}</>;
  }

  const isShop = location.pathname === createPageUrl('Shop');
  const isLooks = location.pathname === createPageUrl('LooksCatalog') || location.pathname.startsWith(createPageUrl('ReadySet'));

  const navLinks = [
    { to: createPageUrl('Shop'), label: '\u041a\u0430\u0442\u0430\u043b\u043e\u0433', active: isShop },
    { to: createPageUrl('LooksCatalog'), label: '\u041e\u0431\u0440\u0430\u0437\u044b', active: isLooks },
    { to: createPageUrl('About'), label: '\u041e \u043d\u0430\u0441', active: location.pathname === createPageUrl('About') },
    { to: createPageUrl('Contacts'), label: '\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b', active: location.pathname === createPageUrl('Contacts') },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-slate-100">
      {/* Header */}
      <header className="border-b border-[#1E1E22] bg-[#0D0D0F]">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 md:h-20 md:px-8 lg:px-12">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-white">
            <img src="/-3.png.webp" alt="MOTOTOM logo" className="h-9 w-9 object-contain md:h-[60px] md:w-[60px] lg:h-[72px] lg:w-[72px]" />
            <span className="text-[16px] font-bold tracking-[0.18em] md:text-[18px] lg:text-[20px]">MOTOTOM</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 lg:flex xl:gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-[14px] font-medium ${link.active ? 'text-[#54A0C5]' : 'text-slate-300 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="hidden items-center gap-4 text-slate-400 lg:flex xl:gap-6">
            <a href="tel:+74951299077" className="text-[13px] font-medium text-[#A0A0A5] hover:text-white">
              +7 (495) 129-90-77
            </a>
            <button
              type="button"
              onClick={() => setCallbackOpen(true)}
              className="text-[14px] font-medium text-slate-300 hover:text-white"
            >{'\u0417\u0430\u043a\u0430\u0437\u0430\u0442\u044c \u0437\u0432\u043e\u043d\u043e\u043a'}</button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative"
              aria-label={'\u041a\u043e\u0440\u0437\u0438\u043d\u0430'}
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#54A0C5] text-[10px] font-semibold text-[#FAFAF9]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile right actions */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label={'\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e'}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300"
            >
              <Menu className="h-5 w-5 text-slate-300" />
              <span>{'\u041c\u0435\u043d\u044e'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative"
              aria-label={'\u041a\u043e\u0440\u0437\u0438\u043d\u0430'}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#54A0C5] text-[10px] font-semibold text-[#FAFAF9]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav
            className="absolute right-0 top-0 flex h-full w-[280px] flex-col bg-[#111114] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-bold tracking-[0.18em] text-[#FAFAF9]">MOTOTOM</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label={'\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e'}>
                <X className="h-5 w-5 text-[#A0A0A5]" />
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-[16px] font-medium ${link.active ? 'text-[#54A0C5]' : 'text-slate-300'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4 border-t border-[#1E1E22] pt-6">
              <a href="tel:+74951299077" className="text-[14px] font-medium text-[#A0A0A5]">
                +7 (495) 129-90-77
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCallbackOpen(true);
                }}
                className="text-left text-[14px] font-medium text-slate-300"
              >{'\u0417\u0430\u043a\u0430\u0437\u0430\u0442\u044c \u0437\u0432\u043e\u043d\u043e\u043a'}</button>
            </div>
          </nav>
        </div>
      )}

      <main>{children}</main>

      {/* Cart notice */}
      {cartNotice && (
        <div
          className={`fixed right-3 top-3 z-[70] w-[calc(100vw-1.5rem)] max-w-[360px] rounded-lg border border-[#2A2A2E] bg-[#111114] p-4 shadow-2xl transition-all duration-300 ${
            cartNotice.show ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
          }`}
        >
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
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCartOpen(true);
                    setCartNotice(null);
                  }}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-[#54A0C5] px-3 text-[12px] font-medium text-[#FAFAF9]"
                >
                  В корзину
                </button>
                <button
                  type="button"
                  onClick={() => setCartNotice((prev) => (prev ? { ...prev, show: false } : prev))}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-[#2A2A2E] px-3 text-[12px] font-medium text-[#A0A0A5]"
                >
                  Закрыть
                </button>
              </div>
              <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-[#2A2A2E]">
                <div className="h-full w-full rounded-full bg-[#32D583] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer id="footer" className="bg-[#0A0A0C] px-4 pb-8 pt-10 md:px-8 lg:px-20">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 md:gap-12">
          <div className="w-full overflow-hidden text-center text-[52px] font-black leading-none tracking-[8px] text-[#808080] sm:text-[80px] sm:tracking-[12px] lg:text-[140px] lg:tracking-[20px]">
            MOTOTOM
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-[280px_1fr_1fr_1fr_1fr] lg:gap-8">
            <div className="col-span-2 text-[13px] font-normal leading-[1.6] text-[#6B6B70] sm:col-span-3 lg:col-span-1">
              Премиальная мотоэкипировка для райдеров, которые ценят качество, безопасность и инженерную точность.
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              <p className="font-semibold tracking-[1px] text-[#FAFAF9]">Магазин</p>
              <div className="flex flex-col gap-3 text-[#6B6B70]">
                <p>Шлемы</p><p>Куртки</p><p>Перчатки</p><p>Ботинки</p><p>Защита</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              <p className="font-semibold tracking-[1px] text-[#FAFAF9]">Компания</p>
              <div className="flex flex-col gap-3 text-[#6B6B70]">
                <p>О нас</p><p>Вакансии</p><p>Пресса</p><p>Блог</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              <p className="font-semibold tracking-[1px] text-[#FAFAF9]">Помощь</p>
              <div className="flex flex-col gap-3 text-[#6B6B70]">
                <p>Центр поддержки</p><p>Доставка</p><p>Возвраты</p><p>Таблица размеров</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              <p className="font-semibold tracking-[1px] text-[#FAFAF9]">Правовая информация</p>
              <div className="flex flex-col gap-3 text-[#6B6B70]">
                <p>Политика конфиденциальности</p><p>Условия использования</p><p>Политика cookies</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#1E1E22] pt-6 text-xs text-[#4A4A50] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MotoTom. Все права защищены.</p>
            <div className="flex items-center gap-4">
              <Instagram className="h-[18px] w-[18px]" />
              <Twitter className="h-[18px] w-[18px]" />
              <Youtube className="h-[18px] w-[18px]" />
            </div>
          </div>
        </div>
      </footer>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setCartOpen(false)}>
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-[#1E1E22] bg-[#111114]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-[#1E1E22] px-6">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold text-[#FAFAF9]">Корзина</h2>
                <span className="rounded-full bg-[#54A0C530] px-2 py-0.5 text-[10px] text-[#54A0C5]">
                  {cartCount} товара
                </span>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} className="text-[#A0A0A5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {cartDetailed.length === 0 && <p className="text-sm text-[#A0A0A5]">Корзина пуста</p>}
              {cartDetailed.map((entry) => (
                <div key={entry.key} className="space-y-5">
                  <div className="flex gap-4">
                    <img
                      src={entry.product.image}
                      alt={entry.product.name}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-2">
                      <p className="text-sm text-[#FAFAF9]">{entry.product.name}</p>
                      <p className="text-xs text-[#A0A0A5]">
                        Размер: {entry.size || 'M'} · {entry.product.brand}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-md border border-[#2A2A2E] px-2 py-1 text-xs text-[#FAFAF9]">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(entry.key, entry.quantity - 1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span>{entry.quantity}</span>
                          <button
                            type="button"
                            disabled={entry.quantity >= getMaxAllowedQty(entry.product.id)}
                            onClick={() => updateCartQuantity(entry.key, entry.quantity + 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm text-[#FAFAF9]">{formatPrice(entry.lineTotal)} ₽</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(entry.key)}
                      className="text-[#A0A0A5]"
                    >
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
                <span className="text-[#32D583]">
                  {shipping === 0 ? 'Бесплатно' : `${formatPrice(shipping)} ₽`}
                </span>
              </div>
              <div className="h-px bg-[#1E1E22]" />
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#FAFAF9]">Итого</span>
                <span className="text-[18px] font-bold text-[#FAFAF9]">{formatPrice(total)} ₽</span>
              </div>
              <button
                type="button"
                onClick={goCheckout}
                className="flex h-12 w-full items-center justify-center gap-2 rounded bg-[#54A0C5] text-sm font-semibold text-[#FAFAF9]"
              >
                Оформить заказ <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="h-10 w-full text-[13px] font-medium text-[#A0A0A5]"
              >
                Продолжить покупки
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Callback modal */}
      {callbackOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setCallbackOpen(false)}
        >
          <div
            className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#2A2A2E] bg-[#111114] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-[#54A0C52b] blur-2xl" />
            <div className="pointer-events-none absolute -left-12 -bottom-14 h-40 w-40 rounded-full bg-[#54A0C51f] blur-2xl" />
            <span className="relative inline-flex items-center rounded-full border border-[#54A0C560] bg-[#54A0C520] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#9dd7ef]">
              CALLBACK
            </span>
            <h3 className="relative mt-3 text-[24px] font-bold text-[#FAFAF9]">Закажите звонок</h3>
            <p className="relative mt-1 text-[13px] leading-relaxed text-[#A0A0A5]">
              Оставьте контакты, и менеджер перезвонит в ближайшее время. Поможем с выбором и ответим на вопросы.
            </p>

            <div className="mt-4 space-y-3">
              <label className="relative block">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d7d84]" />
                <input
                  type="text"
                  value={callbackForm.name}
                  onChange={(e) => setCallbackForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ваше имя"
                  className="h-11 w-full rounded-lg border border-[#2A2A2E] bg-[#16161A] pl-10 pr-3 text-sm text-[#FAFAF9] placeholder:text-[#6B6B70] outline-none focus:border-[#54A0C5]"
                />
              </label>
              <label className="relative block">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d7d84]" />
                <input
                  type="tel"
                  value={callbackForm.phone}
                  onChange={(e) => setCallbackForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Телефон"
                  className="h-11 w-full rounded-lg border border-[#2A2A2E] bg-[#16161A] pl-10 pr-3 text-sm text-[#FAFAF9] placeholder:text-[#6B6B70] outline-none focus:border-[#54A0C5]"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCallbackOpen(false)}
                className="h-10 rounded-lg border border-[#2A2A2E] px-4 text-sm font-medium text-[#A0A0A5]"
              >
                Позже
              </button>
              <button
                type="button"
                disabled={callbackSending || !callbackForm.name.trim() || !callbackForm.phone.trim()}
                onClick={sendCallbackRequest}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#54A0C5] px-4 text-sm font-medium text-[#FAFAF9] disabled:opacity-60"
              >
                {callbackSending ? 'Отправка...' : 'Создать заявку'}
                {!callbackSending ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

