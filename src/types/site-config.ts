export interface Branding {
  logo_primary?: string;
  logo_dark?: string;
  logo_secondary?: string;
}

export interface SocialLink {
  site_name: string;
  link: string;
}

export interface LocationConfig {
  location: string[];
  google_maps_url?: string;
  embed_map_url?: string;
}

export interface ContactConfig {
  phone_number: string[];
  email: string[];
  socials: SocialLink[];
  location?: LocationConfig;
}

export interface SiteConfig {
  id: number;
  site_id: number;
  site_name: string;
  site_description: string;
  logo: Branding;
  contact: ContactConfig;
}
