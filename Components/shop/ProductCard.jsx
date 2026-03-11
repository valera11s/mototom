import React, { useEffect, useState, forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatPrice, createProductUrl } from '../../src/utils.js';
import { Card } from "../ui/card.jsx";
import { Badge } from "../ui/badge.jsx";
import { Button } from "../ui/button.jsx";
import { Star, ShoppingBag, Check } from 'lucide-react';
import { motion } from 'framer-motion';

// РЈС‚РёР»РёС‚Р° РґР»СЏ СЃРѕС…СЂР°РЅРµРЅРёСЏ РїРѕР·РёС†РёРё СЃРєСЂРѕР»Р»Р° РїСЂРё РїРµСЂРµС…РѕРґРµ РЅР° С‚РѕРІР°СЂ
function saveShopScrollPosition() {
  if (window.location.pathname.includes('/shop')) {
    sessionStorage.setItem('shop_scroll_position', window.scrollY.toString());
    sessionStorage.setItem('navigation_from_shop', 'true');
  }
}

const ProductCard = forwardRef(function ProductCard({ product, onAddToCart }, ref) {
  const location = useLocation();
  const [justAdded, setJustAdded] = useState(false);
  const discount = product.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  useEffect(() => {
    const onCartAdd = (event) => {
      const addedProductId = event?.detail?.productId;
      if (String(addedProductId) !== String(product.id)) return;
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 900);
    };

    window.addEventListener('mototom:cart:add', onCartAdd);
    return () => window.removeEventListener('mototom:cart:add', onCartAdd);
  }, [product.id]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    onAddToCart(product);
  };

  const handleProductClick = () => {
    // РЎРѕС…СЂР°РЅСЏРµРј РїРѕР·РёС†РёСЋ СЃРєСЂРѕР»Р»Р° Рё СЃРѕСЃС‚РѕСЏРЅРёРµ С„РёР»СЊС‚СЂРѕРІ С‚РѕР»СЊРєРѕ РµСЃР»Рё РјС‹ РЅР° СЃС‚СЂР°РЅРёС†Рµ РєР°С‚Р°Р»РѕРіР°
    if (location.pathname.includes('/shop')) {
      saveShopScrollPosition();
      // РЎРѕС…СЂР°РЅСЏРµРј СЃРѕСЃС‚РѕСЏРЅРёРµ С„РёР»СЊС‚СЂРѕРІ РёР· URL РёР»Рё РёР· РіР»РѕР±Р°Р»СЊРЅРѕРіРѕ СЃРѕСЃС‚РѕСЏРЅРёСЏ
      // Р¤РёР»СЊС‚СЂС‹ Р±СѓРґСѓС‚ СЃРѕС…СЂР°РЅРµРЅС‹ С‡РµСЂРµР· props РёР»Рё РјРѕР¶РЅРѕ РїРѕР»СѓС‡РёС‚СЊ РёС… РёР· sessionStorage
    }
  };

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card className="group overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl">
        <Link to={createProductUrl(product)} onClick={handleProductClick}>
          <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-hidden">
            {/* Р‘РµР№РґР¶Рё РґР»СЏ СЃРєРёРґРєРё, РїРѕРїСѓР»СЏСЂРЅРѕСЃС‚Рё Рё Р°РєС†РёРѕРЅРЅРѕСЃС‚Рё */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {discount > 0 && (
                <Badge className="bg-rose-500 text-white font-medium px-3 py-1 rounded-full">
                  -{discount}%
                </Badge>
              )}
              {product.on_sale && !discount && (
                <Badge className="bg-green-500 text-white font-medium px-3 py-1 rounded-full">
                  Р’С‹РіРѕРґРЅР°СЏ С†РµРЅР°
                </Badge>
              )}
            </div>
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              {product.popular && (
                <Badge className="bg-purple-500 text-white font-medium px-3 py-1 rounded-full">
                  РџРѕРїСѓР»СЏСЂРЅРѕРµ
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-amber-500 text-white font-medium px-3 py-1 rounded-full">
                  РҐРёС‚ РїСЂРѕРґР°Р¶
                </Badge>
              )}
            </div>
            <img
              src={product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+'}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-0"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+';
              }}
            />
          </div>
        </Link>
        
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                {product.brand}
              </span>
              {product.condition && (
                <Badge 
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    product.condition === 'new' || product.condition === 'РќРѕРІРѕРµ' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {product.condition === 'new' || product.condition === 'РќРѕРІРѕРµ' ? 'РќРѕРІС‹Р№' : 
                   product.condition === 'used' || product.condition === 'Р‘/РЈ' ? 'Р‘/РЈ' : 
                   product.condition}
                </Badge>
              )}
            </div>
            {product.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-slate-600">{product.rating}</span>
              </div>
            )}
          </div>
          
          <Link to={createProductUrl(product)} onClick={handleProductClick}>
            <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-slate-600 transition-colors">
              {product.category_product_name_prefix 
                ? `${product.category_product_name_prefix} ${product.name}`
                : product.name}
            </h3>
          </Link>
          
          <p className="text-xs text-slate-500 mt-1">РђСЂС‚РёРєСѓР»: {product.id}</p>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">
                {formatPrice(product.price)} в‚Ѕ
              </span>
              {product.original_price && (
                <span className="text-sm text-slate-400 line-through">
                  {formatPrice(product.original_price)} в‚Ѕ
                </span>
              )}
            </div>
            
            <Button
              size="icon"
              onClick={handleAddToCart}
              
              className={`h-10 w-10 rounded-full transition-all shadow-lg hover:shadow-xl relative overflow-hidden ${
                justAdded 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-slate-900 hover:bg-slate-700'
              }`}
            >
              <motion.div
                initial={false}
                animate={{ 
                  scale: justAdded ? [1, 1.2, 1] : 1,
                  rotate: justAdded ? [0, 180, 360] : 0
                }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {justAdded ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-white" />
                )}
              </motion.div>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

export default ProductCard;

