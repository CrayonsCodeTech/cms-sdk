export interface ContactPayload {
  name: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  type?: string;
  /**
   * Cloudflare Turnstile token from the widget on your form.
   *
   * Required whenever the site has Turnstile enabled — check with
   * `fetchContactConfig(siteId)`. Submitting without one is rejected with 403
   * (`CmsError`), and the token is single-use: on a failed submit, reset the
   * widget before retrying rather than resending the same value.
   */
  turnstile_token?: string;
}

export interface Contact extends ContactPayload {
  id: string;
  site_id: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Public Turnstile settings for a site's contact form, from
 * GET /:site_id/contact-config/.
 *
 * Named to avoid colliding with `ContactConfig` in ./site-config, which is the
 * site's displayed contact details (phone, email, socials) and unrelated.
 *
 * `enabled` with a null `site_key` means the site is misconfigured: the widget
 * cannot render and submissions will be rejected. Treat it as "do not show the
 * form" rather than "no captcha needed".
 */
export interface PublicContactConfig {
  turnstile: {
    enabled: boolean;
    site_key: string | null;
  };
}

/** Attachment caps enforced by the API; mirrored here to fail fast client-side. */
export const MAX_CONTACT_ATTACHMENTS = 3;
export const MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES = 4 * 1024 * 1024;
export const CONTACT_ATTACHMENT_MIME_ALLOWLIST: readonly string[] = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
