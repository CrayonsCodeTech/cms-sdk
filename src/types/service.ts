import type { Section } from "./page";

export interface Service {
  id: number;
  site_id: number;
  title: string;
  slug: string;
  short_description: string;
  excerpt: string;
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  image_url: string;
  image_alt: string;
  icon: string;
  features: string[];
  link_text: string;
  link_url: string;
  order: number;
  created_at: string;
  updated_at: string;
  extra?: {
    sections: Section[];
  } | null;
}
