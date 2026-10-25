'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { fetchProductById, ApiProductDetail, ApiTopping } from '@/libs/api';

export interface Product {
  id: string;            // UUID từ backend (trước đây là number)
  name: string;
  price: number;         // basePrice
  image: string;
  stock: number;
  description?: string | null;
  category?: string;     // schema chưa có category nên để optional
}
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  sizeId: string | null;
  size: string | null;
  toppings: ApiTopping[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
interface ProductDetailProps {
  product: Product;
  onBack?: () => void;
  onAddToCart?: (item: CartItem) => void;   // đổi từ Product sang CartItem
}

export default function ProductDetail({ product, onBack, onAddToCart }: ProductDetailProps) {
  const [detail, setDetail] = useState<ApiProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  // Lấy size + topping của sản phẩm
  useEffect(() => {
    const controller = new AbortController();

    fetchProductById(product.id, controller.signal)
        .then((data) => {
          setDetail(data);
          setSelectedSizeId(data.product_size[0]?.size_id ?? null);
        })
        .catch((e) => {
          if (e.name !== 'AbortError') setError(e.message);
        })
        .finally(() => setLoading(false));

    return () => controller.abort();
  }, [product.id]);

  const sizes = detail?.product_size ?? [];
  const toppings = detail?.toppings ?? [];
  const selectedSize = sizes.find((s) => s.size_id === selectedSizeId);

  // Đơn giá 1 ly = giá gốc + phụ phí size + tổng topping
  const unitPrice = useMemo(() => {
    const sizeExtra = Number(selectedSize?.add_price ?? 0);
    const toppingExtra = toppings
        .filter((t) => selectedToppingIds.includes(t.topping_id))
        .reduce((sum, t) => sum + Number(t.price), 0);
    return product.price + sizeExtra + toppingExtra;
  }, [product.price, selectedSize, toppings, selectedToppingIds]);

  const outOfStock = product.stock <= 0;
  const maxQty = Math.max(product.stock, 1);

  const handleToppingToggle = (id: string) => {
    setSelectedToppingIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    setQuantity((q) =>
        type === 'decrease' ? Math.max(1, q - 1) : Math.min(maxQty, q + 1),
    );
  };

  const handleAdd = () => {
    const orderData: CartItem = {
      productId: product.id,
      name: product.name,
      image: product.image,
      sizeId: selectedSize?.size_id ?? null,
      size: selectedSize?.size ?? null,
      toppings: toppings.filter((t) => selectedToppingIds.includes(t.topping_id)),
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };

    if (onAddToCart) {
      onAddToCart(orderData);
    } else {
      alert(`Đã thêm ${quantity}x ${product.name}${selectedSize ? ` (Size ${selectedSize.size})` : ''} vào giỏ hàng!`);
    }
  };

  return (
      <div className="w-full max-w-5xl mx-auto py-4">
        {onBack && (
            <button
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6F4E37] hover:text-[#2B100C] transition-colors cursor-pointer"
            >
              ← Quay lại danh sách
            </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Cột trái */}
          <div className="md:col-span-5 flex justify-center">
            <div className="bg-white rounded-3xl p-6 shadow-sm w-full max-w-sm flex flex-col items-center">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-6 bg-gray-100">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>

              <h2 className="text-2xl font-extrabold capitalize text-[#2B100C] self-start mb-1">
                {product.name}
              </h2>
              {product.description && (
                  <p className="text-sm text-[#6F4E37] self-start mb-4">{product.description}</p>
              )}

              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#2B100C] text-xl font-bold">
                  <svg className="w-5 h-5 text-[#6F4E37]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {/* Giá thay đổi theo size và topping đã chọn */}
                  <span>{unitPrice.toLocaleString('vi-VN')}</span>
                </div>

                <div className="flex items-center bg-[#6F4E37] text-white rounded-xl px-3 py-1.5 gap-3 shadow-sm">
                  <button
                      type="button"
                      onClick={() => handleQuantityChange('increase')}
                      disabled={outOfStock || quantity >= maxQty}
                      className="text-lg font-bold hover:opacity-80 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <span className="text-base font-bold min-w-[16px] text-center select-none">{quantity}</span>
                  <button
                      type="button"
                      onClick={() => handleQuantityChange('decrease')}
                      className="text-lg font-bold hover:opacity-80 cursor-pointer select-none"
                  >
                    -
                  </button>
                </div>
              </div>

              <p className={`self-start mt-3 text-xs ${outOfStock ? 'text-red-600' : 'text-[#6F4E37]'}`}>
                {outOfStock ? 'Hết hàng' : `Còn ${product.stock} sản phẩm`}
              </p>
            </div>
          </div>

          {/* Cột phải */}
          <div className="md:col-span-7 flex flex-col items-center text-center">
            {loading && <p className="text-[#6F4E37] mb-8">Đang tải tùy chọn...</p>}
            {error && <p className="text-red-600 mb-8">{error}</p>}

            {!loading && !error && (
                <>
                  {sizes.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-xl font-bold capitalize text-[#2B100C] mb-4">size</h3>
                        <div className="flex items-center justify-center gap-4">
                          {sizes.map((s) => (
                              <button
                                  key={s.size_id}
                                  type="button"
                                  onClick={() => setSelectedSizeId(s.size_id)}
                                  className={`min-w-14 h-10 px-3 rounded-xl text-base font-bold transition-all shadow-sm cursor-pointer ${
                                      selectedSizeId === s.size_id
                                          ? 'bg-[#2B100C] text-[#F2ECE4]'
                                          : 'bg-[#6F4E37] text-[#F2ECE4] hover:opacity-90'
                                  }`}
                              >
                                {s.size}
                                {Number(s.add_price) > 0 && (
                                    <span className="ml-1 text-xs font-normal">
                            +{Number(s.add_price).toLocaleString('vi-VN')}
                          </span>
                                )}
                              </button>
                          ))}
                        </div>
                      </div>
                  )}

                  {toppings.length > 0 && (
                      <div className="mb-10 w-full max-w-md">
                        <h3 className="text-xl font-bold capitalize text-[#2B100C] mb-6">topping</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-left pl-6 sm:pl-12">
                          {toppings.map((t) => (
                              <label
                                  key={t.topping_id}
                                  className="flex items-center gap-3 text-[#2B100C] text-sm font-medium cursor-pointer select-none"
                              >
                                <input
                                    type="checkbox"
                                    checked={selectedToppingIds.includes(t.topping_id)}
                                    onChange={() => handleToppingToggle(t.topping_id)}
                                    className="w-4 h-4 accent-[#2B100C] rounded cursor-pointer"
                                />
                                <span>
                          {t.topping_name}
                                  <span className="text-[#6F4E37]"> (+{Number(t.price).toLocaleString('vi-VN')})</span>
                        </span>
                              </label>
                          ))}
                        </div>
                      </div>
                  )}
                </>
            )}

            <button
                type="button"
                onClick={handleAdd}
                disabled={loading || !!error || outOfStock}
                className="w-full max-w-xs bg-[#6F4E37] text-[#F2ECE4] text-base font-bold py-3.5 px-8 rounded-2xl hover:bg-[#2B100C] transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {outOfStock ? 'Hết hàng' : `Add to cart · ${(unitPrice * quantity).toLocaleString('vi-VN')}`}
            </button>
          </div>
        </div>
      </div>
  );
}