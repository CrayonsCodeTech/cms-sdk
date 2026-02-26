import type { Faq } from "./faq";

export interface FaqGroup {
  id: string;
  site_id: string;
  title: string;
  description: string | null;
  order: number;
  faqs: Faq[];
  created_at: string;
  updated_at: string;
}
