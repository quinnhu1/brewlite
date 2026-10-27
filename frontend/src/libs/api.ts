const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");

export interface ApiProduct {
  productId: string;
  productName: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  stock: number;
  categories: string | null;
  isBestSeller?: boolean;
}

export interface ApiSize {
  size_id: string;
  size: string;
  add_price: string;
}

export interface ApiTopping {
  topping_id: string;
  topping_name: string;
  price: string;
}

export interface ApiProductDetail extends ApiProduct {
  product_size: ApiSize[];
  toppings: ApiTopping[];
}

export async function fetchProducts(
  signal?: AbortSignal,
): Promise<ApiProduct[]> {
  const response = await fetch(`${API_URL}/products`, { signal });
  if (!response.ok) {
    throw new Error(`Không tải được menu (HTTP ${response.status})`);
  }
  return response.json();
}

export async function fetchProductById(
  id: string,
  signal?: AbortSignal,
): Promise<ApiProductDetail> {
  const response = await fetch(
    `${API_URL}/products/${encodeURIComponent(id)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Không tải được sản phẩm (HTTP ${response.status})`);
  }
  return response.json();
}

// Lỗi từ API, có kèm mã HTTP để nơi gọi phân biệt (vd 401 = hết phiên đăng nhập)
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    // Backend chưa chạy, sai cổng, hoặc bị chặn CORS
    throw new ApiError(
      "Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.",
      0,
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Nest trả message là chuỗi, hoặc mảng chuỗi khi validation lỗi
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || `Lỗi ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data;
}
