'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import CategoryFilter from '@/components/menu/category-filter';
import ProductDetail, { Product } from '@/components/menu/product-detail';
import { fetchProducts } from '@/libs/api';

const FALLBACK_IMAGE = '/imghome/home1.png';

const categories = [
  'Classic Coffee',
  'Cold & Brewed',
  'Tea',
  'Pastry & Dessert',
  'Best Sellers',
];

function MenuContent() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || categories[0];
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gọi API lấy danh sách sản phẩm từ backend của bạn Minh Thiên
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
  
  // Lọc sản phẩm theo danh mục từ URL query params
  const filteredProducts = products.filter(
    (p) =>
      activeCategory === 'Best Sellers' ||
      normalize(p.category) === normalize(activeCategory),
  );

  return (
    <main className="min-h-screen bg-[#F2ECE4] px-6 md:px-16 pt-28 pb-16 max-w-7xl mx-auto w-full">
      {/* Tiêu đề trang */}
      <div className="text-xs uppercase tracking-wider text-[#6F4E37] font-semibold mb-6">
        Menu / {activeCategory}
      </div>

      {/* Thanh lọc danh mục đổi URL */}
      <CategoryFilter />

      {/* 1. LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-28 w-full">
          <div className="w-12 h-12 border-4 border-[#6F4E37] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#2B100C] font-semibold text-sm">Đang tải thực đơn...</p>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto my-16 shadow-sm">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#6F4E37] text-[#F2ECE4] rounded-xl text-sm font-bold hover:bg-[#2B100C] transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. NỘI DUNG CHÍNH KHI ĐÃ TẢI XONG */}
      {!loading && !error && (
        <>
          {/* Nếu đã chọn sản phẩm -> Hiển thị chi tiết */}
          {selectedProduct ? (
            <ProductDetail
              product={selectedProduct}
              onBack={() => setSelectedProduct(null)}
            />
          ) : (
            <>
              {/* EMPTY STATE */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-white/50 rounded-3xl border border-[#6F4E37]/10 my-6">
                  <p className="text-[#6F4E37] text-base font-medium">
                    Hiện chưa có sản phẩm nào trong danh mục <span className="font-bold">"{activeCategory}"</span>.
                  </p>
                </div>
              ) : (
                /* Lưới sản phẩm */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id || index}
                      onClick={() => setSelectedProduct(product)}
                      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-gray-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold capitalize text-[#2B100C] mb-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[#2B100C] font-semibold">
                            <svg className="w-4 h-4 text-[#6F4E37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>{product.price.toLocaleString('vi-VN')}</span>
                          </div>

                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                            }}
                            className="w-8 h-8 rounded-full bg-[#6F4E37] text-white flex items-center justify-center hover:bg-[#2B100C] transition-colors shadow cursor-pointer"
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
            </>
          )}
        </>
      )}
    </main>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2ECE4] flex items-center justify-center text-[#2B100C]">Loading menu...</div>}>
      <MenuContent />
    </Suspense>
  );
}