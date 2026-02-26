export const pageTypes = ["home", "about", "contact"] as const;

export const defaultPageTypes = [
  ...pageTypes,
  "services",
  "blog",
  "team",
  "gallery",
  "events",
] as const;

export const allPageTypes = [
  ...pageTypes,
  "custom",
  "services",
  "blog",
  "team",
  "gallery",
  "events",
] as const;
