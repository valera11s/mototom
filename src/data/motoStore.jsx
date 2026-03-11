import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const MotoStoreContext = createContext(null);

const CART_KEY = 'mototom-cart';
const ORDERS_KEY = 'mototom-orders';
const DEFAULT_CATEGORY_NAMES = ['Шлемы', 'Куртки', 'Перчатки', 'Ботинки', 'Защита', 'Аксессуары'];

const INT_SIZE_CANONICAL = new Set([
  'XXXS',
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  '6XL',
  '7XL',
  '8XL',
  'ONE SIZE',
]);

const RU_TO_INT_SIZE_MAP = {
  '40': 'XXS',
  '42': 'XS',
  '44': 'S',
  '46': 'S',
  '48': 'M',
  '50': 'L',
  '52': 'XL',
  '54': '2XL',
  '56': '3XL',
  '58': '4XL',
  '60': '5XL',
  '62': '6XL',
  '64': '7XL',
  '66': '8XL',
};

const INT_TO_RU_SIZE_MAP = {
  XXXS: '40',
  XXS: '42',
  XS: '44',
  S: '46',
  M: '48',
  L: '50',
  XL: '52',
  '2XL': '54',
  '3XL': '56',
  '4XL': '58',
  '5XL': '60',
  '6XL': '62',
  '7XL': '64',
  '8XL': '66',
};

function uniqueStrings(list) {
  return [...new Set((Array.isArray(list) ? list : []).filter(Boolean))];
}

function normalizeIntToken(raw) {
  if (raw == null) return null;
  let value = String(raw).trim().toUpperCase();
  if (!value) return null;

  value = value
    .replace(/Х/g, 'X')
    .replace(/\s+/g, '')
    .replace(/,/, '.');

  if (value === 'OS' || value === 'ONESIZE' || value === 'UNIVERSAL' || value === 'UNI') return 'ONE SIZE';
  if (value === 'XXL') return '2XL';
  if (value === 'XXXL') return '3XL';
  if (value === 'XXXXL') return '4XL';
  if (value === 'XXXXXL') return '5XL';

  const compactXl = value.match(/^([2-8])X(L)$/);
  if (compactXl) return `${compactXl[1]}XL`;

  return INT_SIZE_CANONICAL.has(value) ? value : null;
}

function normalizeRuToken(raw) {
  if (raw == null) return null;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  if (n < 40 || n > 66) return null;
  return String(Math.round(n));
}

function mapRuToIntSize(ru) {
  const normalizedRu = normalizeRuToken(ru);
  if (!normalizedRu) return null;
  if (RU_TO_INT_SIZE_MAP[normalizedRu]) return RU_TO_INT_SIZE_MAP[normalizedRu];
  const numeric = Number(normalizedRu);
  if (numeric % 2 === 1 && RU_TO_INT_SIZE_MAP[String(numeric - 1)]) {
    return RU_TO_INT_SIZE_MAP[String(numeric - 1)];
  }
  return null;
}

function mapIntToRuSize(intSize) {
  const normalizedInt = normalizeIntToken(intSize);
  if (!normalizedInt) return null;
  return INT_TO_RU_SIZE_MAP[normalizedInt] || null;
}

function extractSizeTokensFromText(text) {
  const source = String(text || '');
  if (!source.trim()) return { intSizes: [], ruSizes: [] };

  const normalized = source
    .toUpperCase()
    .replace(/Х/g, 'X')
    .replace(/[()]/g, ' ')
    .replace(/[;,]/g, ' ');

  const intMatches = normalized.match(/\b(XXXS|XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|7XL|8XL|ONE\s*SIZE|OS)\b/g) || [];
  const ruMatches = [];

  const ruSinglePattern = /(?:^|[^\d])([4-6]\d)(?=$|[^\d])/g;
  for (const match of normalized.matchAll(ruSinglePattern)) {
    ruMatches.push(match[1]);
  }

  const ruRangePattern = /([4-6]\d)\s*[-/]\s*([4-6]\d)/g;
  for (const match of normalized.matchAll(ruRangePattern)) {
    ruMatches.push(match[1], match[2]);
  }

  return {
    intSizes: uniqueStrings(intMatches.map(normalizeIntToken)),
    ruSizes: uniqueStrings(ruMatches.map(normalizeRuToken)),
  };
}

