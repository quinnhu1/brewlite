const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export interface ApiProduct {
  productId: string;
  productName: string;
  description: string | null;
  basePrice: string | number;
  imageUrl: string | null;
  stock: number;
  categories: string | null;
  isBestSeller?: boolean;
}

export interface ApiSize {
  size_id: string;
  size: 'S' | 'M' | 'L';
  add_price: string | number;
}

export interface ApiTopping {
  topping_id: string;
  topping_name: string;
  price: string | number;
}

export interface ApiProductDetail extends ApiProduct {
  product_size: ApiSize[];
  toppings: ApiTopping[];
}

export const API_BASE_URL = API_URL;

export async function fetchProducts(signal?: AbortSignal): Promise<ApiProduct[]> {
  const response = await fetch(`${API_URL}/products`, { signal, cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Không tải được menu (HTTP ${response.status})`);
  }
  return response.json() as Promise<ApiProduct[]>;
}

export async function fetchProductById(
  id: string,
  signal?: AbortSignal,
): Promise<ApiProductDetail> {
  const response = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, {
    signal,
    cache: 'no-store',
  });
  if (!response.ok) {
    const message = await parseApiError(response);
    throw new Error(message || `Không tải được sản phẩm (HTTP ${response.status})`);
  }
  return response.json() as Promise<ApiProductDetail>;
}

export async function parseApiError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: unknown }).message;
      return Array.isArray(message) ? message.join('; ') : String(message);
    }
  } catch {
    // Response body không phải JSON; dùng HTTP code bên gọi.
  }
  return `Yêu cầu thất bại (HTTP ${response.status})`;
}
