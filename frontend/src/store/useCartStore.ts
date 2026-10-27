import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export type DrinkSize = 'S' | 'M' | 'L';
export type PaymentMethod = 'VIETQR' | 'E_WALLET' | 'CARD';
export type PickupMethod = 'AT_COUNTER' | 'TAKEAWAY' | 'DELIVERY';

export interface ToppingOption {
  topping_id: string;
  topping_name: string;
  price: number;
  is_active: boolean;
}

export interface SizeOption {
  size: DrinkSize;
  add_price: number;
}

export interface CartItem {
  cart_item_id: string; // Khóa định danh dòng giỏ hàng (product_id + size + toppings)
  product_id: string;
  product_name: string;
  image_url: string;
  base_price: number;
  size: DrinkSize;
  add_price: number;
  toppings: ToppingOption[];
  unit_price: number;   // unit_price = base_price + add_price
  quantity: number;
  line_total: number;   // line_total = (unit_price + tổng giá topping) * quantity
  stock: number;
  note?: string;
  selected: boolean;    // Cho phép tick chọn món để đặt (theo yêu cầu MVP trong Swe)
}

export interface Promotion {
  promotion_id: string;
  code: string;
  promotion_name: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_amount: number;
  max_discount: number | null;
  is_active: boolean;
}

// Danh sách Size chuẩn theo script database của Thắng (# thang-1510)
export const AVAILABLE_SIZES: SizeOption[] = [
  { size: 'S', add_price: 0 },
  { size: 'M', add_price: 5000 },
  { size: 'L', add_price: 10000 },
];

// Danh sách Topping mẫu theo script database (# thanhlong-1510)
export const AVAILABLE_TOPPINGS: ToppingOption[] = [
  { topping_id: '22222222-2222-4222-8222-222222222201', topping_name: 'Trân châu đen', price: 5000, is_active: true },
  { topping_id: '22222222-2222-4222-8222-222222222202', topping_name: 'Trân châu trắng', price: 6000, is_active: true },
  { topping_id: '22222222-2222-4222-8222-222222222203', topping_name: 'Pudding trứng', price: 7000, is_active: true },
  { topping_id: '22222222-2222-4222-8222-222222222204', topping_name: 'Kem cheese', price: 10000, is_active: true },
  { topping_id: '22222222-2222-4222-8222-222222222205', topping_name: 'Thạch dừa', price: 5000, is_active: true },
];

// Danh sách Mã khuyến mãi mẫu theo script database (# thien-1510)
export const SAMPLE_PROMOTIONS: Promotion[] = [
  {
    promotion_id: 'e2a7b8c9-1111-4222-8333-000000000001',
    code: 'GIAM15K',
    promotion_name: 'Giảm 15.000đ cho đơn từ 50.000đ',
    discount_type: 'FIXED',
    discount_value: 15000,
    min_amount: 50000,
    max_discount: 15000,
    is_active: true,
  },
  {
    promotion_id: 'e2a7b8c9-1111-4222-8333-000000000002',
    code: 'GIAM20K',
    promotion_name: 'Giảm 20.000đ cho đơn từ 100.000đ',
    discount_type: 'FIXED',
    discount_value: 20000,
    min_amount: 100000,
    max_discount: 20000,
    is_active: true,
  },
  {
    promotion_id: 'e2a7b8c9-1111-4222-8333-000000000003',
    code: 'SALE10%',
    promotion_name: 'Giảm 10% tổng hóa đơn',
    discount_type: 'PERCENT',
    discount_value: 10,
    min_amount: 50000,
    max_discount: 50000,
    is_active: true,
  },
];

// Dữ liệu giỏ hàng mẫu ban đầu (để demo ngay cả khi chưa nối trang Menu)
export const INITIAL_DEMO_CART: CartItem[] = [
  {
    cart_item_id: '33333333-3333-4333-8333-333333333301__M__22222222-2222-4222-8222-222222222201',
    product_id: '33333333-3333-4333-8333-333333333301',
    product_name: 'Espresso',
    image_url: '/images/espresso.jpg',
    base_price: 40000,
    size: 'M',
    add_price: 5000,
    toppings: [AVAILABLE_TOPPINGS[0]],
    unit_price: 45000,
    quantity: 1,
    line_total: 50000,
    stock: 100,
    note: '',
    selected: true,
  },
  {
    cart_item_id: '33333333-3333-4333-8333-333333333302__L__22222222-2222-4222-8222-222222222202',
    product_id: '33333333-3333-4333-8333-333333333302',
    product_name: 'Americano',
    image_url: '/images/espresso.jpg',
    base_price: 45000,
    size: 'L',
    add_price: 10000,
    toppings: [AVAILABLE_TOPPINGS[1]],
    unit_price: 55000,
    quantity: 2,
    line_total: 122000,
    stock: 100,
    note: '',
    selected: true,
  },
];

