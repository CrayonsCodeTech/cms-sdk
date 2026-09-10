/**
 * Page type identifiers. Mirrors cms-backend/src/constants/pageTypes.ts.
 *
 * `pageTypes` are the singleton types — a site may have at most one page of
 * each, enforced on create by the backend (cms/page/page.routes.ts). Attempting
 * a second one is rejected with "A page with type "<type>" already exists for
 * this site". `custom` is the only repeatable type.
 */
export const pageTypes = [
  "home",
  "about",
  "contact",
  "services",
  "blog",
  "team",
  "gallery",
  "events",
] as const;

/** The full set accepted by the backend's page validator. */
export const allPageTypes = [...pageTypes, "custom"] as const;

export type PageType = (typeof allPageTypes)[number];
