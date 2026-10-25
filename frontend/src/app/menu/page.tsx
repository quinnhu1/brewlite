'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Product {
  productId: string;
  productName: string;
  description?: string;
  basePrice: string;
  imageUrl: string | null;
  stock?: number;
  categories: string;
  isBestSeller?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const PLACEHOLDER_IMAGE = '/images/espresso.jpg';

// 5 tab cố định theo Figma
const CATEGORIES = ['Classic Coffee', 'Cold & Brewed', 'Tea', 'Pastry & Dessert', 'Best Sellers'];

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${API_URL}/products`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Product[]) => setProducts(data))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Lỗi gọi API:', err);
          setError('Không tải được dữ liệu. Kiểm tra server API (cổng 3001).');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  // Tab đang chọn: tab vừa bấm > ?category= trên URL > tab đầu tiên
  const activeTab = useMemo(() => {
    if (selectedTab) return selectedTab;
    return CATEGORIES.find((c) => norm(c) === norm(urlCategory)) ?? CATEGORIES[0];
  }, [selectedTab, urlCategory]);

  const handleTabClick = (cat: string) => {
    setSelectedTab(cat);
    router.replace(`/menu?category=${encodeURIComponent(cat)}`, { scroll: false });
  };

  // Tạm thời dùng 1 ảnh cho tất cả sản phẩm
  const getImageUrl = (_url?: string | null) => PLACEHOLDER_IMAGE;

  const filteredProducts = products.filter((p) =>
    activeTab === 'Best Sellers'
      ? p.isBestSeller || norm(p.categories) === 'best sellers'
      : norm(p.categories) === norm(activeTab)
  );

  return (
    <div className="w-full bg-[#F2ECE4] min-h-screen px-8 md:px-16 pt-32 pb-10">
      <div className="flex gap-4 justify-center mb-12 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleTabClick(cat)}
            className={`px-8 py-2.5 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeTab === cat ? 'bg-[#3A1F19] text-white' : 'bg-[#7E5E4E] text-white hover:bg-[#5A382C]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-xl text-[#4A2B20] py-10 font-medium animate-pulse">
          Đang tải dữ liệu...
        </p>
      ) : error ? (
        <p className="text-center text-lg text-red-600 py-10">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.productId} className="bg-white rounded-xl p-4 shadow-sm flex flex-col">
                <Link href={`/menu/${product.productId}`} className="block w-full h-56 relative mb-4">
                  <Image
                    src={getImageUrl(product.imageUrl)}
                    alt={product.productName}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </Link>
                <h3 className="font-bold text-xl text-[#2B100C] mb-3">{product.productName}</h3>
                <div className="w-full flex justify-between items-center mt-auto">
                  <span className="font-bold text-lg text-[#1A1A1A]">
                    {Number(product.basePrice).toLocaleString('vi-VN')}đ
                  </span>
                  <Link
                    href={`/menu/${product.productId}`}
                    aria-label={`Chọn ${product.productName}`}
                    className="w-7 h-7 bg-[#7E5E4E] text-white rounded-full flex items-center justify-center hover:bg-[#3A1F19] text-lg leading-none"
                  >
                    +
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-lg text-gray-500">
                Chưa có sản phẩm nào trong danh mục "{activeTab}".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// useSearchParams bắt buộc phải bọc trong Suspense
export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <MenuContent />
    </Suspense>
  );
}