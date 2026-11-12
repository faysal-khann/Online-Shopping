export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// credentials: "include" sends the httpOnly login cookie to the Express API
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.message || "Request failed", res.status);
  return data as T;
}


export type Category = { _id: string; name: string; slug: string; image?: string };

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category?: Pick<Category, "_id" | "name" | "slug">;
  type: "physical" | "digital";
  colors: string[];
  sizes: string[];
  stock: number;
  additionalInfo: { title: string; text: string }[];
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  page: number;
  pages: number;
};

export const PLACEHOLDER_IMG = "https://picsum.photos/seed/cartiva/600/800";

export const finalPrice = (p: Pick<Product, "price" | "discountPrice">) =>
  p.discountPrice ?? p.price;

export async function getProducts(
  params: Record<string, string | string[] | undefined> = {},
  limit = 8
): Promise<ProductsResponse> {
  const qs = new URLSearchParams();
  for (const key of ["name", "type", "min", "max", "cat", "sort", "page"]) {
    const v = params[key];
    if (typeof v === "string" && v) qs.set(key, v);
  }
  qs.set("limit", String(limit));
  return apiFetch<ProductsResponse>(`/products?${qs.toString()}`);
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    const { product } = await apiFetch<{ product: Product }>(
      `/products/${encodeURIComponent(slug)}`
    );
    return product;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getCategories(): Promise<Category[]> {
  const { categories } = await apiFetch<{ categories: Category[] }>("/categories");
  return categories;
}