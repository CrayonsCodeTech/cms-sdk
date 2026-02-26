export interface Event {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  organizer_name?: string | null;
  organizer_email?: string | null;
  start_date: string;
  end_date?: string | null;
  time?: string | null;
  location_name?: string | null;
  address?: string | null;
  link?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  description?: string | null;
  excerpt?: string | null;
  status?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: any | null;
  seo_image?: string | null;
  extra?: any | null;
}
