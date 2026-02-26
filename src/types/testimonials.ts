export interface Testimonial {
  id: string;
  site_id: string;
  quote: string;
  sub_text: string | null;
  name: string;
  position: string | null;
  company: string | null;
  rating: number | null;
  type: string;
  image_url: string | null;
  image_alt: string | null;
  order: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  extra: any | null;
}
