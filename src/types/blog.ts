export interface Blog {
  id: number;
  site_id: number;
  slug: string;
  title: string;
  image_url?: string | null;
  image_alt?: string | null;
  author: string;
  description?: string | null;
  excerpt?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: any | null;
  seo_image?: string | null;
}
