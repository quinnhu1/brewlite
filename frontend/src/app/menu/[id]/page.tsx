'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Product {
  productId: string;
  productName: string;
  description?: string;
  basePrice: string;
  imageUrl: string | null;
  stock?: number;
  categories: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const PLACEHOLDER_IMAGE = '/images/espresso.jpg';
const CATEGORIES = ['Classic Coffee', 'Cold & Brewed', 'Tea', 'Pastry & Dessert', 'Best Sellers'];

// Size và topping chưa có trong DB nên tạm khai báo cứng (giá cộng thêm, đơn vị đồng)
const SIZES = [
  { label: 'S', extra: 0 },
  { label: 'M', extra: 5000 },
];
const TOPPINGS = [
  { id: 't1', name: 'Kem trứng', price: 5000 },
  { id: 't2', name: 'Trân châu đen', price: 5000 },
  { id: 't3', name: 'Thạch dừa', price: 5000 },
  { id: 't4', name: 'Pudding', price: 7000 },
  { id: 't5', name: 'Trân châu trắng', price: 5000 },
  { id: 't6', name: 'Sương sáo', price: 5000 },
  { id: 't7', name: 'Kem cheese', price: 10000 },
  { id: 't8', name: 'Thạch matcha', price: 7000 },
];

const formatVND = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [size, setSize] = useState('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        // Thử endpoint /products/:id trước
        const single = await fetch(`${API_URL}/products/${id}`, { signal: controller.signal });
        if (single.ok) {
          setProduct(await single.json());
          return;
        }
        // Backend chưa có endpoint đó: lấy cả danh sách rồi tìm theo id
        const list = await fetch(`${API_URL}/products`, { signal: controller.signal });
        if (!list.ok) throw new Error(`HTTP ${list.status}`);
        const data: Product[] = await list.json();
        const found = data.find((p) => String(p.productId) === String(id));
        if (!found) throw new Error('NOT_FOUND');
        setProduct(found);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Lỗi gọi API:', err);
        setError(err.message === 'NOT_FOUND' ? 'Không tìm thấy sản phẩm.' : 'Không tải được dữ liệu sản phẩm.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [id]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const sizeExtra = SIZES.find((s) => s.label === size)?.extra ?? 0;
    const toppingTotal = TOPPINGS.filter((t) => selectedToppings.includes(t.id)).reduce(
      (sum, t) => sum + t.price,
      0
    );
    return Number(product.basePrice) + sizeExtra + toppingTotal;
  }, [product, size, selectedToppings]);

  const total = unitPrice * quantity;

  const toggleTopping = (tid: string) =>
    setSelectedToppings((prev) => (prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]));

  const handleAddToCart = () => {
    if (!product) return;
    const item = {
      productId: product.productId,
      productName: product.productName,
      imageUrl: PLACEHOLDER_IMAGE,
      size,
      toppings: TOPPINGS.filter((t) => selectedToppings.includes(t.id)).map((t) => t.name),
      quantity,
      unitPrice,
    };

    try {
      const raw = localStorage.getItem('cart');
      const cart = raw ? JSON.parse(raw) : [];
      cart.push(item);
      localStorage.setItem('cart', JSON.stringify(cart));
      setMessage('Đã thêm vào giỏ hàng!');
    } catch {
      setMessage('Không thể lưu giỏ hàng.');
    }
    setTimeout(() => setMessage(null), 2500);
  };

  return (
    <div className="w-full bg-[#F2ECE4] min-h-screen px-8 md:px-16 pt-32 pb-10">
      {/* Tabs: bấm để quay về menu đúng danh mục */}
      <div className="flex gap-4 justify-center mb-12 flex-wrap">
        {CATEGORIES.map((cat) => {
          const isActive = product?.categories?.trim().toLowerCase() === cat.toLowerCase();
          return (
            <Link
              key={cat}
              href={`/menu?category=${encodeURIComponent(cat)}`}
              className={`px-8 py-2.5 rounded-full whitespace-nowrap font-medium transition-colors text-white ${
                isActive ? 'bg-[#3A1F19]' : 'bg-[#7E5E4E] hover:bg-[#5A382C]'
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {loading ? (
        <p className="text-center text-xl text-[#4A2B20] py-10 font-medium animate-pulse">Đang tải dữ liệu...</p>
      ) : error || !product ? (
        <div className="text-center py-10">
          <p className="text-lg text-red-600 mb-4">{error ?? 'Không tìm thấy sản phẩm.'}</p>
          <Link href="/menu" className="underline text-[#3A1F19]">
            Quay lại menu
          </Link>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Cột trái: card sản phẩm */}
          <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col max-w-md w-full mx-auto">
            <div className="w-full h-72 relative mb-5">
              <Image
                src={PLACEHOLDER_IMAGE}
                alt={product.productName}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
            <h1 className="font-bold text-2xl text-[#2B100C] mb-1">{product.productName}</h1>
            {product.description && <p className="text-sm text-gray-500 mb-4">{product.description}</p>}

            <div className="flex justify-between items-center mt-auto">
              <span className="font-bold text-xl text-[#1A1A1A]">{formatVND(unitPrice)}</span>

              <div className="flex items-center gap-4 bg-[#7E5E4E] text-white rounded-full px-4 py-1.5">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-xl leading-none w-5"
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <span className="font-bold min-w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="text-xl leading-none w-5"
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: size, topping, add to cart */}
          <div className="flex flex-col items-center">
            <h2 className="font-bold text-xl text-[#2B100C] mb-4">Size</h2>
            <div className="flex gap-6 mb-10">
              {SIZES.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSize(s.label)}
                  className={`w-16 py-2 rounded-full text-white font-bold transition-colors ${
                    size === s.label ? 'bg-[#3A1F19]' : 'bg-[#7E5E4E] hover:bg-[#5A382C]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <h2 className="font-bold text-xl text-[#2B100C] mb-4">Topping</h2>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 mb-10">
              {TOPPINGS.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm text-[#2B100C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedToppings.includes(t.id)}
                    onChange={() => toggleTopping(t.id)}
                    className="accent-[#3A1F19] w-4 h-4"
                  />
                  <span>
                    {t.name} <span className="text-gray-500">(+{formatVND(t.price)})</span>
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleAddToCart}
              className="px-12 py-3 bg-[#7E5E4E] text-white text-lg font-bold rounded-full hover:bg-[#3A1F19] active:scale-[0.98] transition-all cursor-pointer"
            >
              Add to cart · {formatVND(total)}
            </button>

            {message && <p className="mt-4 text-green-700 font-medium">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}