function resolveProductSizes(item) {
  const rawList = [];
  if (Array.isArray(item.sizes)) rawList.push(...item.sizes);
  else if (typeof item.sizes === 'string') rawList.push(...item.sizes.split(/[,\s/]+/g));
  if (item.size) rawList.push(item.size);

  const rawText = [
    item.name,
    item.title,
    item.description,
    item.size,
    Array.isArray(item.sizes) ? item.sizes.join(' ') : item.sizes,
  ]
    .filter(Boolean)
    .join(' ');

  const fromRaw = extractSizeTokensFromText(rawList.join(' '));
  const fromText = extractSizeTokensFromText(rawText);

  const intSizes = uniqueStrings([...fromRaw.intSizes, ...fromText.intSizes]);
  const ruSizes = uniqueStrings([...fromRaw.ruSizes, ...fromText.ruSizes]);

  const intFromRu = ruSizes.map(mapRuToIntSize).filter(Boolean);
  const ruFromInt = intSizes.map(mapIntToRuSize).filter(Boolean);

  const normalizedInt = uniqueStrings([...intSizes, ...intFromRu]);
  const normalizedRu = uniqueStrings([...ruSizes, ...ruFromInt]).sort((a, b) => Number(a) - Number(b));

  return {
    sizes: normalizedInt.length > 0 ? normalizedInt : ['M'],
    ruSizes: normalizedRu,
  };
}

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nextOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `MT-${stamp}-${random}`;
}

function fallbackCategories() {
  return DEFAULT_CATEGORY_NAMES.map((name, idx) => ({ id: `fallback-${idx}`, name, parent_id: null, level: 0 }));
}

function normalizeCategories(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return fallbackCategories();

  const list = raw
    .map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `legacy-${idx}`, name: item, parent_id: null, level: 0 };
      }
      return {
        id: item.id ?? `cat-${idx}`,
        name: item.name ?? '',
        parent_id: item.parent_id ?? null,
        level: item.level ?? 0,
        slug: item.slug ?? null,
        image: item.image ?? null,
      };
    })
    .filter((c) => c.name);

  const topLevel = list.filter((c) => c.parent_id == null);
  return topLevel.length > 0 ? list : fallbackCategories();
}

function normalizeProducts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    const condition = String(item.condition ?? 'new').toLowerCase();
    const { sizes, ruSizes } = resolveProductSizes(item);
    return ({
      id: String(item.id ?? `p-${idx}`),
      slug: item.slug ?? null,
      name: item.name ?? item.title ?? 'Товар',
      category: item.category ?? item.category_name ?? 'Шлемы',
      categoryId: item.category_id ?? null,
      subcategory: item.subcategory ?? item.subcategory_name ?? null,
      subcategoryId: item.subcategory_id ?? null,
      subsubcategory: item.subsubcategory ?? item.subsubcategory_name ?? null,
      subsubcategoryId: item.subsubcategory_id ?? null,
      brand: item.brand ?? '',
      price: Number(item.price ?? 0),
      oldPrice: item.oldPrice ?? item.old_price ?? null,
      rating: Number(item.rating ?? 4.8),
      condition,
      stockQty: condition === 'used'
        ? 1
        : Number(item.stockQty ?? item.stock_qty ?? (item.in_stock ? 1 : 0)),
      sizes,
      ruSizes,
      image: item.image ?? item.image_url ?? (Array.isArray(item.images) ? item.images[0] : ''),
      images: Array.isArray(item.images) ? item.images.filter(Boolean) : (item.image ? [item.image] : item.image_url ? [item.image_url] : []),
      featured: Boolean(item.featured),
      isNew: item.isNew ?? item.condition === 'new',
    });
  });
}

function normalizeBrands(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    if (typeof item === 'string') return { id: `brand-${idx}`, name: item };
    return { id: item.id ?? `brand-${idx}`, name: item.name ?? '' };
  }).filter((b) => b.name);
}

