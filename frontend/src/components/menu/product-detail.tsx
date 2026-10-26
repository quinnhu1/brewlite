'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { fetchProductById, ApiProductDetail, ApiTopping } from '@/libs/api';
import { getProductImageUrl } from '@/data/categories';

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
  productId: string;
  onBack?: () => void;
  onAddToCart?: (item: CartItem) => void;
}

const SIZE_ORDER = ['S', 'M', 'L', 'XL'];
const EMPTY_TOPPINGS: ApiTopping[] = [];

type ProductLoadResult = {
  productId: string;
  detail?: ApiProductDetail;
  error?: string;
};

function getErrorMessage(reason: unknown): string {
  return reason instanceof Error
    ? reason.message
    : 'Không tải được thông tin sản phẩm. Vui lòng thử lại.';
}

export default function ProductDetail({ productId, onBack, onAddToCart }: ProductDetailProps) {
  const [loadResult, setLoadResult] = useState<ProductLoadResult | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  // Key the result by product ID so a route change immediately renders the loading
  // state without synchronously setting state inside the effect.
  const resultMatchesProduct = loadResult?.productId === productId;
  const detail = resultMatchesProduct ? loadResult.detail ?? null : null;
  const error = resultMatchesProduct ? loadResult.error ?? null : null;
  const loading = !resultMatchesProduct;

  useEffect(() => {
    const controller = new AbortController();

    fetchProductById(productId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;

        const preferredSize = [...data.product_size].sort((left, right) => {
          const leftIndex = SIZE_ORDER.indexOf(left.size.toUpperCase());
          const rightIndex = SIZE_ORDER.indexOf(right.size.toUpperCase());
          return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
            - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
        })[0];

        setLoadResult({ productId, detail: data });
        setSelectedSizeId(preferredSize?.size_id ?? null);
        setSelectedToppingIds([]);
        setQuantity(1);
        setCartMessage(null);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted || (reason instanceof Error && reason.name === 'AbortError')) {
          return;
        }
        setLoadResult({ productId, error: getErrorMessage(reason) });
      });

    return () => controller.abort();
  }, [productId]);

  const sizes = useMemo(
    () => [...(detail?.product_size ?? [])].sort((left, right) => {
      const leftIndex = SIZE_ORDER.indexOf(left.size.toUpperCase());
      const rightIndex = SIZE_ORDER.indexOf(right.size.toUpperCase());
      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
        - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }),
    [detail?.product_size],
  );
  const toppings = detail?.toppings ?? EMPTY_TOPPINGS;
  const selectedSize = sizes.find((size) => size.size_id === selectedSizeId);
  const stock = detail?.stock ?? 0;
  const outOfStock = stock <= 0;
  const maxQuantity = Math.max(stock, 1);

  const unitPrice = useMemo(() => {
    const basePrice = Number(detail?.basePrice ?? 0);
    const sizeExtra = Number(selectedSize?.add_price ?? 0);
    const toppingExtra = toppings
      .filter((topping) => selectedToppingIds.includes(topping.topping_id))
      .reduce((sum, topping) => sum + Number(topping.price), 0);
    return basePrice + sizeExtra + toppingExtra;
  }, [detail?.basePrice, selectedSize, toppings, selectedToppingIds]);

  const handleQuantityChange = (direction: 'increase' | 'decrease') => {
    setQuantity((current) => direction === 'decrease'
      ? Math.max(1, current - 1)
      : Math.min(maxQuantity, current + 1));
  };

  const handleAddToCart = () => {
    if (!detail || outOfStock || loading || error) return;

    const selectedToppings = toppings.filter((topping) =>
      selectedToppingIds.includes(topping.topping_id),
    );
    const image = getProductImageUrl(detail.imageUrl);
    const cartItem: CartItem = {
      productId: detail.productId,
      name: detail.productName,
      image,
      sizeId: selectedSize?.size_id ?? null,
      size: selectedSize?.size ?? null,
      toppings: selectedToppings,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
    };

    if (onAddToCart) {
      onAddToCart(cartItem);
      setCartMessage(`Đã thêm ${quantity} × ${detail.productName} vào giỏ hàng.`);
      return;
    }

    try {
      const savedCart: unknown = JSON.parse(localStorage.getItem('cart') ?? '[]');
      const cart = Array.isArray(savedCart) ? savedCart : [];
      cart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      setCartMessage(`Đã thêm ${quantity} × ${detail.productName} vào giỏ hàng.`);
    } catch {
      setCartMessage('Không thể lưu giỏ hàng trên trình duyệt này.');
    }
  };

  if (loading) {
    return (
      <section className="w-full max-w-5xl mx-auto px-6 py-16 text-center text-[#6F4E37]" role="status">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-6 underline">
            ← Quay lại menu
          </button>
        )}
        <p>Đang tải thông tin sản phẩm...</p>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="w-full max-w-5xl mx-auto px-6 py-16 text-center" role="alert">
        <p className="text-red-600 mb-5">{error ?? 'Không tìm thấy sản phẩm.'}</p>
        {onBack && (
          <button type="button" onClick={onBack} className="underline text-[#3A1F19]">
            ← Quay lại menu
          </button>
        )}
      </section>
    );
  }

  const image = getProductImageUrl(detail.imageUrl);

  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#6F4E37] hover:text-[#2B100C] transition-colors cursor-pointer"
        >
          ← Quay lại menu
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="relative w-full h-72 rounded-2xl overflow-hidden mb-6 bg-gray-100">
            <Image
              src={image}
              alt={detail.productName}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-[#2B100C] mb-2">{detail.productName}</h1>
          {detail.description && <p className="text-sm text-[#6F4E37] mb-4">{detail.description}</p>}
          <p className="text-2xl font-bold text-[#2B100C]">
            {unitPrice.toLocaleString('vi-VN')}đ
          </p>
          <p className={`mt-3 text-sm ${outOfStock ? 'text-red-600' : 'text-[#6F4E37]'}`}>
            {outOfStock ? 'Hết hàng' : `Còn ${stock} sản phẩm`}
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          {sizes.length > 0 && (
            <div className="mb-8 w-full">
              <h2 className="text-xl font-bold text-[#2B100C] mb-4">Chọn size</h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {sizes.map((size) => (
                  <button
                    key={size.size_id}
                    type="button"
                    onClick={() => setSelectedSizeId(size.size_id)}
                    aria-pressed={selectedSizeId === size.size_id}
                    className={`min-w-16 px-4 py-2 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
                      selectedSizeId === size.size_id
                        ? 'bg-[#2B100C] text-[#F2ECE4]'
                        : 'bg-[#6F4E37] text-[#F2ECE4] hover:opacity-90'
                    }`}
                  >
                    {size.size}
                    {Number(size.add_price) > 0 && (
                      <span className="ml-1 text-xs font-normal">
                        +{Number(size.add_price).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {toppings.length > 0 && (
            <div className="mb-8 w-full max-w-md">
              <h2 className="text-xl font-bold text-[#2B100C] mb-5">Chọn topping</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-left">
                {toppings.map((topping) => (
                  <label
                    key={topping.topping_id}
                    className="flex items-center gap-3 text-[#2B100C] text-sm font-medium cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedToppingIds.includes(topping.topping_id)}
                      onChange={() => setSelectedToppingIds((current) =>
                        current.includes(topping.topping_id)
                          ? current.filter((id) => id !== topping.topping_id)
                          : [...current, topping.topping_id],
                      )}
                      className="w-4 h-4 accent-[#2B100C] rounded cursor-pointer"
                    />
                    <span>
                      {topping.topping_name}
                      <span className="text-[#6F4E37]">
                        {' '}(+{Number(topping.price).toLocaleString('vi-VN')}đ)
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-5 bg-[#7E5E4E] text-white rounded-full px-5 py-2 mb-6">
            <button
              type="button"
              onClick={() => handleQuantityChange('decrease')}
              disabled={quantity <= 1}
              aria-label="Giảm số lượng"
              className="text-xl leading-none w-5 disabled:opacity-40"
            >−</button>
            <span className="font-bold min-w-4 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange('increase')}
              disabled={outOfStock || quantity >= maxQuantity}
              aria-label="Tăng số lượng"
              className="text-xl leading-none w-5 disabled:opacity-40"
            >+</button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-full max-w-sm bg-[#6F4E37] text-[#F2ECE4] text-base font-bold py-3.5 px-8 rounded-2xl hover:bg-[#2B100C] transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {outOfStock ? 'Hết hàng' : `Thêm vào giỏ · ${(unitPrice * quantity).toLocaleString('vi-VN')}đ`}
          </button>
          {cartMessage && <p role="status" className="mt-4 text-sm text-green-700">{cartMessage}</p>}
        </div>
      </div>
    </section>
  );
}
