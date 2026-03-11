import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Link as LinkIcon, Copy, Bookmark } from 'lucide-react';
import { createPageUrl, formatPrice } from '../src/utils.js';
import { useMotoStore } from '../src/data/motoStore.jsx';
import { toast } from 'sonner';
import Seo from '../src/components/Seo.jsx';

function normalizeOrder(order) {
  if (!order) return null;
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
  const shippingAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {});
  return {
    number: order.order_number || order.orderNumber,
    status: order.status || 'pending',
    total: Number(order.total || 0),
    email: order.customer_email || order.customerEmail,
    customerName: order.customer_name || order.customerName,
    items,
    shippingAddress,
  };
}

function deliveryMethodLabel(code) {
  if (code === 'pickup') return 'Самовывоз из магазина';
  if (code === 'tk') return 'Доставка ТК по России';
  return 'Курьерская доставка';
}

function deliveryEtaLabel(code) {
  if (code === 'pickup') return 'Готов к выдаче сегодня';
  if (code === 'tk') return '3-7 рабочих дней';
  return '1-2 рабочих дня';
}

export default function OrderStatus() {
  const [params] = useSearchParams();
  const orderNumber = params.get('order');
  const { getOrder, products } = useMotoStore();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      try {
        const response = await fetch(`${apiBase}/api/shop/orders/${encodeURIComponent(orderNumber)}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!disposed) setOrder(normalizeOrder(data));
      } catch {
        if (!disposed) setOrder(normalizeOrder(getOrder(orderNumber)));
      }
    })();
    return () => {
      disposed = true;
    };
  }, [orderNumber, getOrder]);

  const richItems = useMemo(() => {
    if (!order) return [];
    return order.items.map((item) => {
      const productId = item.product_id || item.productId;
      const fromStore = products.find((p) => p.id === productId);
      return {
        ...item,
        image: fromStore?.image || 'https://images.unsplash.com/photo-1600924234544-39cff29f0fda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      };
    });
  }, [order, products]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] px-4 py-20 text-center text-slate-300 md:px-12">
        Загрузка заказа...
      </div>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const shipping = Math.max(0, order.total - subtotal);
  const tax = Math.round(subtotal * 0.08);
  const trackUrl = `mototom.ru/order/${order.number}`;

  const copyTrackingUrl = async () => {
    try {
      await navigator.clipboard.writeText(`https://${trackUrl}`);
      toast.success('Ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-slate-100">
      <Seo title="Статус заказа" description="Страница статуса заказа MOTOTOM." noindex />
      {/* Header */}
      <header className="border-b border-[#1E1E22] bg-[#0D0D0F]">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 md:h-16 md:px-12">
          <Link
            to={createPageUrl('Home')}
            className="text-[18px] font-bold tracking-[0.18em] text-[#FAFAF9] md:text-[20px]"
          >
            MOTOTOM
          </Link>
          <Link
            to={createPageUrl('Shop')}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#A0A0A5] hover:text-[#FAFAF9]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Вернуться в магазин</span>
            <span className="sm:hidden">В магазин</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-8 px-4 py-10 md:gap-10 md:py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A3A2A] md:h-20 md:w-20">
          <Check className="h-7 w-7 text-[#32D583] md:h-9 md:w-9" />
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-[22px] font-bold tracking-[-0.5px] text-[#FAFAF9] md:text-[28px]">
            Заказ успешно оформлен!
          </h1>
          <p className="w-full max-w-[500px] text-[15px] font-normal leading-[1.6] text-[#A0A0A5]">
            Спасибо за покупку! Мы уже начали собирать ваш заказ.{'\n'}
            Менеджер свяжется с вами в ближайшее время.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-[#1E1E22] bg-[#16161A] px-5 py-3 md:px-6">
          <span className="text-sm font-normal text-[#A0A0A5]">Номер заказа:</span>
          <span className="text-sm font-semibold text-[#54A0C5]">#{order.number}</span>
        </div>

        {/* Tracking */}
        <section className="w-full max-w-[600px] rounded-[10px] border border-[#1E1E22] bg-[#111114] p-5 md:p-7">
          <div className="flex items-center justify-center gap-2.5">
            <LinkIcon className="h-[18px] w-[18px] text-[#54A0C5]" />
            <p className="text-base font-semibold text-[#FAFAF9]">Ссылка для отслеживания заказа</p>
          </div>
          <p className="mx-auto mt-4 max-w-[520px] text-center text-[13px] font-normal leading-[1.6] text-[#A0A0A5]">
            Сохраните эту ссылку - по ней вы сможете в любое время проверить статус заказа, детали доставки и состав заказа.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#2A2A2E] bg-[#0D0D0F] px-4 py-3">
            <span className="font-mono text-[12px] font-normal text-[#FAFAF9] sm:text-[13px]">{trackUrl}</span>
            <button
              type="button"
              onClick={copyTrackingUrl}
              className="inline-flex items-center gap-1.5 rounded bg-[#54A0C5] px-3.5 py-1.5 text-xs font-medium text-[#FAFAF9]"
            >
              <Copy className="h-3.5 w-3.5" />
              Копировать
            </button>
          </div>
        </section>

        {/* Order details */}
        <section className="w-full max-w-[700px] overflow-hidden rounded-[10px] border border-[#1E1E22] bg-[#111114]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E1E22] px-5 py-4 md:px-7 md:py-5">
            <h2 className="text-base font-semibold text-[#FAFAF9]">Детали заказа</h2>
            <div className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#1A3A2A] px-3.5 py-1">
              <span className="h-2 w-2 rounded-full bg-[#32D583]" />
              <span className="text-xs font-medium text-[#32D583]">Принят в обработку</span>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 md:space-y-5 md:px-7 md:py-7">
            {richItems.map((item, index) => (
              <div key={`${item.product_name || item.name}-${index}`} className="flex items-center gap-3 md:gap-4">
                <img
                  src={item.image}
                  alt={item.product_name || item.name}
                  className="h-12 w-12 rounded-lg object-cover md:h-14 md:w-14"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#FAFAF9]">{item.product_name || item.name}</p>
                  <p className="text-xs font-normal text-[#6B6B70]">
                    Размер: {item.size || 'M'} · Кол-во: {item.quantity || 1}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#FAFAF9]">
                  {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))} ₽
                </p>
              </div>
            ))}
          </div>

          <div className="h-px bg-[#1E1E22]" />

          <div className="grid grid-cols-1 gap-6 px-5 py-5 sm:grid-cols-3 sm:gap-12 md:px-7">
            <div className="space-y-2 md:space-y-3">
              <p className="text-xs font-medium tracking-[1px] text-[#A0A0A5]">ДОСТАВКА</p>
              <p className="whitespace-pre-line text-[13px] font-normal leading-[1.6] text-[#FAFAF9]">
                {order.customerName || order.shippingAddress.full_name}{'\n'}
                {order.shippingAddress.address || '-'}{'\n'}
                {order.shippingAddress.city || '-'}{order.shippingAddress.postal_code ? `, ${order.shippingAddress.postal_code}` : ''}
              </p>
            </div>
            <div className="space-y-2 md:space-y-3">
              <p className="text-xs font-medium tracking-[1px] text-[#A0A0A5]">КОНТАКТЫ</p>
              <p className="whitespace-pre-line text-[13px] font-normal leading-[1.6] text-[#FAFAF9]">
                {order.email || 'email не указан'}{'\n'}
                {order.shippingAddress.phone || '-'}
              </p>
            </div>
            <div className="space-y-2 md:space-y-3">
              <p className="text-xs font-medium tracking-[1px] text-[#A0A0A5]">СПОСОБ ДОСТАВКИ</p>
              <p className="whitespace-pre-line text-[13px] font-normal leading-[1.6] text-[#FAFAF9]">
                {deliveryMethodLabel(order.shippingAddress.delivery_method)}{'\n'}
                {deliveryEtaLabel(order.shippingAddress.delivery_method)}
              </p>
            </div>
          </div>

          <div className="h-px bg-[#1E1E22]" />

          <div className="space-y-3 px-5 py-5 md:px-7">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-normal text-[#A0A0A5]">Подытог</span>
              <span className="font-medium text-[#FAFAF9]">{formatPrice(subtotal)} ₽</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-normal text-[#A0A0A5]">Доставка</span>
              <span className={`font-medium ${shipping === 0 ? 'text-[#32D583]' : 'text-[#FAFAF9]'}`}>
                {shipping === 0 ? 'Бесплатно' : `${formatPrice(shipping)} ₽`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-normal text-[#A0A0A5]">Налог</span>
              <span className="font-medium text-[#FAFAF9]">{formatPrice(tax)} ₽</span>
            </div>
            <div className="h-px bg-[#1E1E22]" />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-[#FAFAF9]">Итого</span>
              <span className="text-[20px] font-bold text-[#FAFAF9]">{formatPrice(order.total)} ₽</span>
            </div>
          </div>
        </section>

        {/* Bookmark tip */}
        <section className="w-full max-w-[700px] rounded-lg border border-[#1A3344] bg-[#0f2129] px-5 py-4 md:px-6">
          <div className="flex items-start gap-3">
            <Bookmark className="mt-0.5 h-5 w-5 shrink-0 text-[#54A0C5]" />
            <div>
              <p className="text-sm font-semibold text-[#54A0C5]">Сохраните ссылку на заказ!</p>
              <p className="mt-1 text-[13px] font-normal leading-[1.6] text-[#7DBFDA]">
                Это ваша постоянная ссылка для отслеживания заказа. Добавьте её в закладки или скопируйте - по ней вы всегда сможете проверить статус, сроки доставки и детали заказа.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