export function MotoStoreProvider({ children }) {
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

  const [cart, setCart] = useState(() => readStorage(CART_KEY, []));
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState({ name: 'MOTOTOM', freeShippingFrom: 10000 });
  const [categories, setCategories] = useState(() => fallbackCategories());
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [sets, setSets] = useState([]);

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const bootstrapRes = await fetch(`${apiBase}/api/shop/bootstrap`);
        if (!bootstrapRes.ok) throw new Error('Failed to load shop bootstrap');
        const bootstrapData = await bootstrapRes.json();

        if (disposed) return;
        setStore(bootstrapData?.store || { name: 'MOTOTOM', freeShippingFrom: 10000 });
        setCategories(normalizeCategories(bootstrapData?.categories || []));
        setBrands(normalizeBrands(bootstrapData?.brands || []));
        setProducts(normalizeProducts(bootstrapData?.products || []));
        setSets(Array.isArray(bootstrapData?.sets) ? bootstrapData.sets : []);
      } catch (error) {
        if (!disposed) {
          console.warn('Shop data fallback:', error);
          setStore({ name: 'MOTOTOM', freeShippingFrom: 10000 });
          setCategories(fallbackCategories());
          setBrands([]);
          setProducts([]);
          setSets([]);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [apiBase]);

  const productsById = useMemo(() => {
    return products.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }, [products]);

  const cartDetailed = useMemo(() => {
    return cart
      .map((entry) => {
        const product = productsById[entry.productId];
        if (!product) return null;
        return {
          ...entry,
          product,
          lineTotal: product.price * entry.quantity,
        };
      })
      .filter(Boolean);
  }, [cart, productsById]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cartDetailed.reduce((sum, item) => sum + item.lineTotal, 0), [cartDetailed]);
  const shipping = subtotal >= (store.freeShippingFrom || 10000) || subtotal === 0 ? 0 : 790;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shipping + tax;

  const persistCart = (next) => {
    setCart(next);
    writeStorage(CART_KEY, next);
  };

  const getMaxAllowedQty = (productId) => {
    const product = productsById[productId];
    if (!product) return 1;
    if (String(product.condition || '').toLowerCase() === 'used') return 1;
    const stockQty = Number(product.stockQty);
    if (Number.isFinite(stockQty)) return Math.max(0, stockQty);
    return 1;
  };

  const getCartQuantity = (productId, size = null) => {
    const key = `${productId}::${size || 'default'}`;
    const found = cart.find((item) => item.key === key);
    return Number(found?.quantity || 0);
  };

  const addToCart = (productId, quantity = 1, size = null) => {
    const key = `${productId}::${size || 'default'}`;
    const existing = cart.find((item) => item.key === key);
    const productName = productsById[productId]?.name || 'Товар';
    const maxAllowed = getMaxAllowedQty(productId);

    if (maxAllowed <= 0) {
      return { added: false, quantity: 0, maxAllowed, reason: 'out_of_stock' };
    }

    if (existing) {
      let nextQty = existing.quantity;
      persistCart(
        cart.map((item) =>
          item.key === key
            ? { ...item, quantity: (nextQty = Math.min(maxAllowed, Math.max(1, item.quantity + quantity))) }
            : item
        )
      );
      const added = nextQty > existing.quantity;
      if (added && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('mototom:cart:add', {
            detail: { productId, productName, quantity: nextQty - existing.quantity, maxAllowed },
          })
        );
      }
      return { added, quantity: nextQty, maxAllowed };
    }
    const nextQty = Math.min(maxAllowed, Math.max(1, quantity));
    persistCart([...cart, { key, productId, quantity: nextQty, size }]);
    if (nextQty > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('mototom:cart:add', {
          detail: { productId, productName, quantity: nextQty, maxAllowed },
        })
      );
    }
    return { added: true, quantity: nextQty, maxAllowed };
  };

  const updateCartQuantity = (key, quantity) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }
    persistCart(
      cart.map((item) => {
        if (item.key !== key) return item;
        const maxAllowed = getMaxAllowedQty(item.productId);
        return { ...item, quantity: Math.min(maxAllowed, Math.max(1, quantity)) };
      })
    );
  };

  const removeFromCart = (key) => {
    persistCart(cart.filter((item) => item.key !== key));
  };

  const clearCart = () => {
    persistCart([]);
  };

  const createOrder = (customer) => {
    const order = {
      orderNumber: nextOrderNumber(),
      createdAt: new Date().toISOString(),
      status: 'processing',
      customer,
      items: cartDetailed,
      subtotal,
      shipping,
      tax,
      total,
    };

    const existingOrders = readStorage(ORDERS_KEY, []);
    writeStorage(ORDERS_KEY, [order, ...existingOrders]);
    clearCart();
    return order;
  };

  const getOrder = (orderNumber) => {
    const existingOrders = readStorage(ORDERS_KEY, []);
    return existingOrders.find((order) => order.orderNumber === orderNumber) || null;
  };

  const value = {
    loading,
    store,
    categories,
    brands,
    products,
    sets,
    cart,
    cartDetailed,
    cartCount,
    subtotal,
    shipping,
    tax,
    total,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    getOrder,
    getMaxAllowedQty,
    getCartQuantity,
  };

  return <MotoStoreContext.Provider value={value}>{children}</MotoStoreContext.Provider>;
}

export function useMotoStore() {
  const context = useContext(MotoStoreContext);
  if (!context) {
    throw new Error('useMotoStore must be used within MotoStoreProvider');
  }
  return context;
}

