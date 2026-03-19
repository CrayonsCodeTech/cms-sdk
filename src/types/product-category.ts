export interface ProductCategory {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}
