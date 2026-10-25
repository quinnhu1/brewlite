'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { categories } from '@/data/products';

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Lấy category từ URL, nếu không có mặc định là danh mục đầu tiên
  const currentCategory = searchParams.get('category') || categories[0].name;

  const handleSelect = (categoryName: string) => {
    // Thay đổi URL mà không làm load lại toàn bộ trang (soft navigation)
    router.push(`/menu?category=${encodeURIComponent(categoryName)}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-4 mb-10">
      {categories.map((cat) => {
        const isActive = currentCategory === cat.name;
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => handleSelect(cat.name)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm cursor-pointer ${
              isActive
                ? 'bg-[#2B100C] text-[#F2ECE4] shadow-md scale-105'
                : 'bg-[#6F4E37] text-[#F2ECE4] hover:opacity-90'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}