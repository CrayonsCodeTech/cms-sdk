export const siteTemplates = [
  "modern_clean",
  "classic_corporate",
  "bold_dark",
  "editorial_bold",
  "modern_classic",
] as const;

export type SiteTemplate = (typeof siteTemplates)[number];

export const DEFAULT_SITE_TEMPLATE: SiteTemplate = "modern_clean";
