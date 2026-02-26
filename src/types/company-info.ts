import type { Branding, SocialLink } from "./site-config";

export interface CompanyInfo {
  companyName: string;
  tagline: string;
  slogan?: string;
  locations: string[];
  google_maps_url?: string;
  embed_map_url?: string;
  phone_numbers: string[];
  emails: string[];
  branding: Branding;
  socials?: SocialLink[];
  websiteUrl?: string;
  establishedDate?: string;
}
