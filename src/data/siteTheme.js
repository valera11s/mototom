export const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-[4px] bg-[linear-gradient(90deg,#7DDCFF_0%,#54A0C5_50%,#315F8C_100%)] px-5 py-3 text-sm font-semibold text-[#FAFAF9] transition-colors duration-200 hover:brightness-[1.03]';

export const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-[4px] bg-[linear-gradient(90deg,#182027_0%,#12171D_100%)] px-5 py-3 text-sm font-medium text-[#FAFAF9] transition-colors duration-200 hover:bg-[#151A20]';

export const PRODUCT_BADGE_CLASS = {
  new: 'bg-[#1C4F72] text-[#E7F6FF]',
  used: 'bg-[#1F252B] text-[#B7D9EA]',
};

export const BRAND_LOGOS = {
  shoei: '/assets/brand-logos/shoei.png',
  agv: '/assets/brand-logos/agv.png',
  arai: '/assets/brand-logos/arai.png',
  hjc: '/assets/brand-logos/hjc.png',
  shark: '/assets/brand-logos/shark.png',
  schuberth: '/assets/brand-logos/schuberth.png',
  alpinestars: '/assets/brand-logos/alpinestars.png',
  dainese: '/assets/brand-logos/dainese.png',
};

export const HOME_CATEGORY_META = {
  helmets: {
    name: 'Шлемы',
    description: 'Интегралы и open-face',
    image: 'https://images.unsplash.com/photo-1645021081534-93ce573e3dce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  jackets: {
    name: 'Куртки',
    description: 'Текстиль и кевлар',
    image: 'https://images.unsplash.com/photo-1694852860772-ec8598c72c15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  gloves: {
    name: 'Перчатки',
    description: 'Город и спорт',
    image: 'https://images.unsplash.com/photo-1662707645694-36d3e81afd85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  boots: {
    name: 'Ботинки',
    description: 'Город и туринг',
    image: 'https://images.unsplash.com/photo-1693679117329-da630cfbf90c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  protection: {
    name: 'Защита',
    description: 'Спина и локти',
    image: 'https://images.unsplash.com/photo-1644435234001-ceb5f78330f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  accessories: {
    name: 'Аксессуары',
    description: 'Визоры и интеркомы',
    image: 'https://images.unsplash.com/photo-1719212752790-fb82dd11de88?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
};

export const DEFAULT_MARQUEE_PROMOS = ['Trade-In', 'Акция -15%', 'Новые поступления', 'Онлайн-заказ 24/7'];

export function getBrandLogo(brandName) {
  const normalized = String(brandName || '')
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '');
  if (normalized.includes('shoei')) return BRAND_LOGOS.shoei;
  if (normalized.includes('agv')) return BRAND_LOGOS.agv;
  if (normalized.includes('arai')) return BRAND_LOGOS.arai;
  if (normalized.includes('hjc')) return BRAND_LOGOS.hjc;
  if (normalized.includes('shark')) return BRAND_LOGOS.shark;
  if (normalized.includes('schuberth')) return BRAND_LOGOS.schuberth;
  if (normalized.includes('alpinestars')) return BRAND_LOGOS.alpinestars;
  if (normalized.includes('dainese')) return BRAND_LOGOS.dainese;
  return null;
}

export function parseMarqueePromos(value) {
  return String(value || '')
    .split(/\r?\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}
