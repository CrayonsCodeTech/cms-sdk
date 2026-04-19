export type ProductStatus = "draft" | "published" | "archived" | "out_of_stock";

export interface ProductImage {
  id: string;
  variant_id: string;
  url: string;
  alt_text: string | null;
  order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  site_id: string;
  sku?: string | null;
  name: string | null;
  model_number: string | null;
  order: number;
  price?: number;
  sale_price?: number | null;
  cost_price?: number | null;
  inventory: number;
  weight: number | null;
  attributes?: Record<string, string>;
  features?: string[];
  specifications?: Record<string, Record<string, string>>;
  included_items?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  images: ProductImage[];
}

export interface ProductListItem {
  id: string;
  site_id: string;
  category_id: string;
  brand_id: string | null;
  name: string;
  slug: string;
  subtitle: string | null;
  status: ProductStatus;
  is_featured: boolean;
  thumbnail_url: string | null;
  created_at: string;
}

export interface Product extends ProductListItem {
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  needs_shipping: boolean;
  metadata: unknown;
  deleted_at: string | null;
  updated_at: string;
  variants?: ProductVariant[];
}
