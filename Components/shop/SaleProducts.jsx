import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../src/utils.js';
import { Button } from "../../Components/ui/button.jsx";
import { ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

export default function SaleProducts({ products, onAddToCart }) {
  // Фильтруем товары со скидкой (у которых есть original_price)
  const saleProducts = products.filter(p => p.original_price && p.original_price > p.price).slice(0, 8);
  const displayProducts = saleProducts.length > 0 ? saleProducts : products.slice(0, 4);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
              Товары со скидкой
            </h2>
            <p className="text-slate-500 max-w-lg">
              Специальные предложения и выгодные цены на премиальную технику
            </p>
          </div>
          <Link to={createPageUrl('Shop')}>
            <Button variant="ghost" className="group text-slate-600 hover:text-slate-900">
              Смотреть все
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



