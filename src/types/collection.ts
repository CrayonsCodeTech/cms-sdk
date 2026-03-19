import type { Product, ProductVariant } from "./product";

export interface CollectionItem {
  id: string;
  collection_id: string;
  product_id: string;
  order: number;
  product: Product & { variants: ProductVariant[] };
}

export interface Collection {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_published: true;
  order: number;
  created_at: string;
  updated_at: string;
  _count?: { items: number }; // present on list response
  items?: CollectionItem[]; // present on detail response
}
