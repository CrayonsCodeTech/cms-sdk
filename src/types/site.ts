export interface UserSiteRole {
  id: string;
  site_id: string;
  user_id: string;
  role: string;
}

export interface Site {
  id: string;
  domain: string;
  is_published: boolean;
  is_store_enabled: boolean;
  is_static_build_enabled: boolean;
  is_redirect_enabled: boolean;
  is_redirect_log_enabled: boolean;
  deploy_hook_url: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  userSiteRoles?: UserSiteRole[];
}

export interface CreateSitePayload {
  domain: string;
}

export interface UpdateSitePayload {
  domain?: string;
}
