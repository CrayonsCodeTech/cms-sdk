import type { Section } from "./cms-page";
import type { ProductSEO } from "./seo";

export interface BrandGroup {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  description: string | null;
  is_published: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  seo?: ProductSEO | null;
  extra?: (Record<string, unknown> & { sections?: Section[] }) | null;
  brands?: Brand[];
}

export interface Brand {
  id: string;
  brand_group_id: string;
  name: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  description: string | null;
  website_url: string | null;
  logo_url: string;
  logo_alt: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}
