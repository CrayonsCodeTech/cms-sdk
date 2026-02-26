export interface UserSiteRole {
  id: number;
  site_id: number;
  user_id: number;
  role: string;
}

export interface Site {
  id: number;
  domain: string;
  userSiteRoles?: UserSiteRole[];
}

export interface CreateSitePayload {
  domain: string;
}

export interface UpdateSitePayload {
  domain?: string;
}
