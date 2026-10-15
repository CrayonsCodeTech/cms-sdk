export interface Faq {
  id: string;
  group_id: string;
  question: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  answer: string;
  order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
