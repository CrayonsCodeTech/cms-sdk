import type { Section } from "./cms-page";

export interface Blog {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  image_url?: string | null;
  image_alt?: string | null;
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
  author: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  description?: string | null;
  excerpt?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  seo_image?: string | null;
  extra?: {
    sections: Section[];
    cta?: {
      text: string | null;
      url: string | null;
      is_external: boolean | null;
    } | null;
  } | null;
}
