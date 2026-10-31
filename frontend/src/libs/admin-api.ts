const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const PRODUCT_CATEGORIES = [
  'Classic Coffee',
  'Cold & Brewed',
  'Tea',
  'Pastry & Dessert',
  'Best Sellers',
] as const;

export interface AdminProduct {
  productId: string;
  productName: string;
  description: string | null;
  basePrice: string; // Decimal từ backend được trả về dạng chuỗi
  imageUrl: string | null;
  stock: number;
  isActive: boolean;
  categories: string | null;
  version: number;
}

export interface ProductInput {
  productName: string;
  categories: string;
  basePrice: number;
  stock: number;
  imageUrl: string;
  description: string;
  isActive: boolean;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
}

// TODO: khi nhóm có đăng nhập admin, trả về { Authorization: `Bearer ${token}` } ở đây.
function authHeaders(): Record<string, string> {
  return {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    let message = `Lỗi HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) {
        message = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
      }
    } catch {
      // phản hồi không phải JSON, giữ thông báo mặc định
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchAdminProducts(
  filters: ProductFilters = {},
  signal?: AbortSignal,
): Promise<AdminProduct[]> {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return request<AdminProduct[]>(`/admin/products${query ? `?${query}` : ''}`, { signal });
}

export function createProduct(input: ProductInput): Promise<AdminProduct> {
  return request<AdminProduct>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
  return request<AdminProduct>(`/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}