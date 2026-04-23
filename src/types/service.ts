import type { Section } from "./page";

export interface Service {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  image_url?: string | null;
  image_alt?: string | null;
  icon?: string | null;
  features: string[];
  link_text?: string | null;
  link_url?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
  extra?: {
    sections: Section[];
  } | null;
}
