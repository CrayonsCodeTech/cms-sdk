export interface Faq {
  id: string;
  group_id: string;
  question: string;
  answer: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