// Hàm hỗ trợ tạo khóa nhận diện dòng giỏ hàng (để gộp món khi trùng tùy chọn - UC3.1)
export function buildCartItemKey(productId: string, size: DrinkSize, toppings: ToppingOption[]): string {
  const sortedToppingIds = [...toppings]
    .map((t) => t.topping_id)
    .sort()
    .join('_');
  return `${productId}__${size}__${sortedToppingIds}`;
}

// Hàm tính unit_price và line_total chuẩn công thức trong tài liệu Swe
export function calculateItemPricing(
  basePrice: number,
  size: DrinkSize,
  toppings: ToppingOption[],
  quantity: number
): { add_price: number; unit_price: number; line_total: number } {
  const sizeObj = AVAILABLE_SIZES.find((s) => s.size === size) || { add_price: 0 };
  const add_price = sizeObj.add_price;
  const unit_price = basePrice + add_price;
  const toppingsTotal = toppings.reduce((sum, t) => sum + t.price, 0);
  const line_total = (unit_price + toppingsTotal) * quantity;
  return { add_price, unit_price, line_total };
}

interface CartState {
  items: CartItem[];
  pickupMethod: PickupMethod;
  appliedPromotion: Promotion | null;
  promoError: string | null;

  // Actions cho UC3.1 & UC3.2 (Quản lý giỏ hàng)
  addItem: (payload: {
    product_id: string;
    product_name: string;
    image_url: string;
    base_price: number;
    size: DrinkSize;
    toppings: ToppingOption[];
    quantity?: number;
    stock?: number;
    note?: string;
  }) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  updateItemOptions: (
    cartItemId: string,
    newSize: DrinkSize,
    newToppings: ToppingOption[],
    newNote?: string
  ) => void;
  toggleSelectItem: (cartItemId: string) => void;
  toggleSelectAll: (selected: boolean) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  removeSelectedItems: () => void;
  resetDemoCart: () => void;
  setPickupMethod: (method: PickupMethod) => void;

  // Actions cho UC4.3 (Áp dụng mã giảm giá)
  applyPromotionCode: (code: string) => boolean;
  removePromotion: () => void;

  // Getters tính tổng
  getTotalBadgeCount: () => number;
  getSelectedItems: () => CartItem[];
  getPricingSummary: () => {
    subtotal: number;
    discount: number;
    total: number;
    loyaltyPointsEarned: number;
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      pickupMethod: 'AT_COUNTER',
      appliedPromotion: null,
      promoError: null,

      // UC3.1: Thêm món vào giỏ (nếu trùng món + size + topping thì tăng số lượng)
      addItem: (payload) => {
        const stock = Math.max(0, Math.floor(payload.stock ?? 20));
        if (stock <= 0) return;
        const requestedQuantity = Math.floor(payload.quantity ?? 1);
        const qty = Math.max(1, Math.min(requestedQuantity, stock));

        const key = buildCartItemKey(payload.product_id, payload.size, payload.toppings);
        const { items } = get();
        const existingIndex = items.findIndex((item) => item.cart_item_id === key);

        if (existingIndex > -1) {
          const existing = items[existingIndex];
          const newQty = Math.min(existing.quantity + qty, existing.stock);
          const pricing = calculateItemPricing(
            existing.base_price,
            existing.size,
            existing.toppings,
            newQty
          );
          const updated = [...items];
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            ...pricing,
            selected: true,
          };
          set({ items: updated });
        } else {
          const pricing = calculateItemPricing(
            payload.base_price,
            payload.size,
            payload.toppings,
            qty
          );
          const newItem: CartItem = {
            cart_item_id: key,
            product_id: payload.product_id,
            product_name: payload.product_name,
            image_url: payload.image_url,
            base_price: payload.base_price,
            size: payload.size,
            toppings: payload.toppings,
            quantity: qty,
            stock,
            note: payload.note || '',
            selected: true,
            ...pricing,
          };
          set({ items: [...items, newItem] });
        }
      },

      // UC3.2.1: Tăng (+) hoặc giảm (-) số lượng món
      updateQuantity: (cartItemId, delta) => {
        const { items } = get();
        const updated = items
          .map((item) => {
            if (item.cart_item_id !== cartItemId) return item;
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null; // Nếu giảm về 0 thì xóa món
            const clampedQty = Math.min(nextQty, item.stock);
            const pricing = calculateItemPricing(
              item.base_price,
              item.size,
              item.toppings,
              clampedQty
            );
            return {
              ...item,
              quantity: clampedQty,
              ...pricing,
            };
          })
          .filter(Boolean) as CartItem[];

        set({ items: updated });
      },

