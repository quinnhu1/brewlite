'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface ProductDetailProps {
  product: Product;
  onBack?: () => void;
  onAddToCart?: (orderData: any) => void;
}

const toppings = [
  'kem trứng', 'kem trứng',
  'kem trứng', 'kem trứng',
  'kem trứng', 'kem trứng',
  'kem trứng', 'kem trứng',
];

export default function ProductDetail({ product, onBack, onAddToCart }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<'S' | 'M'>('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  const handleToppingToggle = (toppingName: string, index: number) => {
    const key = `${toppingName}-${index}`;
    setSelectedToppings((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    if (type === 'decrease' && quantity > 1) {
      setQuantity(quantity - 1);
    } else if (type === 'increase') {
      setQuantity(quantity + 1);
    }
  };

  const handleAdd = () => {
    const orderData = {
      product,
      size: selectedSize,
      toppings: selectedToppings,
      quantity,
      totalPrice: product.price * quantity,
    };

    if (onAddToCart) {
      onAddToCart(orderData);
    } else {
      alert(`Đã thêm ${quantity}x ${product.name} (Size ${selectedSize}) vào giỏ hàng!`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      {/* Nút Back */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6F4E37] hover:text-[#2B100C] transition-colors cursor-pointer"
        >
          ← Back
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Cột trái: Card sản phẩm với bộ tăng giảm số lượng */}
        <div className="md:col-span-5 flex justify-center">
          <div className="bg-white rounded-3xl p-6 shadow-sm w-full max-w-sm flex flex-col items-center">
            {/* Hình ảnh sản phẩm */}
            <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-6 bg-gray-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>

            {/* Tên sản phẩm */}
            <h2 className="text-2xl font-extrabold capitalize text-[#2B100C] self-start mb-4">
              {product.name}
            </h2>

            {/* Giá tiền và Thanh tăng giảm số lượng */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#2B100C] text-xl font-bold">
                <svg
                  className="w-5 h-5 text-[#6F4E37]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <span>{product.price.toLocaleString('vi-VN')}</span>
              </div>

              {/* Thanh chọn số lượng [ +  1  - ] */}
              <div className="flex items-center bg-[#6F4E37] text-white rounded-xl px-3 py-1.5 gap-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleQuantityChange('increase')}
                  className="text-lg font-bold hover:opacity-80 cursor-pointer select-none"
                >
                  +
                </button>
                <span className="text-base font-bold min-w-[16px] text-center select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange('decrease')}
                  className="text-lg font-bold hover:opacity-80 cursor-pointer select-none"
                >
                  -
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Tùy chọn Size, Topping và nút Add to cart */}
        <div className="md:col-span-7 flex flex-col items-center text-center">
          {/* Tùy chọn Size */}
          <div className="mb-8">
            <h3 className="text-xl font-bold capitalize text-[#2B100C] mb-4">size</h3>
            <div className="flex items-center justify-center gap-4">
              {(['S', 'M'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`w-14 h-10 rounded-xl text-base font-bold transition-all shadow-sm cursor-pointer ${
                    selectedSize === size
                      ? 'bg-[#2B100C] text-[#F2ECE4]'
                      : 'bg-[#6F4E37] text-[#F2ECE4] hover:opacity-90'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Tùy chọn Topping */}
          <div className="mb-10 w-full max-w-md">
            <h3 className="text-xl font-bold capitalize text-[#2B100C] mb-6">topping</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-left pl-6 sm:pl-12">
              {toppings.map((item, idx) => {
                const itemKey = `${item}-${idx}`;
                const isChecked = selectedToppings.includes(itemKey);
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-3 text-[#2B100C] text-sm font-medium cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToppingToggle(item, idx)}
                      className="w-4 h-4 accent-[#2B100C] rounded cursor-pointer"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Nút Add to cart */}
          <button
            type="button"
            onClick={handleAdd}
            className="w-full max-w-xs bg-[#6F4E37] text-[#F2ECE4] text-base font-bold py-3.5 px-8 rounded-2xl hover:bg-[#2B100C] transition-all shadow-md cursor-pointer"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}