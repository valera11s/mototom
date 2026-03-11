import React from 'react';
import { Phone, Mail, Clock3, MapPin, Send, MessageSquare, Copy } from 'lucide-react';
import { toast } from 'sonner';
import Seo from '../src/components/Seo.jsx';

const CONTACT_CARDS = [
  { title: 'Телефон', value: '+7 (495) 129-90-77', Icon: Phone },
  { title: 'Email', value: 'sales@mototom.ru', Icon: Mail },
  { title: 'Режим работы', value: 'Пн-Пт: 10:00 - 20:00', Icon: Clock3 },
  { title: 'Адрес', value: 'Москва, ул. Дубининская, д. 22', Icon: MapPin },
];

function copyText(value, label) {
  navigator.clipboard.writeText(value)
    .then(() => toast.success(`${label} скопирован`))
    .catch(() => toast.error('Не удалось скопировать'));
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const email = String(data.get('email') || '').trim();
  const message = String(data.get('message') || '').trim();

  try {
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const response = await fetch(`${apiBase}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        email,
        message,
        message_type: 'feedback',
      }),
    });
    if (!response.ok) throw new Error('Ошибка отправки');
    toast.success('Сообщение отправлено. Мы свяжемся с вами в ближайшее время.');
    form.reset();
  } catch (error) {
    toast.error('Не удалось отправить сообщение. Попробуйте еще раз.');
  }
}

export default function Contacts() {
  return (
    <div className="bg-[#0D0D0F] text-[#FAFAF9]">
      <Seo title="Контакты MOTOTOM" description="Контакты MOTOTOM: телефон, email, адрес и форма обратной связи." />
      {/* Breadcrumb */}
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 text-[13px] font-normal text-[#6B6B70] md:px-12">
        Главная / <span className="font-medium text-[#54A0C5]">Контакты</span>
      </div>

      {/* Hero */}
      <section
        className="px-4 py-10 sm:px-8 md:py-14 lg:px-20"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(8,8,10,0.58) 0%, rgba(13,13,15,0) 20%, rgba(13,13,15,0) 80%, rgba(8,8,10,0.58) 100%), linear-gradient(180deg, rgba(13,13,15,0) 68%, rgba(7,7,9,0.60) 100%), radial-gradient(80% 100% at 50% 60%, rgba(84,160,197,0.06) 0%, rgba(84,160,197,0) 100%)',
        }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-4 text-center">
          <div className="rounded border border-[#54A0C560] bg-[#54A0C520] px-3 py-1.5 text-[11px] font-semibold tracking-[2px] text-[#54A0C5]">
            КОНТАКТЫ
          </div>
          <h1 className="text-[32px] font-bold tracking-[-1px] text-[#FAFAF9] sm:text-[40px] md:text-[48px]">
            Свяжитесь с нами
          </h1>
          <p className="w-full max-w-[560px] text-sm font-normal leading-[1.6] text-[#A0A0A5]">
            Готовы помочь с выбором экипировки и ответить на ваши вопросы
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="px-4 pb-6 pt-3 sm:px-8 lg:px-20">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {CONTACT_CARDS.map((item) => (
            <article key={item.title} className="rounded-lg border border-transparent bg-[#111115] p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#54A0C520]">
                <item.Icon className="h-4 w-4 text-[#54A0C5]" />
              </div>
              <p className="text-[13px] font-semibold text-[#FAFAF9]">{item.title}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-[13px] font-normal text-[#A0A0A5]">{item.value}</p>
                {(item.title === 'Телефон' || item.title === 'Адрес') && (
                  <button
                    type="button"
                    onClick={() => copyText(item.value, item.title)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#2A2A2E] text-[#A0A0A5] hover:text-[#FAFAF9]"
                    aria-label={`Скопировать ${item.title.toLowerCase()}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Map */}
      <section className="px-4 pb-8 sm:px-8 lg:px-20">
        <div className="mx-auto w-full max-w-[1440px]">
          <h2 className="mb-4 text-[18px] font-semibold text-[#FAFAF9]">Наш магазин на карте</h2>
          <div className="h-[220px] overflow-hidden rounded-lg border border-[#1E1E22] bg-[#111114] sm:h-[260px]">
            <iframe
              title="Карта MotoTom"
              src="https://yandex.ru/map-widget/v1/?ll=37.6351%2C55.7213&z=15&pt=37.6351%2C55.7213%2Cpm2rdm"
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Contact form */}
      <section className="px-4 pb-12 sm:px-8 md:pb-14 lg:px-20">
        <div className="mx-auto w-full max-w-[1440px]">
          <h2 className="text-[22px] font-bold text-[#FAFAF9]">Напишите нам</h2>
          <p className="mt-1 text-[13px] font-normal text-[#A0A0A5]">
            Мы свяжемся с вами в течение 15 минут в рабочее время (Пн-Пт, 10:00-20:00)
          </p>

          <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-[1fr_300px]">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  name="name"
                  placeholder="Ваше имя"
                  className="h-11 rounded-md border border-[#2A2A2E] bg-transparent px-4 text-sm font-normal text-[#FAFAF9] placeholder:text-[#4A4A50]"
                />
                <input
                  required
                  name="phone"
                  placeholder="Телефон"
                  className="h-11 rounded-md border border-[#2A2A2E] bg-transparent px-4 text-sm font-normal text-[#FAFAF9] placeholder:text-[#4A4A50]"
                />
              </div>
              <input
                name="email"
                placeholder="Email (необязательно)"
                className="h-11 w-full rounded-md border border-[#2A2A2E] bg-transparent px-4 text-sm font-normal text-[#FAFAF9] placeholder:text-[#4A4A50]"
              />
              <textarea
                required
                name="message"
                placeholder="Сообщение"
                className="h-28 w-full resize-none rounded-md border border-[#2A2A2E] bg-transparent px-4 py-3 text-sm font-normal text-[#FAFAF9] placeholder:text-[#4A4A50]"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[#54A0C5] px-5 text-sm font-medium text-[#FAFAF9]"
              >
                Отправить сообщение
                <Send className="h-4 w-4" />
              </button>
            </form>

            <aside className="p-1">
              <h3 className="mb-4 text-sm font-semibold tracking-[1px] text-[#FAFAF9]">БЫСТРЫЕ КАНАЛЫ</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#54A0C5]" />
                  <div className="flex-1">
                    <p className="font-medium text-[#FAFAF9]">Телефон</p>
                    <p className="text-[#A0A0A5]">+7 (495) 129-90-77</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('+7 (495) 129-90-77', 'Телефон')}
                    className="text-[#A0A0A5] hover:text-[#FAFAF9]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#54A0C5]" />
                  <div>
                    <p className="font-medium text-[#FAFAF9]">Email</p>
                    <p className="text-[#A0A0A5]">sales@mototom.ru</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#54A0C5]" />
                  <div>
                    <p className="font-medium text-[#FAFAF9]">Онлайн-чат</p>
                    <p className="text-[#A0A0A5]">Работаем ежедневно</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#54A0C5]" />
                  <div className="flex-1">
                    <p className="font-medium text-[#FAFAF9]">Адрес</p>
                    <p className="text-[#A0A0A5]">Москва, ул. Дубининская, д. 22</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('Москва, ул. Дубининская, д. 22', 'Адрес')}
                    className="text-[#A0A0A5] hover:text-[#FAFAF9]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
