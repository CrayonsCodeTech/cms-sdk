export interface Category {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  extra?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
