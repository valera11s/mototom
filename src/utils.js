export function createPageUrl(pageName) {
  const pageMap = {
    Home: '/',
    Shop: '/shop',
    LooksCatalog: '/looks',
    Cart: '/cart',
    Checkout: '/checkout',
    OrderStatus: '/order-success',
    ReadySet: '/ready-set',
    ProductDetails: '/product',
    Delivery: '/delivery',
    About: '/about',
    Contacts: '/contacts',
    Warranty: '/warranty',
  };

  return pageMap[pageName] || '/';
}

export function formatPrice(price) {
  if (!price && price !== 0) return '0';
  return Math.round(Number(price)).toLocaleString('ru-RU');
}

export function generateSlug(text) {
  if (!text) return '';
  const translit = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return text
    .toString()
    .toLowerCase()
    .split('')
    .map((ch) => translit[ch] ?? ch)
    .join('')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function createProductUrl(product) {
  const id = String(product?.id || '').trim();
  const slugRaw = String(product?.slug || '').trim();
  const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugRaw);
  const slugSource = slugRaw && !isUuidLike ? slugRaw : String(product?.name || '').trim();
  const safeSlug = generateSlug(slugSource);
  const pathPart = safeSlug || (isUuidLike ? '' : slugRaw) || id;
  return `${createPageUrl('ProductDetails')}/${encodeURIComponent(pathPart || id)}`;
}
