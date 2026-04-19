export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

// Alias for backwards compatibility
export type PaginationInfo = PaginationMeta;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
