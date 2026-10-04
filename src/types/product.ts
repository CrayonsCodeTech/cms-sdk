import type { ProductSEO, ProductExtraData } from "./seo";

export type ProductStatus = "draft" | "published" | "archived" | "out_of_stock";

export interface ProductImage {
  id: string;
  variant_id: string;
  url: string;
  alt_text: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

// Variant as returned by the public store API. The raw inventory count is masked
// to a boolean (in stock?) + low_stock signal, and the merchant's cost price is
// never returned. price/sale_price are absent when the site hides prices.
export interface ProductVariant {
  id: string;
  product_id: string;
  site_id: string;
  sku: string;
  name: string | null;
  model_number: string | null;
  order: number;
  // Absent when the site's price_visibility is false (see fetchStoreSettings)
  price?: number;
  sale_price?: number | null;
  inventory: boolean;
  low_stock: boolean;
  weight: number | null;
  // Nullable JSON columns: null when the admin never set them
  attributes: Record<string, string> | null;
  features: string[] | null;
  specifications: Record<string, Record<string, string>> | null;
  included_items: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  images: ProductImage[];
}

/** @deprecated Same as `ProductVariant`, which now describes the public shape. */
export type PublicProductVariant = ProductVariant;

// Subset returned on product list responses (public)
export type ProductVariantListItem = Pick<
  ProductVariant,
  "id" | "sku" | "name" | "price" | "sale_price" | "inventory" | "low_stock" | "order"
>;

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
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
  seo: ProductSEO | null;
  extra: ProductExtraData | null;
  // Optional: CMS backends that predate public tags omit the field
  tags?: ProductTag[];
  created_at: string;
  variants?: ProductVariantListItem[];
}

export interface Product extends Omit<ProductListItem, "variants"> {
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  needs_shipping: boolean;
  metadata: unknown;
  deleted_at: string | null;
  updated_at: string;
  variants?: ProductVariant[];
}