export interface Social {
  site_name: string;
  url: string;
  /** @deprecated Never sent by the API; read `site_name`. */
  platform?: string;
}

export interface TeamMember {
  id: string;
  site_id: string;
  category_id: string;
  name: string;
  slug: string;
  position: string | null;
  description: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  profile_image: string | null;
  email: string | null;
  location: string | null;
  socials: Social[] | null;
  is_published: boolean;
  order: number;
  extra: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
