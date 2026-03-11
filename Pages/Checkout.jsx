import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check, Store, Package, Bike, MapPin, ShoppingBag, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl, formatPrice } from '../src/utils.js';
import { useMotoStore } from '../src/data/motoStore.jsx';
import Seo from '../src/components/Seo.jsx';

function generateOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `MT-${stamp}-${random}`;
}

const DELIVERY_OPTIONS = [
  { key: 'pickup', title: 'Самовывоз из магазина', subtitle: 'Москва, сегодня', Icon: Store },
  { key: 'tk', title: 'Доставка по Москве и России ТК', subtitle: 'Стоимость озвучит менеджер', Icon: Package },
  { key: 'courier', title: 'Курьер по г. Москве и МО', subtitle: 'Стоимость озвучит менеджер', Icon: Bike },
];

function normalizeRuPhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('8')) return `7${digits.slice(1, 11)}`;
  if (digits.startsWith('7')) return digits.slice(0, 11);
  return `7${digits}`.slice(0, 11);
}

function formatRuPhone(value) {
  const digits = normalizeRuPhoneDigits(value);
  if (!digits) return '';
  const c1 = digits.slice(1, 4);
  const c2 = digits.slice(4, 7);
  const c3 = digits.slice(7, 9);
  const c4 = digits.slice(9, 11);
  let out = '+7';
  if (c1) out += ` (${c1}`;
  if (c1.length === 3) out += ')';
  if (c2) out += ` ${c2}`;
  if (c3) out += `-${c3}`;
  if (c4) out += `-${c4}`;
  return out;
}