      // Chỉnh sửa Size, Topping và Ghi chú của món ngay trong giỏ hàng
      updateItemOptions: (cartItemId, newSize, newToppings, newNote) => {
        const { items } = get();
        const target = items.find((i) => i.cart_item_id === cartItemId);
        if (!target) return;

        const newKey = buildCartItemKey(target.product_id, newSize, newToppings);
        const pricing = calculateItemPricing(
          target.base_price,
          newSize,
          newToppings,
          target.quantity
        );

        // Nếu sau khi đổi tùy chọn mà trùng với một dòng khác đã có trong giỏ -> gộp 2 dòng
        if (newKey !== cartItemId && items.some((i) => i.cart_item_id === newKey)) {
          const updated = items
            .map((item) => {
              if (item.cart_item_id === newKey) {
                const mergedQty = Math.min(item.quantity + target.quantity, item.stock);
                const mergedPricing = calculateItemPricing(
                  item.base_price,
                  item.size,
                  item.toppings,
                  mergedQty
                );
                return {
                  ...item,
                  quantity: mergedQty,
                  ...mergedPricing,
                };
              }
              return item;
            })
            .filter((item) => item.cart_item_id !== cartItemId);
          set({ items: updated });
        } else {
          const updated = items.map((item) => {
            if (item.cart_item_id !== cartItemId) return item;
            return {
              ...item,
              cart_item_id: newKey,
              size: newSize,
              toppings: newToppings,
              note: newNote !== undefined ? newNote : item.note,
              ...pricing,
            };
          });
          set({ items: updated });
        }
      },

      toggleSelectItem: (cartItemId) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.cart_item_id === cartItemId ? { ...item, selected: !item.selected } : item
          ),
        }));
      },

      toggleSelectAll: (selected) => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected })),
        }));
      },

      // UC3.2.2: Xóa 1 món khỏi giỏ hàng
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cart_item_id !== cartItemId),
        }));
      },

      // UC3.2.3: Xóa toàn bộ giỏ hàng
      clearCart: () => {
        set({ items: [], appliedPromotion: null, promoError: null });
      },

      // Xóa các món đã thanh toán thành công
      removeSelectedItems: () => {
        set((state) => ({
          items: state.items.filter((item) => !item.selected),
          appliedPromotion: null,
          promoError: null,
        }));
      },

      resetDemoCart: () => {
        set({ items: INITIAL_DEMO_CART, appliedPromotion: null, promoError: null });
      },

      setPickupMethod: (method) => {
        set({ pickupMethod: method });
      },

      // UC4.3: Kiểm tra và áp dụng mã khuyến mãi
      applyPromotionCode: (rawCode) => {
        const code = rawCode.trim().toUpperCase();
        if (!code) {
          set({ promoError: 'Vui lòng nhập mã giảm giá.' });
          return false;
        }

        const promo = SAMPLE_PROMOTIONS.find((p) => p.code === code);
        if (!promo || !promo.is_active) {
          set({ promoError: 'Mã giảm giá không tồn tại hoặc đã hết hiệu lực.' });
          return false;
        }

        const subtotal = get()
          .items.filter((i) => i.selected)
          .reduce((sum, i) => sum + i.line_total, 0);

        if (subtotal < promo.min_amount) {
          set({
            promoError: `Đơn hàng cần tối thiểu ${promo.min_amount.toLocaleString('vi-VN')}đ để áp dụng mã ${promo.code}.`,
          });
          return false;
        }

        set({ appliedPromotion: promo, promoError: null });
        return true;
      },

      removePromotion: () => {
        set({ appliedPromotion: null, promoError: null });
      },

      getTotalBadgeCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSelectedItems: () => {
        return get().items.filter((item) => item.selected);
      },

      getPricingSummary: () => {
        const selectedItems = get().items.filter((item) => item.selected);
        const subtotal = selectedItems.reduce((sum, item) => sum + item.line_total, 0);
        const promo = get().appliedPromotion;

        let discount = 0;
        if (promo && subtotal >= promo.min_amount) {
          if (promo.discount_type === 'PERCENT') {
            discount = Math.round((subtotal * promo.discount_value) / 100);
            if (promo.max_discount !== null) {
              discount = Math.min(discount, promo.max_discount);
            }
          } else {
            discount = promo.discount_value;
          }
          discount = Math.min(discount, subtotal);
        }

        const total = Math.max(0, subtotal - discount);
        // Quy tắc cộng điểm thưởng Loyalty: mỗi 10.000đ thanh toán nhận 1 điểm
        const loyaltyPointsEarned = Math.floor(total / 10000);

        return { subtotal, discount, total, loyaltyPointsEarned };
      },
    }),
    {
      name: 'brewlite-cart-storage-v2',
    }
  )
);