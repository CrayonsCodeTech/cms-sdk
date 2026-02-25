export const CACHE = {
  NO_CACHE: 0,
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  STATIC: 86400, // 24 hours
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  BLOGS_PER_PAGE: 9,
  EVENTS_PER_PAGE: 9,
  ALBUMS_PER_PAGE: 9,
} as const;
