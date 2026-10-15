export interface AboutValue {
  image?: { url?: string; alt?: string };
  icon: string;
  title: string;
  description: string;
}

export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutUsData {
  id: string;
  site_id: string;
  company_profile_summary?: string | null;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  company_profile: string;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  vision?: string | null;
  /** HTML (rich text): sanitize before rendering (README "Rich Text / HTML Fields"); never inject raw. */
  mission?: string | null;
  image_url: string;
  image_alt: string;
  video_url?: string | null;
  founding_year?: string | null;
  values: AboutValue[];
  stats?: AboutStat[] | null;
  extra?: Record<string, unknown> | null;
}
