import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Gem, Users } from 'lucide-react';
import { createPageUrl } from '../src/utils.js';
import Seo from '../src/components/Seo.jsx';

const STATS = [
  { value: '7+', label: 'лет на рынке' },
  { value: '15 000+', label: 'довольных клиентов' },
  { value: '50+', label: 'брендов в каталоге' },
  { value: '3', label: 'магазина в Москве' },
];

const VALUES = [
  {
    Icon: ShieldCheck,
    title: 'Безопасность',
    description: 'Только сертифицированная экипировка и защита по стандартам CE и ECE.',
  },
  {
    Icon: Gem,
    title: 'Качество',
    description: 'Работаем с проверенными мировыми брендами и отбираем только надежные модели.',
  },
  {
    Icon: Users,
    title: 'Поддержка',
    description: 'Помогаем подобрать экипировку под стиль езды, бюджет и задачи.',
  },
];

const TEAM = [
  {
    role: 'Основатель и CEO',
    text: '15 лет в мототематике, отвечает за развитие бренда и продуктовую стратегию.',
  },
  {
    role: 'Главный байер',
    text: 'Формирует ассортимент и контролирует качество поставляемой экипировки.',
  },
  {
    role: 'Руководитель сервиса',
    text: 'Отвечает за клиентский сервис, гарантию и послепродажную поддержку.',
  },
  {
    role: 'Стилист и консультант',
    text: 'Собирает образы и помогает подобрать совместимые элементы экипировки.',
  },
];

export default function About() {
  return (
    <div className="bg-[#0D0D0F] text-[#FAFAF9]">
      <Seo title="О компании MOTOTOM" description="MOTOTOM — магазин мотоэкипировки. Подбор экипировки, сертифицированные товары и поддержка райдеров." />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 text-[13px] text-[#6B6B70] md:px-12">
        Главная / <span className="font-medium text-[#54A0C5]">О нас</span>
      </div>

      <section className="relative h-[320px] overflow-hidden sm:h-[400px] md:h-[480px]">
        <img
          src="https://images.unsplash.com/photo-1637327843427-1035582faad4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600"
          alt="О компании"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0Fe6] via-[#0D0D0F80] to-[#0D0D0FCC]" />

        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="flex w-full max-w-[800px] flex-col items-center gap-4 text-center sm:gap-5">
            <div className="rounded border border-[#54A0C560] bg-[#54A0C520] px-3 py-1.5 text-[11px] font-semibold tracking-[2px] text-[#54A0C5]">
              О КОМПАНИИ
            </div>
            <h1 className="text-[32px] font-bold tracking-[-1px] sm:text-[40px] md:text-[48px]">Мы MotoTom</h1>
            <p className="w-full max-w-[600px] text-sm font-normal leading-[1.6] text-[#A0A0A5] md:text-base">
              Премиальная мотоэкипировка для тех, кто ценит безопасность, комфорт и стиль в каждой поездке.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 border-y border-[#1E1E22] bg-[#111114] px-4 py-8 md:grid-cols-4 md:px-20 md:py-10">
        {STATS.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 py-2 text-center">
            <p className="text-[28px] font-bold text-[#54A0C5] md:text-[36px]">{item.value}</p>
            <p className="text-[13px] font-normal text-[#A0A0A5]">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="bg-[radial-gradient(60%_80%_at_20%_50%,rgba(84,160,197,0.06)_0%,rgba(84,160,197,0)_100%)] px-4 py-12 sm:px-8 md:px-20 md:py-16">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          <div className="flex flex-col gap-5 md:gap-6">
            <h2 className="text-[24px] font-bold tracking-[-0.5px] md:text-[28px]">Наша миссия</h2>
            <p className="text-[15px] leading-[1.7] text-[#A0A0A5]">
              Мы создаем пространство, где райдер может собрать полный комплект экипировки в одном месте: от шлема до аксессуаров.
            </p>
            <p className="text-[15px] leading-[1.7] text-[#A0A0A5]">
              В ассортименте только проверенные бренды: AGV, Shoei, Alpinestars, Dainese, REV'IT! и другие.
            </p>
          </div>
          <div className="h-[240px] overflow-hidden rounded-xl sm:h-[300px] md:h-[360px]">
            <img
              src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80"
              alt="Наша миссия"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[#1E1E22] bg-[#111114] px-4 py-12 sm:px-8 md:px-20 md:py-16">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 md:gap-10">
          <h2 className="text-[24px] font-bold tracking-[-0.5px] md:text-[28px]">Наши ценности</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {VALUES.map((value) => (
              <article key={value.title} className="rounded-xl border border-[#1E1E22] bg-[#16161A] p-5 md:p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#54A0C520]">
                  <value.Icon className="h-5 w-5 text-[#54A0C5]" />
                </div>
                <h3 className="text-[18px] font-semibold">{value.title}</h3>
                <p className="mt-3 text-[13px] leading-[1.6] text-[#6B6B70]">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-8 md:px-20 md:py-16">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 md:gap-10">
          <div className="text-center">
            <h2 className="text-[24px] font-bold tracking-[-0.5px] md:text-[28px]">Наша команда</h2>
            <p className="mt-2 text-sm text-[#A0A0A5]">Эксперты, которые помогают подобрать экипировку под ваши задачи.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {TEAM.map((person, idx) => (
              <article key={`${person.role}-${idx}`} className="flex flex-col items-center text-center">
                <h3 className="mt-3 text-sm font-semibold md:mt-4 md:text-base">Имя фамилия</h3>
                <p className="mt-1 text-[12px] font-medium text-[#54A0C5] md:text-[13px]">{person.role}</p>
                <p className="mt-2 text-xs leading-[1.5] text-[#6B6B70]">{person.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#1E1E22] bg-[#111114] px-4 py-12 sm:px-8 md:px-20 md:py-16">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-5 text-center">
          <h2 className="text-[24px] font-bold md:text-[28px]">Готовы к поездке?</h2>
          <p className="w-full max-w-[500px] text-[15px] font-normal leading-[1.5] text-[#A0A0A5]">
            Загляните в каталог или приезжайте в наши магазины, поможем собрать комплект под ваш стиль езды.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={createPageUrl('Shop')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#54A0C5] px-6 py-3 text-sm font-semibold text-[#FAFAF9] md:px-8 md:py-3.5"
            >
              Перейти в каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={createPageUrl('Contacts')}
              className="inline-flex rounded-lg border border-[#2A2A2E] px-6 py-3 text-sm font-medium text-[#A0A0A5] md:px-8 md:py-3.5"
            >
              Контакты и адрес
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
