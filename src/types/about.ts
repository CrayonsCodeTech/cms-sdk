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
  company_profile: string;
  vision: string;
  mission: string;
  image_url: string;
  image_alt: string;
  video_url: string;
  founding_year: string;
  values: AboutValue[];
  stats: AboutStat[];
}
