export interface Service {
  id: number;
  site_id: number;
  title: string;
  slug: string;
  short_description: string;
  excerpt: string;
  description: string;
  image_url: string;
  image_alt: string;
  icon: string;
  features: string[];
  link_text: string;
  link_url: string;
  order: number;
  created_at: string;
  updated_at: string;
}
