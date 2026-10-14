import type { ProductSEO, ProductExtraData } from "./seo";
import type { PaginationMeta } from "./pagination";
import type { Product } from "./product";

export interface ProductBrand {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  seo: ProductSEO | null;
  extra: ProductExtraData | null;
  created_at: string;
  updated_at: string;
}

/** A brand with a page of its published products. */
export interface ProductBrandDetail extends ProductBrand {
  items: { product: Product }[];
  pagination: PaginationMeta;
}
