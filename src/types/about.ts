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
  id: number;
  site_id: number;
  company_profile_summary: string;
  company_profile: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  vision: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  mission: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  image_url: string;
  image_alt: string;
  video_url: string;
  founding_year: string;
  values: AboutValue[];
  stats: AboutStat[];
}
