'use client';

import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-10">
      {categories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm cursor-pointer ${
              isActive
                ? 'bg-[#2B100C] text-[#F2ECE4] shadow-md scale-105'
                : 'bg-[#6F4E37] text-[#F2ECE4] hover:opacity-90'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}