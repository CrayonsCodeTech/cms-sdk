import type { Faq } from "./faq";
import type { Section } from "./cms-page";
import type { ProductSEO } from "./seo";

export interface FaqGroup {
  id: string;
  site_id: string;
  title: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  description: string | null;
  order: number;
  faqs: Faq[];
  seo?: ProductSEO | null;
  extra?: {
    sections: Section[];
  } | null;
  created_at: string;
  updated_at: string;
}
