import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Minus, Plus, ShoppingBag, Star, Truck, Shield, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { createPageUrl, createProductUrl, formatPrice, generateSlug } from '../src/utils.js';
import { useMotoStore } from '../src/data/motoStore.jsx';
import Seo from '../src/components/Seo.jsx';
import { Button } from '../Components/ui/button.jsx';
import { Badge } from '../Components/ui/badge.jsx';
import { Skeleton } from '../Components/ui/skeleton.jsx';

function uniq(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, products: storeProducts, getCartQuantity, getMaxAllowedQty } = useMotoStore();

  const urlParams = new URLSearchParams(window.location.search);
  const productIdFromQuery = urlParams.get('id');
  const slugTailId = slug ? String(slug).split('-').pop() : null;
  const productIdFromSlug = slugTailId && /^\d+$/.test(slugTailId) ? slugTailId : null;
  const decodedSlug = decodeURIComponent(String(slug || '')).trim();
  const normalizedSlug = generateSlug(decodedSlug);
  const identifiers = Array.from(new Set([productIdFromQuery, productIdFromSlug, decodedSlug, normalizedSlug].filter(Boolean)));

  const localProduct = useMemo(() => {
    if (!Array.isArray(storeProducts) || storeProducts.length === 0) return null;
    return (
      storeProducts.find((item) => {
        const byId = productIdFromQuery && String(item.id) === String(productIdFromQuery);
        const bySlug = decodedSlug
          ? String(item.slug || '').toLowerCase() === decodedSlug.toLowerCase() ||
            generateSlug(String(item.slug || item.name || '')) === normalizedSlug
          : false;
        return byId || bySlug;
      }) || null
    );
  }, [storeProducts, productIdFromQuery, decodedSlug, normalizedSlug]);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', ...identifiers, storeProducts.length, localProduct?.id || 'none'],
    queryFn: async () => {
      if (localProduct) {
        return {
          ...localProduct,
          image_url: localProduct.image || localProduct.image_url || '',
          images: Array.isArray(localProduct.images) ? localProduct.images : localProduct.image ? [localProduct.image] : [],
          stock_qty: localProduct.stockQty ?? localProduct.stock_qty ?? 0,
          category_id: localProduct.categoryId ?? localProduct.category_id ?? null,
          original_price: localProduct.oldPrice ?? localProduct.original_price ?? null,
          in_stock: Number(localProduct.stockQty ?? 0) > 0,
        };
      }
      if (!identifiers.length) return null;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      for (const candidate of identifiers) {
        try {
          const response = await fetch(`${apiUrl}/api/products/${encodeURIComponent(candidate)}`);
          if (!response.ok) continue;
          const data = await response.json();
          if (data.specs && typeof data.specs === 'string') {
            try {
              data.specs = JSON.parse(data.specs);
            } catch {
              data.specs = {};
            }
          }
          return data;
        } catch {
          // try next identifier
        }
      }
      return null;
    },
    enabled: Boolean(localProduct) || identifiers.length > 0,
  });

  const handleAddToCart = () => {
    if (!product?.id) return;

    const productId = String(product.id);
    const requestedQty = Math.max(1, Number(quantity || 1) || 1);
    const maxAllowed = Math.max(0, Number(getMaxAllowedQty(productId) || 0));
    const inCartQty = Math.max(0, Number(getCartQuantity(productId, null) || 0));
    const canAdd = Math.max(0, maxAllowed - inCartQty);

    if (maxAllowed <= 0 || canAdd <= 0) {
      toast.error(`Доступно максимум ${maxAllowed} шт.`);
      return;
    }

    const qtyToAdd = Math.min(requestedQty, canAdd);
    const result = addToCart(productId, qtyToAdd, null);

    if (!result?.added) {
      toast.error(`Доступно максимум ${maxAllowed} шт.`);
      return;
    }

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);

    if (qtyToAdd < requestedQty) {
      toast.info(`Добавлено ${qtyToAdd} шт. из ${requestedQty}.`);
    }
  };

  const images = useMemo(() => {
    if (!product) return [];
    const base = Array.isArray(product.images) ? product.images : [];
    const list = uniq([product.image_url, ...base]);
    if (list.length === 0) {
      return ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjMTYxNjFBIiB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjNkI2QjcwIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1PVE9UT008L3RleHQ+PC9zdmc+'];
    }
    return list;
  }, [product]);

  useEffect(() => setSelectedImage(0), [product?.id]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return storeProducts
      .filter((p) => String(p.id) !== String(product.id))
      .filter((p) => String(p.category_id || '') === String(product.category_id || '') || String(p.brand || '') === String(product.brand || ''))
      .slice(0, 4);
  }, [storeProducts, product]);

  const productStructuredData = useMemo(() => {
    if (!product) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mototom.ru';
    const productUrl = `${origin}${createProductUrl({ id: product.id, slug: product.slug, name: product.name })}`;
    const priceValue = Number(product.price || 0);
    const stockQty = Math.max(0, Number(product.stock_qty ?? product.stockQty ?? 0) || 0);
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: [product.image_url || product.image].filter(Boolean),
      description: product.description || `${product.name} в каталоге MOTOTOM.`,
      sku: String(product.id || ''),
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'RUB',
        price: Number.isFinite(priceValue) ? priceValue : 0,
        availability: stockQty > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    };
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] px-4 py-8 md:px-8">
        <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-2">
          <Skeleton className="h-[520px] rounded-2xl bg-[#16161A]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-40 bg-[#16161A]" />
            <Skeleton className="h-12 w-3/4 bg-[#16161A]" />
            <Skeleton className="h-6 w-1/4 bg-[#16161A]" />
            <Skeleton className="h-28 w-full bg-[#16161A]" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-4">
        <Seo title="Товар не найден" description="Запрашиваемый товар не найден в каталоге MOTOTOM." noindex />
        <div className="w-full max-w-xl rounded-2xl border border-[#1E1E22] bg-[#131317] p-8 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[#FAFAF9]">Товар не найден</h2>
          <p className="mb-6 text-sm text-[#A0A0A5]">Проверьте ссылку или вернитесь в каталог.</p>
          <Link to={createPageUrl('Shop')}>
            <Button className="rounded-full bg-[#54A0C5] text-white hover:bg-[#4A90B2]">Вернуться в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stockQty = Math.max(0, Number(product.stock_qty ?? 0) || 0);
  const isInStock = stockQty > 0 || !!product.in_stock;
  const lowStockUrgent = String(product.condition || '').toLowerCase() === 'new' && stockQty > 0 && stockQty < 3;
  const maxSelectableQty = stockQty > 0 ? stockQty : 99;
  const discount = product.original_price ? Math.round((1 - Number(product.price || 0) / Number(product.original_price || 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0D0D0F] pb-14 text-[#FAFAF9]">
      <Seo
        title={product.name}
        description={product.description || `${product.name}. Цена: ${formatPrice(product.price)} ₽.`}
        image={product.image_url || product.image}
        type="product"
        structuredData={productStructuredData}
      />
      <div className="border-b border-[#1E1E22] bg-[#111114]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm md:px-8">
          <div className="flex items-center gap-2 text-[#6B6B70]">
            <Link to={createPageUrl('Home')} className="hover:text-[#FAFAF9]">Главная</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={createPageUrl('Shop')} className="hover:text-[#FAFAF9]">Каталог</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="max-w-[360px] truncate text-[#A0A0A5]">{product.name}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(createPageUrl('Shop'))}
            className="inline-flex items-center gap-2 rounded-md border border-[#2A2A2E] px-3 py-2 text-xs text-[#A0A0A5] hover:text-[#FAFAF9]"
          >
            <ArrowLeft className="h-4 w-4" />
            К каталогу
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-8 lg:grid-cols-2 md:px-8">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-[#1E1E22] bg-[#16161A]">
            {discount > 0 ? <Badge className="absolute left-3 top-3 bg-[#54A0C5]">-{discount}%</Badge> : null}
            <img src={images[selectedImage]} alt={product.name} className="h-[340px] w-full object-cover sm:h-[460px] lg:h-[520px]" />
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`overflow-hidden rounded-md border ${selectedImage === idx ? 'border-[#54A0C5]' : 'border-[#2A2A2E]'}`}
                >
                  <img src={img} alt="" className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <div>
            <p className="text-sm font-medium text-[#54A0C5]">{product.brand || 'MOTOTOM'}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <div className="inline-flex items-center gap-1 text-[#A0A0A5]"><Star className="h-4 w-4 fill-[#54A0C5] text-[#54A0C5]" />{Number(product.rating || 4.8).toFixed(1)}</div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${isInStock ? 'bg-[#54A0C520] text-[#54A0C5]' : 'bg-[#F8717120] text-[#F87171]'}`}>
                {isInStock ? `В наличии${stockQty ? `: ${stockQty}` : ''}` : 'Нет в наличии'}
              </span>
            </div>
            {lowStockUrgent ? <p className="mt-2 text-xs font-medium text-[#F87171]">Успей заказать, осталось несколько штук</p> : null}
          </div>

          <div className="flex items-end gap-3 border-y border-[#1E1E22] py-4">
            <p className="text-3xl font-bold text-[#54A0C5]">{formatPrice(product.price)} ₽</p>
            {product.original_price ? <p className="text-lg text-[#6B6B70] line-through">{formatPrice(product.original_price)} ₽</p> : null}
          </div>

          <p className="text-sm leading-7 text-[#A0A0A5]">{product.description || 'Описание для товара пока не заполнено.'}</p>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-md border border-[#1E1E22] bg-[#16161A] p-3 text-center"><Truck className="mx-auto mb-2 h-4 w-4 text-[#54A0C5]" />Быстрая доставка</div>
            <div className="rounded-md border border-[#1E1E22] bg-[#16161A] p-3 text-center"><Shield className="mx-auto mb-2 h-4 w-4 text-[#54A0C5]" />Гарантия качества</div>
            <div className="rounded-md border border-[#1E1E22] bg-[#16161A] p-3 text-center"><RotateCcw className="mx-auto mb-2 h-4 w-4 text-[#54A0C5]" />Возврат 30 дней</div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-md border border-[#2A2A2E] bg-[#131318] p-1">
              <button type="button" onClick={() => setQuantity((v) => Math.max(1, v - 1))} className="h-9 w-9 rounded text-[#A0A0A5] hover:bg-[#1E1E22] hover:text-[#FAFAF9]"><Minus className="mx-auto h-4 w-4" /></button>
              <span className="min-w-10 px-2 text-center text-sm font-medium">{quantity}</span>
              <button type="button" onClick={() => setQuantity((v) => Math.min(maxSelectableQty, v + 1))} className="h-9 w-9 rounded text-[#A0A0A5] hover:bg-[#1E1E22] hover:text-[#FAFAF9]"><Plus className="mx-auto h-4 w-4" /></button>
            </div>
            <button
              type="button"
              disabled={!isInStock}
              onClick={handleAddToCart}
              className={`inline-flex h-11 items-center gap-2 rounded-md px-6 text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
                justAdded
                  ? 'bg-[#32D583] text-[#0D0D0F] scale-[1.03]'
                  : 'bg-[#54A0C5] text-[#FAFAF9] hover:bg-[#4a94b7]'
              }`}
            >
              {justAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {justAdded ? 'Добавлено' : 'В корзину'}
            </button>
          </div>
        </motion.div>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="mx-auto max-w-[1280px] px-4 md:px-8">
          <h2 className="mb-4 text-2xl font-semibold">Похожие товары</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <Link key={p.id} to={createProductUrl(p)} className="overflow-hidden rounded-lg border border-[#1E1E22] bg-[#16161A]">
                <img src={p.image_url || p.image || images[0]} alt={p.name} className="h-44 w-full object-cover" />
                <div className="space-y-2 p-4">
                  <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                  <p className="text-base font-semibold text-[#54A0C5]">{formatPrice(p.price)} ₽</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
