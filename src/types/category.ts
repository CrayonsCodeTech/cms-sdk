import type { Section } from "./cms-page";
import type { ProductSEO } from "./seo";
import type { TeamMember } from "./team-member";

export interface Category {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  description?: string | null;
  order: number;
  seo?: ProductSEO | null;
  extra?: (Record<string, unknown> & { sections?: Section[] }) | null;
  created_at: string;
  updated_at: string;
  /** Published members, ordered. Only present on `fetchCategoryBySlug`. */
  members?: TeamMember[];
}
