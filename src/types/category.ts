import type { Section } from "./cms-page";
import type { ProductSEO } from "./seo";

export interface Category {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  description?: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  order: number;
  seo?: ProductSEO | null;
  extra?: (Record<string, unknown> & { sections?: Section[] }) | null;
  created_at: string;
  updated_at: string;
}
