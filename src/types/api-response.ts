export interface APIResponse<T> {
  message: string;
  data: T[];
}

export interface SingleDataAPIResponse<T> {
  message: string;
  data: T;
}
