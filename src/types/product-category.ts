export interface ProductCategory {
  id: string;
  site_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}
