export interface ProductSEO {
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

export interface ProductExtraData extends Record<string, unknown> {}