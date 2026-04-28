export type RedirectStatusCode = 301 | 302 | 307 | 308;

export interface Redirect {
  id: string;
  site_id: string;
  source_path: string;
  destination_path: string;
  status_code: RedirectStatusCode;
  group?: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResolvedRedirect {
  redirect: Redirect;
  destinationPath: string;
  params: Record<string, string>;
  type: "manual" | "pattern";
}
