import type { PaginatedResponse } from "./pagination";
import type { Product } from "./product";

export interface CollectionItem {
  id: string;
  collection_id: string;
  product_id: string;
  order: number;
  product: Product;
}

export interface CollectionListItem {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url?: string | null;
  is_published: boolean;
  collection_type: "manual" | "smart";
  order: number;
  created_at: string;
  updated_at: string;
  _count?: { items: number };
}

export interface CollectionDetail extends Omit<CollectionListItem, "_count"> {
  items: CollectionItem[];
  pagination?: PaginatedResponse<never>["pagination"];
}

export type Collection = CollectionListItem;
