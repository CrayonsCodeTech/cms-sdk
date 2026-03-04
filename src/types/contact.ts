export interface ContactPayload {
  name: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  type?: string;
}

export interface Contact extends ContactPayload {
  id: string;
  site_id: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}
