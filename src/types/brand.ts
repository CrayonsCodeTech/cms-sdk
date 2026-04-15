export interface BrandGroup {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  description: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  is_published: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  extra?: any;
  brands?: Brand[];
}

export interface Brand {
  id: string;
  brand_group_id: string;
  name: string;
  description: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  website_url: string | null;
  logo_url: string;
  logo_alt: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}
