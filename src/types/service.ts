import type { Section } from "./cms-page";
import type { ProductSEO } from "./seo";

export interface Service {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  description: string;
  image_url?: string | null;
  image_alt?: string | null;
  icon?: string | null;
  features: string[];
  link_text?: string | null;
  link_url?: string | null;
  order: number;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  seo: ProductSEO | null;
  extra?: {
    sections: Section[];
  } | null;
}
