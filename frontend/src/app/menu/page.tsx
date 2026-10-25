'use client';

import { useState,useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import CategoryFilter from '@/components/menu/category-filter';
import ProductDetail, { Product } from '@/components/menu/product-detail';
import { fetchProducts } from '@/libs/api';


const categories = [
  'Classic Coffee',
  'Cold & Brewed',
  'Tea',
  'Pastry & Dessert',
  'Best Sellers',
];

const FALLBACK_IMAGE = '/imghome/home1.png';

export default function MenuPage() {
    const [activeCategory, setActiveCategory] = useState('Classic Coffee');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        fetchProducts(controller.signal)
            .then((data) =>
                setProducts(
                    data.map((p) => ({
                        id: p.productId,
                        name: p.productName,
                        price: Number(p.basePrice),
                        image: p.imageUrl ?? FALLBACK_IMAGE,
                        category: p.categories ?? undefined,
                        stock: p.stock,
                        description: p.description,
                    })),
                ),
            )
            .catch((e) => {
                if (e.name !== 'AbortError') setError(e.message);
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, []);
    const normalize = (s?: string | null) => (s ?? '').trim().toLowerCase();
    const filteredProducts = products.filter(
        (p) =>
            activeCategory === 'Best Sellers' ||
            normalize(p.category) === normalize(activeCategory),
    );

  return (
    <div className="min-h-screen bg-[#F2ECE4] flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow px-6 md:px-16 pt-28 pb-16 max-w-7xl mx-auto w-full">
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

      <Footer />
    </div>
  );
}