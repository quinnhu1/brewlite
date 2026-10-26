'use client';

import { MENU_CATEGORIES } from '@/data/categories';

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  activeCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-10" aria-label="Lọc danh mục sản phẩm">
      {MENU_CATEGORIES.map((category) => {
        const isActive = activeCategory === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            aria-pressed={isActive}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm cursor-pointer ${
              isActive
                ? 'bg-[#2B100C] text-[#F2ECE4] shadow-md'
                : 'bg-[#6F4E37] text-[#F2ECE4] hover:bg-[#4E3527]'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
