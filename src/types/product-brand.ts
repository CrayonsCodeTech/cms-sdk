import type { ProductSEO, ProductExtraData } from "./seo";

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
