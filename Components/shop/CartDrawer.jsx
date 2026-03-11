import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../src/utils.js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../Components/ui/sheet.jsx";
import { Button } from "../../Components/ui/button.jsx";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer({
  open,
  onClose,
  cartItems,
  products,
  onUpdateQuantity,
  onRemoveItem,
  isLoading = false,
}) {
  const getProduct = (productId) => products.find((p) => p.id === productId);

  const subtotal = cartItems.reduce((sum, item) => {
    const product = getProduct(item.product_id);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="space-y-1">
          <SheetTitle className="text-2xl font-bold">{'\u041a\u043e\u0440\u0437\u0438\u043d\u0430'}</SheetTitle>
          <p className="text-sm text-slate-500">
            {cartItems.length}{' '}
            {cartItems.length === 1
              ? '\u0442\u043e\u0432\u0430\u0440'
              : cartItems.length < 5
                ? '\u0442\u043e\u0432\u0430\u0440\u0430'
                : '\u0442\u043e\u0432\u0430\u0440\u043e\u0432'}
          </p>
        </SheetHeader>

        <div className="-mx-6 flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">{'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043a\u043e\u0440\u0437\u0438\u043d\u044b...'}</p>
              </div>
            ) : cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <ShoppingBag className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-800">{'\u041a\u043e\u0440\u0437\u0438\u043d\u0430 \u043f\u0443\u0441\u0442\u0430'}</h3>
                <p className="mb-6 text-sm text-slate-500">{'\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0442\u043e\u0432\u0430\u0440\u044b \u0434\u043b\u044f \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u044f \u0437\u0430\u043a\u0430\u0437\u0430'}</p>
                <Button onClick={onClose} variant="outline" className="rounded-full">
                  {'\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u043f\u043e\u043a\u0443\u043f\u043a\u0438'}
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = getProduct(item.product_id);
                  if (!product) return null;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 rounded-xl bg-slate-50 p-3"
                    >
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-white p-2">
                        <img
                          src={product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0PC90ZXh0Pjwvc3ZnPg=='}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-1 text-sm font-medium text-slate-800">{product.name}</h4>
                        <p className="mb-2 text-xs text-slate-500">{product.brand}</p>
                        <p className="font-semibold text-slate-900">{product.price?.toLocaleString('ru-RU')} {'\u20bd'}</p>
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem(item.id)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-2 rounded-full bg-white px-1 py-0.5 shadow-sm">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 rounded-full"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 rounded-full"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {cartItems.length > 0 && (
          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{'\u0418\u0442\u043e\u0433\u043e'}</span>
              <span className="text-2xl font-bold text-slate-900">{subtotal.toLocaleString('ru-RU')} {'\u20bd'}</span>
            </div>
            <p className="mb-8 text-xs text-slate-500">{'\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430 \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u044b\u0432\u0430\u0435\u0442\u0441\u044f \u043f\u0440\u0438 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0438'}</p>
            <Link to={createPageUrl('Checkout')} onClick={onClose} className="mt-2 block">
              <Button className="h-12 w-full rounded-full bg-slate-900 font-medium text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl">
                {'\u041e\u0444\u043e\u0440\u043c\u0438\u0442\u044c \u0437\u0430\u043a\u0430\u0437'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
