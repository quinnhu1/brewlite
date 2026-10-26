'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CategoryFilter from '@/components/menu/category-filter';
import { fetchProducts, ApiProduct } from '@/libs/api';
import {
  getProductImageUrl,
  MENU_CATEGORIES,
  normalizeCategory,
} from '@/data/categories';

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category');

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCategory = useMemo(
    () => MENU_CATEGORIES.find((category) => normalizeCategory(category) === normalizeCategory(urlCategory))
      ?? MENU_CATEGORIES[0],
    [urlCategory],
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal)
      .then(setProducts)
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(
          reason instanceof Error
            ? reason.message
            : 'Không tải được menu. Vui lòng kiểm tra kết nối API.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleSelectCategory = (category: string) => {
    router.replace(`/menu?category=${encodeURIComponent(category)}`, { scroll: false });
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Best Sellers') {
      return products.filter((product) => product.isBestSeller === true);
    }

    return products.filter(
      (product) => normalizeCategory(product.categories) === normalizeCategory(activeCategory),
    );
  }, [activeCategory, products]);

  return (
    <div className="w-full bg-[#F2ECE4] min-h-screen px-6 md:px-16 pt-28 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-xs uppercase tracking-wider text-[#6F4E37] font-semibold mb-6">
          Menu / {activeCategory}
        </div>

        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {loading ? (
          <p role="status" className="text-center text-xl text-[#4A2B20] py-10 font-medium animate-pulse">
            Đang tải menu...
          </p>
        ) : error ? (
          <div className="text-center py-10" role="alert">
            <p className="text-lg text-red-600">{error}</p>
            <p className="text-sm text-gray-600 mt-2">
              Hãy kiểm tra backend tại địa chỉ được cấu hình trong NEXT_PUBLIC_API_URL.
            </p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <article
                key={product.productId}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <Link
                  href={`/menu/${product.productId}`}
                  aria-label={`Xem chi tiết ${product.productName}`}
                  className="block relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-gray-100"
                >
                  <Image
                    src={getProductImageUrl(product.imageUrl)}
                    alt={product.productName}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </Link>

                <h2 className="text-lg font-bold text-[#2B100C] mb-2">
                  {product.productName}
                </h2>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                  <span className="font-semibold text-[#2B100C]">
                    {Number(product.basePrice).toLocaleString('vi-VN')}đ
                  </span>
                  <Link
                    href={`/menu/${product.productId}`}
                    aria-label={`Chọn ${product.productName}`}
                    className="w-9 h-9 shrink-0 rounded-full bg-[#6F4E37] text-white flex items-center justify-center hover:bg-[#2B100C] transition-colors"
                  >
                    <span aria-hidden="true" className="text-xl leading-none">+</span>
                  </Link>
                </div>
                {product.stock <= 0 && (
                  <p className="text-xs text-red-600 mt-2">Tạm hết hàng</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="col-span-full text-center py-20">
            <p className="text-lg text-gray-600">
              Chưa có sản phẩm nào trong danh mục “{activeCategory}”.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<p role="status" className="py-16 text-center text-[#2B100C]">Đang mở menu...</p>}>
      <MenuContent />
    </Suspense>
  );
}
