export interface AboutValue {
  image: any;
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
  company_profile: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  vision?: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  mission?: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  image_url: string;
  image_alt: string;
  video_url?: string | null;
  founding_year?: string | null;
  values: AboutValue[];
  stats?: AboutStat[] | null;
  extra?: Record<string, unknown> | null;
}
