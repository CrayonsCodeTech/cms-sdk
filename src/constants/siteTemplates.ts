export const siteTemplates = ["modern_clean", "classic_corporate"] as const;

export type SiteTemplate = (typeof siteTemplates)[number];

export const DEFAULT_SITE_TEMPLATE: SiteTemplate = "modern_clean";