function isValidRuPhone(value) {
  return normalizeRuPhoneDigits(value).length === 11;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartDetailed, subtotal, shipping, clearCart, createOrder } = useMotoStore();
  const [sending, setSending] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [personalDataConsent, setPersonalDataConsent] = useState(false);
  const [form, setForm] = useState({
    name: 'Иван',
    phone: '',
    email: '',
    address: 'ул. Пушкина, д. 10, кв. 42',
    city: 'Москва',
    region: 'Московская область',
    zip: '101000',
  });
  const checkoutTotal = subtotal + shipping;

  const items = useMemo(
    () =>
      cartDetailed.map((entry) => ({
        product_id: entry.product.id,
        product_name: entry.product.name,
        quantity: entry.quantity,
        price: entry.product.price,
        size: entry.size || 'M',
      })),
    [cartDetailed]
  );

  const placeOrder = async () => {
    if (!form.name.trim()) {
      toast.error('Заполните обязательные поля');
      return;
    }
    if (!isValidRuPhone(form.phone)) {
      toast.error('Введите корректный номер РФ в формате +7 (999) 000-00-00');
      return;
    }
    if (deliveryMethod !== 'pickup' && (!form.address || !form.city)) {
      toast.error('Заполните адрес доставки');
      return;
    }
    if (deliveryMethod === 'tk' && (!form.region || !form.zip)) {
      toast.error('Для ТК укажите регион и индекс');
      return;
    }
    if (!personalDataConsent) {
      toast.error('Подтвердите согласие на обработку персональных данных');
      return;
    }

    const orderNumber = generateOrderNumber();
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const endpoint = `${apiBase}/api/shop/orders`;

    const shippingAddress = {
      full_name: form.name,
      phone: formatRuPhone(form.phone),
      city: deliveryMethod === 'pickup' ? 'Москва' : form.city,
      delivery_method: deliveryMethod,
      address: deliveryMethod === 'pickup' ? 'Самовывоз: г. Москва, ул. Дубининская, д. 22' : form.address,
      postal_code: deliveryMethod === 'tk' ? form.zip : null,
      region: deliveryMethod === 'tk' ? form.region : null,
    };

    setSending(true);
    setConfirmOpen(false);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          items,
          total: checkoutTotal,
          shipping_amount: shipping,
          customer_email: form.email || null,
          customer_name: form.name,
          shipping_address: shippingAddress,
          payment_method: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Не удалось создать заказ');
      }

      const created = await response.json();
      clearCart();
      navigate(`${createPageUrl('OrderStatus')}?order=${created.order_number || orderNumber}`);
    } catch (error) {
      try {
        const local = createOrder({
          name: form.name,
          email: form.email || null,
          phone: formatRuPhone(form.phone),
          shipping_address: shippingAddress,
        });
        toast.warning('Сервер недоступен, заказ сохранен локально');
        navigate(`${createPageUrl('OrderStatus')}?order=${local.orderNumber}`);
      } catch {
        toast.error(error.message || 'Ошибка отправки заказа');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-slate-100">
      <Seo title="Оформление заказа" description="Оформление заказа в MOTOTOM: выбор доставки и подтверждение покупки." noindex />
      <header className="border-b border-[#1E1E22] bg-[#0D0D0F]">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 md:h-16 md:px-12">
          <div className="flex items-center gap-4 md:gap-10">
            <Link to={createPageUrl('Home')} className="text-[18px] font-bold tracking-[0.18em] text-[#FAFAF9] md:text-[20px]">
              MOTOTOM
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link to={createPageUrl('Shop')} className="text-[14px] font-medium text-slate-300 hover:text-white">Каталог</Link>
              <Link to={createPageUrl('LooksCatalog')} className="text-[14px] font-medium text-slate-300 hover:text-white">Образы</Link>
            </div>
          </div>

          <Link to={createPageUrl('Shop')} className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Вернуться к каталогу</span>
            <span className="sm:hidden">Каталог</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 px-4 py-8 md:px-8 md:py-12 lg:grid-cols-[1fr_420px] lg:gap-12 lg:px-12">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8 md:space-y-10">
          <header className="space-y-2">
            <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[#FAFAF9]">Оформление заказа</h1>
            <p className="text-sm text-[#A0A0A5]">Проверьте товары и заполните данные для подтверждения покупки.</p>
          </header>

          <section className="space-y-5">
            <h2 className="text-[18px] font-bold text-[#FAFAF9]">Контактная информация</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-normal text-[#A0A0A5]">Имя</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-4 text-sm font-normal text-[#FAFAF9]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-normal text-[#A0A0A5]">Номер телефона</label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={form.phone}
                  maxLength={18}
                  onChange={(e) => setForm({ ...form, phone: formatRuPhone(e.target.value) })}
                  placeholder="+7 (999) 000-00-00"
                  className="h-11 w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-4 text-sm font-normal text-[#FAFAF9] placeholder:text-[#4A4A50]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-normal text-[#A0A0A5]">Электронная почта (необязательно)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@email.com"
                  className="h-11 w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-4 text-sm font-normal text-[#FAFAF9] placeholder:text-[#4A4A50]"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-[18px] font-bold text-[#FAFAF9]">Способ доставки</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {DELIVERY_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setDeliveryMethod(option.key)}
                  className={`relative flex min-h-[100px] flex-col items-start justify-between rounded-lg border p-4 text-left transition-colors sm:h-[122px] ${
                    deliveryMethod === option.key ? 'border-[#54A0C5] bg-[#54A0C514]' : 'border-[#2A2A2E] bg-[#141418]'
                  }`}
                >
                  <option.Icon className={`h-5 w-5 ${deliveryMethod === option.key ? 'text-[#54A0C5]' : 'text-[#6B6B70]'}`} />
                  <div>
                    <p className={`text-[13px] leading-[1.3] ${deliveryMethod === option.key ? 'font-medium text-[#FAFAF9]' : 'font-normal text-[#D4D4D8]'}`}>
                      {option.title}
                    </p>
                    <p className="mt-1 text-xs font-normal text-[#6B6B70]">{option.subtitle}</p>
                  </div>
                  {deliveryMethod === option.key && <Check className="absolute right-3 top-3 h-4 w-4 text-[#54A0C5]" />}
                </button>
              ))}
            </div>

            {deliveryMethod === 'pickup' && (
              <div className="rounded-lg border border-[#2A2A2E] bg-[#16161A] p-4 text-sm font-normal text-[#A0A0A5]">
                <p className="mb-1 text-[13px] font-medium text-[#FAFAF9]">Адрес самовывоза</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-[#54A0C5]" />
                  <span>г. Москва, ул. Дубининская, д. 22</span>
                </div>
              </div>
            )}

            {deliveryMethod !== 'pickup' && (
              <div className="space-y-4">
                <p className="text-[13px] font-normal text-[#A0A0A5]">
                  Стоимость и сроки доставки озвучит менеджер после подтверждения заказа.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-normal text-[#A0A0A5]">Адрес</label>
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="h-11 w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-4 text-sm font-normal text-[#FAFAF9]"
                  />
                </div>

                <div className={`grid gap-4 ${deliveryMethod === 'tk' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-normal text-[#A0A0A5]">Город</label>
                    <input
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="h-11 w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-4 text-sm font-normal text-[#FAFAF9]"
                    />
                  </div>
                  {deliveryMethod === 'tk' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-normal text-[#A0A0A5]">Регион</label>
                        <div className="relative">
                          <input
                            required
                            value={form.region}
                            onChange={(e) => setForm({ ...form, region: e.target.value })}
                            className="h-11 w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-4 pr-9 text-sm font-normal text-[#FAFAF9]"
                          />
                          <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[#6B6B70]" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-normal text-[#A0A0A5]">Индекс</label>
                        <input
                          required
                          value={form.zip}
                          onChange={(e) => setForm({ ...form, zip: e.target.value })}
                          className="h-11 w-full rounded-md border border-[#2A2A2E] bg-[#16161A] px-4 text-sm font-normal text-[#FAFAF9]"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>

          <label className="flex items-start gap-3 rounded-md border border-[#2A2A2E] bg-[#141418] p-3">
            <input
              type="checkbox"
              checked={personalDataConsent}
              onChange={(e) => setPersonalDataConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#54A0C5]"
            />
            <span className="text-[13px] font-normal leading-[1.35] text-[#A0A0A5]">
              Согласен(а) на обработку персональных данных
            </span>
          </label>

          <button
            type="button"
            disabled={sending}
            onClick={() => setConfirmOpen(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#54A0C5] text-sm font-medium text-[#FAFAF9] disabled:opacity-60"
          >
            {sending ? 'Отправка...' : 'Оформить заказ'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <aside className="h-fit space-y-5 rounded-lg border border-[#1E1E22] bg-[#111114] p-5 md:p-7">
          <h3 className="text-base font-bold text-[#FAFAF9]">Ваш заказ</h3>
          <div className="h-px bg-[#1E1E22]" />
          <div className="space-y-4">
            {cartDetailed.map((entry) => (
              <div key={entry.key} className="flex items-center gap-3.5">
                <img src={entry.product.image} alt={entry.product.name} className="h-14 w-14 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-normal text-[#FAFAF9]">{entry.product.name}</p>
                  <p className="text-[11px] font-normal text-[#A0A0A5]">Размер: {entry.size || 'M'} / Кол-во: {entry.quantity}</p>
                </div>
                <p className="text-xs font-medium text-[#FAFAF9]">{formatPrice(entry.lineTotal)} ₽</p>
              </div>
            ))}
          </div>
          <div className="h-px bg-[#1E1E22]" />
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="font-normal text-[#A0A0A5]">Подытог</span>
              <span className="font-normal text-[#FAFAF9]">{formatPrice(subtotal)} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="font-normal text-[#A0A0A5]">Доставка</span>
              <span className="font-normal text-[#32D583]">{shipping === 0 ? 'Бесплатно' : `${formatPrice(shipping)} ₽`}</span>
            </div>
          </div>
          <div className="h-px bg-[#1E1E22]" />
          <div className="flex justify-between">
            <span className="text-base font-bold text-[#FAFAF9]">Итого</span>
            <span className="text-[20px] font-bold text-[#FAFAF9]">{formatPrice(checkoutTotal)} ₽</span>
          </div>
        </aside>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmOpen(false)}>
          <div className="w-full max-w-[460px] rounded-xl border border-[#1E1E22] bg-[#111114] p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#54A0C520]">
              <ShoppingBag className="h-6 w-6 text-[#54A0C5]" />
            </div>
            <h3 className="text-[22px] font-bold text-[#FAFAF9]">Подтверждение заказа</h3>
            <p className="mt-2 text-sm font-normal text-[#A0A0A5]">Подтверждаете ли вы оформление заказа?</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirmOpen(false)} className="inline-flex h-11 items-center justify-center rounded-md border border-[#2A2A2E] text-sm font-medium text-[#A0A0A5]">
                Отмена
              </button>
              <button type="button" onClick={placeOrder} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#54A0C5] text-sm font-medium text-[#FAFAF9]">
                Подтверждаю <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
