const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ApiProduct {
    productId: string;
    productName: string;
    description: string | null;
    basePrice: string;
    imageUrl: string | null;
    stock: number;
    categories: string | null;
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

export async function fetchProducts(signal?: AbortSignal): Promise<ApiProduct[]> {
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
    const response = await fetch(`${API_URL}/products/${id}`, { signal });
    if (!response.ok) {
        throw new Error(`Không tải được sản phẩm (HTTP ${response.status})`);
    }
    return response.json();
}