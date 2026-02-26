export interface Social {
  platform?: string;
  url?: string;
}

export interface TeamMember {
  id: string;
  site_id: string;
  category_id: string;
  name: string;
  slug: string;
  position?: string;
  description?: string;
  profile_image?: string;
  email?: string;
  location?: string;
  socials?: Social[];
  is_published: boolean;
  order: number;
  extra?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
