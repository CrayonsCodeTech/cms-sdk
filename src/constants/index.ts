export * from "./pageTypes";

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  BLOGS_PER_PAGE: 9,
  EVENTS_PER_PAGE: 9,
  ALBUMS_PER_PAGE: 9,
  MAX_ITEMS_FOR_SSG: 200,
} as const;

export const SEARCH = {
  DEBOUNCE_MS: 500,
  MIN_QUERY_LENGTH: 2,
} as const;

export const CACHE = {
  NO_CACHE: 0,
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  STATIC: 86400, // 24 hours
} as const;

export const ANIMATION = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.6,
} as const;

export const CONTACT_SUBJECTS = [
  "General Inquiry",
  "Project Proposal",
  "Careers",
  "Other",
] as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

export const MEDIA = {
  IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  VIDEO_EXTENSIONS: [".mp4", ".webm", ".ogg"],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
} as const;
