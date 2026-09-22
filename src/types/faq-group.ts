import type { Faq } from "./faq";
import type { Section } from "./cms-page";
import type { ProductSEO } from "./seo";

export interface FaqGroup {
  id: string;
  site_id: string;
  title: string;
  description: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  order: number;
  faqs: Faq[];
  seo?: ProductSEO | null;
  extra?: {
    sections: Section[];
  } | null;
  created_at: string;
  updated_at: string;
}
