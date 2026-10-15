import type { Section } from "./cms-page";

export interface Album {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  description: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  is_published: boolean;
  order: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  seo_image: string | null;
  created_at: string;
  updated_at: string;
  /** @deprecated Never returned by the public API; use `fetchAlbumItems`. */
  items?: AlbumItem[];
  extra?: (Record<string, unknown> & { sections?: Section[] }) | null;
}

export interface AlbumItem {
  id: string;
  album_id: string;
  image_url: string;
  image_alt: string | null;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  caption: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}
