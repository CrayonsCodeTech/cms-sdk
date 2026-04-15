import type { Faq } from "./faq";

export interface FaqGroup {
  id: string;
  site_id: string;
  title: string;
  description: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  order: number;
  faqs: Faq[];
  created_at: string;
  updated_at: string;
}
