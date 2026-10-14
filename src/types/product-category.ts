import type { ProductSEO, ProductExtraData } from "./seo";
import type { PaginationMeta } from "./pagination";
import type { Product } from "./product";

export interface ProductCategory {
  id: string;
  site_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  seo: ProductSEO | null;
  extra: ProductExtraData | null;
  order: number;
  created_at: string;
  updated_at: string;
}

/** A category with a page of its published products, subcategories included. */
export interface ProductCategoryDetail extends ProductCategory {
  items: { product: Product }[];
  pagination: PaginationMeta;
}
