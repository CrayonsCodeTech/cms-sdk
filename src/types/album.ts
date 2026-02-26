export interface Album {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  is_published: boolean;
  order: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: any | null;
  created_at: string;
  updated_at: string;
  items?: AlbumItem[];
  extra?: any;
}

export interface AlbumItem {
  id: string;
  album_id: string;
  image_url: string;
  image_alt: string | null;
  caption: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}
