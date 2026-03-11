import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Check } from 'lucide-react';
import { useMotoStore } from '../src/data/motoStore.jsx';
import { createPageUrl, createProductUrl, formatPrice } from '../src/utils.js';
import Seo from '../src/components/Seo.jsx';

export default function ReadySet() {
  const { slug } = useParams();
  const { sets, products, addToCart, loading } = useMotoStore();
  const [sizeModalProduct, setSizeModalProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [addedProductId, setAddedProductId] = useState(null);
  const setItem = sets.find((item) => item.slug === slug) || sets[0] || null;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-20 text-center text-[#A0A0A5] md:px-12">
        Загрузка образа...
      </div>
    );
  }

  if (!setItem) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-20 text-center text-[#A0A0A5] md:px-12">
        Образ не найден.
      </div>
    );
  }

  const setProducts = setItem.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);

  const total = setProducts.reduce((sum, item) => sum + item.price, 0);
  const oldTotal = Math.round(total * 1.28);
  const modalSizes = Array.isArray(sizeModalProduct?.sizes) && sizeModalProduct.sizes.length > 0
    ? sizeModalProduct.sizes
    : ['M'];

  const openSizeModal = (product) => {
    setSizeModalProduct(product);
    setSelectedSize('');
  };

  const closeSizeModal = () => {
    setSizeModalProduct(null);
    setSelectedSize('');
  };

  const confirmAddToCart = () => {
    if (!sizeModalProduct || !selectedSize) return;
    const result = addToCart(sizeModalProduct.id, 1, selectedSize);
    if (result?.added) {
      setAddedProductId(sizeModalProduct.id);
      setTimeout(() => setAddedProductId(null), 900);
      setTimeout(() => closeSizeModal(), 280);
      return;
    }
    closeSizeModal();
  };

  useEffect(() => {
    const onCartAdd = (event) => {
      const addedId = event?.detail?.productId;
      if (!addedId) return;
      setAddedProductId(addedId);
      setTimeout(() => setAddedProductId(null), 900);
    };

    window.addEventListener('mototom:cart:add', onCartAdd);
    return () => window.removeEventListener('mototom:cart:add', onCartAdd);
  }, []);

  return (
    <div className="bg-[#0D0D0F] text-slate-100">
      <Seo
        title={`${setItem.name} — готовый образ`}
        description={`${setItem.name}. Готовый образ из ${setProducts.length} товаров. Суммарная стоимость ${formatPrice(total)} ₽.`}
        image={setItem.coverImage}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 text-[13px] font-normal text-[#6B6B70] md:px-12">
        Главная / Образы / <span className="text-[#54A0C5]">{setItem.name}</span>
      </div>

      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 px-4 py-6 md:px-8 lg:grid-cols-[480px_1fr] lg:gap-12 lg:px-12">
        <img
          src={setItem.coverImage}
          alt={setItem.name}
          className="h-[260px] w-full rounded-lg object-cover sm:h-[340px] lg:h-[400px]"
        />
        <div className="flex flex-col justify-center gap-5 md:gap-6">
          <h1 className="text-[36px] font-bold leading-[1] tracking-[-1px] text-[#FAFAF9] sm:text-[44px] lg:text-[56px]">
            {setItem.name}
          </h1>
          <p className="text-sm font-normal leading-[1.7] text-[#A0A0A5]">
            {setItem.description}. Этот образ сочетает в себе агрессивный внешний вид и максимальную безопасность.
            Идеален для городских поездок и дальних маршрутов.
          </p>
          <div className="flex flex-wrap items-center gap-3 border-t border-[#1E1E22] pt-5 sm:gap-4">
            <span className="text-sm text-[#A0A0A5]">{setProducts.length} товара в комплекте</span>
            <span className="hidden h-4 w-px bg-[#2A2A2E] sm:block" />
            <span className="text-[20px] font-bold text-[#54A0C5] sm:text-[22px]">{formatPrice(total)} ₽</span>
            <span className="text-base text-[#6B6B70] line-through">{formatPrice(oldTotal)} ₽</span>
          </div>
        </div>
      </section>

      <div className="mx-auto h-px w-full max-w-[1440px] bg-[#1E1E22]" />

      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-10 md:gap-8 md:px-8 md:py-12 lg:px-12">
        <h2 className="text-[20px] font-bold tracking-[-0.5px] text-[#FAFAF9] md:text-[22px]">
          Товары в этом образе
        </h2>
        <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
          {setProducts.map((product) => (
            <article key={product.id} className="flex h-full flex-col overflow-hidden rounded-lg">
              <Link to={createProductUrl(product)}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-[160px] w-full rounded-lg object-cover sm:h-[200px] lg:h-[240px]"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-2 pt-3 md:gap-2.5 md:pt-4">
                <Link
                  to={createProductUrl(product)}
                  className="line-clamp-2 min-h-[40px] text-sm text-[#FAFAF9] hover:text-[#54A0C5]"
                >
                  {product.name}
                </Link>
                <p className="text-[15px] font-semibold text-[#54A0C5]">{formatPrice(product.price)} ₽</p>
                <button
                  type="button"
                  onClick={() => openSizeModal(product)}
                  className={`mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-all duration-300 md:h-11 md:px-4 ${
                    addedProductId === product.id
                      ? 'scale-[1.03] bg-[#32D583] text-[#0D0D0F]'
                      : 'bg-[#54A0C5] text-[#FAFAF9] hover:bg-[#4a94b7]'
                  }`}
                >
                  {addedProductId === product.id ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                  <span className="hidden sm:inline">{addedProductId === product.id ? 'Добавлено' : 'В корзину'}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-5 px-4 py-10 md:px-12 md:py-14">
        <h3 className="text-xl font-semibold text-[#FAFAF9]">Хотите собрать свой образ?</h3>
        <Link
          to={createPageUrl('Shop')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1E1E22] px-8 py-3 text-sm font-medium text-[#FAFAF9]"
        >
          Перейти в каталог <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {sizeModalProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4" onClick={closeSizeModal}>
          <div
            className="w-full max-w-[460px] rounded-xl border border-[#2A2A2E] bg-[#111114] p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#FAFAF9]">Выберите размер</h3>
                <p className="mt-1 text-sm text-[#A0A0A5]">{sizeModalProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={closeSizeModal}
                className="rounded border border-[#2A2A2E] px-2 py-1 text-xs text-[#A0A0A5] hover:text-[#FAFAF9]"
              >
                Закрыть
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {modalSizes.map((size) => (
                <button
                  key={`${sizeModalProduct.id}-${size}`}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`h-10 min-w-[56px] rounded-md border px-3 text-sm font-medium transition-colors ${
                    selectedSize === size
                      ? 'border-[#54A0C5] bg-[#54A0C5] text-[#FAFAF9]'
                      : 'border-[#2A2A2E] bg-[#19191F] text-[#A0A0A5] hover:text-[#FAFAF9]'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!selectedSize}
              onClick={confirmAddToCart}
              className={`mt-5 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                sizeModalProduct && addedProductId === sizeModalProduct.id
                  ? 'bg-[#32D583] text-[#0D0D0F]'
                  : 'bg-[#54A0C5] text-[#FAFAF9]'
              }`}
            >
              {sizeModalProduct && addedProductId === sizeModalProduct.id ? 'Добавлено' : 'Добавить в корзину'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
