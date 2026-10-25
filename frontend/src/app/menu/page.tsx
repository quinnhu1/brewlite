'use client';

import { useState } from 'react';
import Image from 'next/image';
import CategoryFilter from '@/components/menu/category-filter';
import ProductDetail, { Product } from '@/components/menu/product-detail';

const categories = [
  'Classic Coffee',
  'Cold & Brewed',
  'Tea',
  'Pastry & Dessert',
  'Best Sellers',
];

const products: Product[] = [
  { id: 1, name: 'espresso', price: 40000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 2, name: 'espresso', price: 40000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 3, name: 'espresso', price: 40000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 4, name: 'espresso', price: 40000, category: 'Classic Coffee', image: '/images/espresso.jpg' },
  { id: 5, name: 'espresso', price: 40000, category: 'Cold & Brewed', image: '/images/espresso.jpg' },
  { id: 6, name: 'espresso', price: 40000, category: 'Cold & Brewed', image: '/images/espresso.jpg' },
  { id: 7, name: 'espresso', price: 40000, category: 'Tea', image: '/images/espresso.jpg' },
  { id: 8, name: 'espresso', price: 40000, category: 'Best Sellers', image: '/images/espresso.jpg' },
];

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('Classic Coffee');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = activeCategory === 'Best Sellers' 
    ? products 
    : products.filter(p => p.category === activeCategory || p.category === 'Classic Coffee');

  return (
    <main className="min-h-screen bg-[#F2ECE4] px-6 md:px-16 pt-28 pb-16 max-w-7xl mx-auto w-full">
      {/* Tiêu đề trang */}
      <div className="text-xs uppercase tracking-wider text-[#6F4E37] font-semibold mb-6">Menu</div>

      {/* Bộ lọc Danh mục luôn giữ ở trên */}
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setSelectedProduct(null); // Reset chi tiết khi đổi danh mục
        }}
      />

      {/* Nếu đã chọn sản phẩm -> Hiển thị màn hình Chi tiết sản phẩm */}
      {selectedProduct ? (
        <ProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
        />
      ) : (
        /* Nếu chưa chọn -> Hiển thị Danh sách Lưới sản phẩm */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <div
              key={index}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              {/* Hình ảnh */}
              <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>

              {/* Thông tin */}
              <div>
                <h3 className="text-lg font-bold capitalize text-[#2B100C] mb-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#2B100C] font-semibold">
                    <svg 
                      className="w-4 h-4 text-[#6F4E37]" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{product.price.toLocaleString('vi-VN')}</span>
                  </div>

                  {/* Nút + mở chi tiết */}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    className="w-8 h-8 rounded-full bg-[#6F4E37] text-white flex items-center justify-center hover:bg-[#2B100C] transition-colors shadow cursor-pointer"
                    title="Chọn tùy chọn"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}