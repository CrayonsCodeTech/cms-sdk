import { CACHE, PAGINATION } from "../constants";
import type { PaginatedResponse } from "../types/pagination";
import type { Header } from "../types/header";
import type { Footer } from "../types/footer";
import type { SiteConfig } from "../types/site-config";
import type { Page, PageListItem } from "../types/cms-page";
import type { PageType } from "../constants/pageTypes";
import type { AboutUsData } from "../types/about";
import type { Service } from "../types/service";
import type { Blog } from "../types/blog";
import type { Category } from "../types/category";
import type { TeamMember } from "../types/team-member";
import type { Album, AlbumItem } from "../types/album";
import type { BrandGroup, Brand } from "../types/brand";
import type { Testimonial } from "../types/testimonials";
import type { Event } from "../types/event";
import type { Faq } from "../types/faq";
import type { FaqGroup } from "../types/faq-group";
import type { Redirect, ResolvedRedirect } from "../types/redirect";
import type {
  ContactPayload,
  Contact,
  PublicContactConfig,
} from "../types/contact";
import {
  MAX_CONTACT_ATTACHMENTS,
  MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES,
  CONTACT_ATTACHMENT_MIME_ALLOWLIST,
} from "../types/contact";
import type { Product, ProductListItem, ProductTagMatch } from "../types/product";
import type { ProductCategory, ProductCategoryDetail } from "../types/product-category";
import type { ProductBrand, ProductBrandDetail } from "../types/product-brand";
import type { Collection, CollectionDetail } from "../types/collection";
import type { Order, PlaceOrderPayload } from "../types/order";
import type { StoreSettings } from "../types/store-setting";
import type {
  SitemapBlogItem,
  SitemapPageItem,
  SitemapProductItem,
  SitemapCollectionItem,
  SitemapResource,
  SitemapResourceMap,
} from "../types/sitemap";

export interface FetchOptions extends RequestInit {
  revalidate?: number;
  tags?: string[];
  retries?: number;
  /**
   * Milliseconds each attempt (request plus reading its body) may take before
   * it fails with a `CmsError` whose `timedOut` is true. A timeout is not
   * retried. `0` turns the timeout off. Defaults to the client's `timeoutMs`,
   * or `DEFAULT_TIMEOUT_MS` (`DEFAULT_SUBMIT_TIMEOUT_MS` for `submitContactForm`).
   */
  timeoutMs?: number;
}

export interface CmsClientConfig {
  baseUrl: string;
  defaultOptions?: FetchOptions;
  /** Default `timeoutMs` for every read. Defaults to `DEFAULT_TIMEOUT_MS`. */
  timeoutMs?: number;
}

export class CmsError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public url?: string,
    /** Per-field validation details from a 400 (`body.errors`), when the API sent them. */
    public errors?: unknown,
    /** Seconds to wait before retrying, from a 429's `Retry-After` header. */
    public retryAfter?: number,
    /** True when the request gave up after `timeoutMs`; `status` is then absent. */
    public timedOut?: boolean,
  ) {
    super(message);
    this.name = "CmsError";
  }
}

/** Default per-attempt timeout for reads, in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Default timeout for `submitContactForm`, which may upload up to 3 MiB of attachments. */
export const DEFAULT_SUBMIT_TIMEOUT_MS = 30_000;

/** Most ids an id-list filter (`ids`, `album_id`, `category_id`, `brand_id`, collection `id`) accepts; more is a 400. */
export const MAX_ID_LIST = 20;

/** Most line items `placeOrder` accepts in one order; more is a 400. */
export const MAX_ORDER_ITEMS = 50;

/** Longest `source_path` the 404 log accepts. */
const MAX_404_LOG_PATH_LENGTH = 2048;

// The API answers errors as { message, errors? }; fall back to the status when
// the body is not JSON (a proxy error page, say).
async function errorFromResponse(response: Response, url: string): Promise<CmsError> {
  let message = `API request failed: ${response.status} ${url}`;
  let errors: unknown;
  try {
    const body = await response.json();
    if (body?.message) message = body.message;
    errors = body?.errors;
  } catch {
    // body not JSON, keep fallback
  }
  const retryAfterHeader = Number(response.headers.get("Retry-After"));
  const retryAfter =
    Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : undefined;
  return new CmsError(message, response.status, url, errors, retryAfter);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Races `run` against a timer instead of handing fetch an AbortSignal: Next.js
// skips its per-render request dedupe for any fetch that carries a signal, so a
// default signal would double the identical page and site-config fetches a
// render makes. The abandoned request is not cancelled, but the caller stops
// waiting for it. `ms <= 0` turns the timeout off.
async function withTimeout<T>(run: () => Promise<T>, ms: number, url: string): Promise<T> {
  if (!(ms > 0)) return run();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new CmsError(`Request timed out after ${ms}ms`, undefined, url, undefined, undefined, true),
        ),
      ms,
    );
  });
  try {
    return await Promise.race([run(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Statuses worth a retry: the gateway or the worker was briefly unavailable. */
const RETRY_STATUSES = [502, 503, 504];

/** Returned from an attempt that should be retried after a backoff. */
const RETRY = Symbol("retry");

export function createCmsClient(config: CmsClientConfig) {
  const { baseUrl, defaultOptions = {} } = config;
  const clientTimeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function cmsFetch<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T | null> {
    const url = `${baseUrl}${endpoint}`;
    const {
      revalidate = CACHE.NO_CACHE,
      tags,
      retries = 1,
      timeoutMs = clientTimeoutMs,
      ...rest
    } = { ...defaultOptions, ...options };

    const fetchConfig: RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    } = {
      ...rest,
      next: {
        revalidate,
        ...(tags && { tags }),
      },
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const outcome = await withTimeout(
          async () => {
            const response = await fetch(url, fetchConfig);

            if (!response.ok) {
              // Retry on transient server errors (502, 503, 504)
              if (attempt < retries && RETRY_STATUSES.includes(response.status)) {
                return RETRY;
              }

              throw await errorFromResponse(response, url);
            }

            // 204 / empty body — nothing to parse
            if (response.status === 204) {
              return { value: null };
            }

            const result = await response.json();
            return { value: (result.data ?? result) as T };
          },
          timeoutMs,
          url,
        );

        if (outcome === RETRY) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        return outcome.value;
      } catch (error) {
        if (error instanceof CmsError) throw error;

        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        const msg =
          error instanceof Error ? error.message : String(error);
        throw new CmsError(`Request failed: ${msg}`, undefined, url);
      }
    }

    throw new CmsError(`Request failed after ${retries + 1} attempts`, undefined, url);
  }

  async function cmsFetchPaginated<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<PaginatedResponse<T>> {
    const url = `${baseUrl}${endpoint}`;
    const {
      revalidate = CACHE.NO_CACHE,
      tags,
      retries = 1,
      timeoutMs = clientTimeoutMs,
      ...rest
    } = { ...defaultOptions, ...options };

    const fetchConfig: RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    } = {
      ...rest,
      next: {
        revalidate,
        ...(tags && { tags }),
      },
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const outcome = await withTimeout(
          async () => {
            const response = await fetch(url, fetchConfig);

            if (!response.ok) {
              if (attempt < retries && RETRY_STATUSES.includes(response.status)) {
                return RETRY;
              }

              throw await errorFromResponse(response, url);
            }

            return { value: (await response.json()) as PaginatedResponse<T> };
          },
          timeoutMs,
          url,
        );

        if (outcome === RETRY) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        return outcome.value;
      } catch (error) {
        if (error instanceof CmsError) throw error;

        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }

        const msg =
          error instanceof Error ? error.message : String(error);
        throw new CmsError(`Request failed: ${msg}`, undefined, url);
      }
    }

    throw new CmsError(`Request failed after ${retries + 1} attempts`, undefined, url);
  }

  function buildQueryString(
    params: Record<string, string | number | string[] | number[] | undefined | null>,
  ): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)));
        } else {
          query.append(key, String(value));
        }
      }
    });
    return query.toString();
  }

  // Multi-value filters are sent comma-separated (`?brand_id=a,b`), which is
  // what the backend parses; buildQueryString would repeat the key instead.
  // The backend takes at most MAX_ID_LIST ids per filter and answers more with 400.
  function joinIds(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value.join(",") : value;
  }

  // Default page size for list endpoints (categories, team, brands, testimonials,
  // faq-groups, faqs). Matches the backend's getPaginationParamsDefaultToMax(c, 20).
  // Album-items is NOT one of these: it uses getPublicPaginationParams(c, 100), so
  // its server-side default is 10 and callers should pass an explicit `limit`.
  const LIST_DEFAULT_LIMIT = PAGINATION.LIST_DEFAULT_LIMIT;

  // ============================================================================
  // Header, Footer, Site Config
  // ============================================================================

  function fetchHeader(
    siteId: string,
    options?: FetchOptions,
  ): Promise<Header | null> {
    return cmsFetch<Header>(`/api/public/cms/${siteId}/header/`, {
      revalidate: CACHE.MEDIUM,
      tags: ["header"],
      ...options,
    });
  }

  function fetchFooter(
    siteId: string,
    options?: FetchOptions,
  ): Promise<Footer | null> {
    return cmsFetch<Footer>(`/api/public/cms/${siteId}/footer/`, {
      revalidate: CACHE.MEDIUM,
      tags: ["footer"],
      ...options,
    });
  }

  function fetchSiteConfig(
    siteId: string,
    options?: FetchOptions,
  ): Promise<SiteConfig | null> {
    return cmsFetch<SiteConfig>(`/api/public/cms/${siteId}/site-config/`, {
      revalidate: CACHE.MEDIUM,
      tags: ["site-config"],
      ...options,
    });
  }

  // ============================================================================
  // Pages
  // ============================================================================

  function fetchPages(
    siteId: string,
    /** `limit` defaults to 10 server-side, max 20. */
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<PageListItem>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<PageListItem>(
      `/api/public/cms/${siteId}/page/?${query}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["pages"],
        ...options,
      },
    );
  }

  async function fetchPageByUrl(
    siteId: string,
    urlPath: string,
    options?: FetchOptions,
  ): Promise<Page | null> {
    const targetUrl =
      urlPath === "/" || urlPath === ""
        ? "/"
        : `/${urlPath.replace(/^\/|\/$/g, "")}`;

    return cmsFetch<Page>(
      `/api/public/cms/${siteId}/page/by-url/?url=${encodeURIComponent(targetUrl)}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["pages", `page-${targetUrl || "root"}`],
        ...options,
      },
    );
  }

  /**
   * The site's single published page of a given type, with its sections — the
   * same payload as `fetchPageByUrl`. Prefer this when you know which kind of
   * page you want but not its url, since an editor can rename the url at any
   * time. Throws `CmsError` (404) when the site has no published page of that type.
   */
  async function fetchPageByType(
    siteId: string,
    pageType: PageType,
    options?: FetchOptions,
  ): Promise<Page | null> {
    return cmsFetch<Page>(
      `/api/public/cms/${siteId}/page/by-type/${encodeURIComponent(pageType)}/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["pages", `page-type-${pageType}`],
        ...options,
      },
    );
  }

  // ============================================================================
  // About Us
  // ============================================================================

  function fetchAboutUs(
    siteId: string,
    options?: FetchOptions,
  ): Promise<AboutUsData | null> {
    return cmsFetch<AboutUsData>(`/api/public/cms/${siteId}/about-us/`, {
      revalidate: CACHE.MEDIUM,
      tags: ["about"],
      ...options,
    });
  }

  // ============================================================================
  // Services
  // ============================================================================

  async function fetchServices(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Service>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<Service>(
      `/api/public/cms/${siteId}/services/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["services"],
        ...options,
      },
    );
  }

  function fetchServiceBySlug(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<Service | null> {
    return cmsFetch<Service>(`/api/public/cms/${siteId}/services/${slug}`, {
      revalidate: CACHE.SHORT,
      tags: ["services", `service-${slug}`],
      ...options,
    });
  }

  // ============================================================================
  // Blogs
  // ============================================================================

  function fetchBlogs(
    siteId: string,
    params: { page?: number; limit?: number; search?: string } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Blog>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<Blog>(`/api/public/cms/${siteId}/blog/?${query}`, {
      revalidate: CACHE.SHORT,
      tags: ["blogs"],
      ...options,
    });
  }

  function fetchBlogBySlug(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<Blog | null> {
    return cmsFetch<Blog>(`/api/public/cms/${siteId}/blog/${slug}`, {
      revalidate: CACHE.SHORT,
      tags: ["blogs", `blog-${slug}`],
      ...options,
    });
  }

  // Backwards-compatible alias. Backend route resolves by slug.
  function fetchBlogById(
    siteId: string,
    idOrSlug: number | string,
    options?: FetchOptions,
  ): Promise<Blog | null> {
    return fetchBlogBySlug(siteId, String(idOrSlug), options);
  }

  // ============================================================================
  // Categories
  // ============================================================================

  function fetchCategories(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Category>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<Category>(
      `/api/public/cms/${siteId}/categories/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["categories"],
        ...options,
      },
    );
  }

  function fetchCategoryBySlug(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<Category | null> {
    return cmsFetch<Category>(`/api/public/cms/${siteId}/categories/${slug}`, {
      revalidate: CACHE.MEDIUM,
      tags: ["categories", "team", `category-${slug}`],
      ...options,
    });
  }

  // ============================================================================
  // Team Members
  // ============================================================================

  function fetchTeamMembers(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<TeamMember>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<TeamMember>(
      `/api/public/cms/${siteId}/team-members/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["team"],
        ...options,
      },
    );
  }

  function fetchTeamMembersByCategory(
    siteId: string,
    params: { categoryId: string; page?: number; limit?: number },
    options?: FetchOptions,
  ): Promise<PaginatedResponse<TeamMember>> {
    const query = buildQueryString({
      category_id: params.categoryId,
      page: params.page,
      limit: params.limit,
    });
    return cmsFetchPaginated<TeamMember>(
      `/api/public/cms/${siteId}/team-members/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["team", `team-category-${params.categoryId}`],
        ...options,
      },
    );
  }

  function fetchTeamMemberBySlug(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<TeamMember | null> {
    return cmsFetch<TeamMember>(`/api/public/cms/${siteId}/team-members/${slug}`, {
      revalidate: CACHE.MEDIUM,
      tags: ["team", `team-member-${slug}`],
      ...options,
    });
  }

  // ============================================================================
  // Albums
  // ============================================================================

  function fetchAlbums(
    siteId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      /**
       * Only these albums (array or comma-separated ids), e.g. for an album-group
       * section. At most MAX_ID_LIST (20) ids, more is a 400. An empty list
       * matches no albums — omit the param to get all of them.
       */
      ids?: string | string[];
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Album>> {
    const query = buildQueryString({ ...params, ids: joinIds(params.ids) });
    return cmsFetchPaginated<Album>(
      `/api/public/cms/${siteId}/albums/?${query}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["albums"],
        ...options,
      },
    );
  }

  function fetchAlbumBySlug(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<Album | null> {
    return cmsFetch<Album>(`/api/public/cms/${siteId}/albums/${slug}`, {
      revalidate: CACHE.SHORT,
      tags: ["albums", `album-${slug}`],
      ...options,
    });
  }

  function fetchAlbumItems(
    siteId: string,
    params: {
      /** Album slug. */
      album?: string;
      /**
       * Album ids (array or comma-separated). At most MAX_ID_LIST (20), more is
       * a 400. An empty list matches no items — omit the param instead.
       */
      album_id?: string | string[];
      page?: number;
      /**
       * Defaults to 10 server-side (max 100) — pass an explicit value to get a
       * whole album, or several albums' worth for an album-group section.
       */
      limit?: number;
    },
    options?: FetchOptions,
  ): Promise<PaginatedResponse<AlbumItem>> {
    const query = buildQueryString({ ...params, album_id: joinIds(params.album_id) });
    return cmsFetchPaginated<AlbumItem>(
      `/api/public/cms/${siteId}/albums/album-items/?${query}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["album-items"],
        ...options,
      },
    );
  }

  // ============================================================================
  // Brands
  // ============================================================================

  function fetchBrandGroups(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<BrandGroup>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<BrandGroup>(
      `/api/public/cms/${siteId}/brand-groups/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["brand-groups"],
        ...options,
      },
    );
  }

  function fetchBrandGroupBySlug(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<BrandGroup | null> {
    return cmsFetch<BrandGroup>(`/api/public/cms/${siteId}/brand-groups/${slug}`, {
      revalidate: CACHE.MEDIUM,
      tags: ["brand-groups", "brands", `brand-group-${slug}`],
      ...options,
    });
  }

  function fetchBrands(
    siteId: string,
    params: { group?: string; group_id?: string; page?: number; limit?: number },
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Brand>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<Brand>(
      `/api/public/cms/${siteId}/brand-groups/brands/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["brands"],
        ...options,
      },
    );
  }

  // ============================================================================
  // Testimonials
  // ============================================================================

  function fetchTestimonials(
    siteId: string,
    params?: { type?: "testimonial" | "review" | string; page?: number; limit?: number },
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Testimonial>> {
    const query = buildQueryString({
      type: params?.type,
      page: params?.page,
      limit: params?.limit,
    });
    return cmsFetchPaginated<Testimonial>(
      `/api/public/cms/${siteId}/testimonials/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["testimonials"],
        ...options,
      },
    );
  }

  // ============================================================================
  // Events
  // ============================================================================

  function fetchEvents(
    siteId: string,
    params: { page?: number; limit?: number; search?: string } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Event>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<Event>(
      `/api/public/cms/${siteId}/events/?${query}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["events"],
        ...options,
      },
    );
  }

  function fetchEventBySlug(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<Event | null> {
    return cmsFetch<Event>(`/api/public/cms/${siteId}/events/${slug}`, {
      revalidate: CACHE.SHORT,
      tags: ["events", `event-${slug}`],
      ...options,
    });
  }

  // ============================================================================
  // FAQ Groups
  // ============================================================================

  function fetchFaqGroups(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<FaqGroup>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<FaqGroup>(
      `/api/public/cms/${siteId}/faq-groups/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["faq-groups"],
        ...options,
      },
    );
  }

  /**
   * Public Turnstile settings for the site's contact form.
   *
   * Call this before rendering the form: when `turnstile.enabled` is true the
   * widget must be rendered with `turnstile.site_key` and its token passed to
   * `submitContactForm`, or every submission is rejected.
   */
  function fetchContactConfig(
    siteId: string,
    options?: FetchOptions,
  ): Promise<PublicContactConfig | null> {
    return cmsFetch<PublicContactConfig>(
      `/api/public/cms/${siteId}/contact-config/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["contact-config"],
        ...options,
      },
    );
  }

  /**
   * Submit the contact form.
   *
   * Throws `CmsError` on a rejection, like every method here: `error.status`
   * tells "captcha failed, reset the widget" (403) apart from "rate limited"
   * (429, with `error.retryAfter`) and a network blip.
   *
   * Pass `attachments` to send files; the request then goes out as multipart
   * instead of JSON. Caps are enforced server-side and pre-checked here.
   */
  async function submitContactForm(
    siteId: string,
    payload: ContactPayload,
    attachments?: File[],
    options?: FetchOptions,
  ): Promise<Contact> {
    const url = `${baseUrl}/api/public/cms/${siteId}/contact/`;

    if (attachments?.length) {
      if (attachments.length > MAX_CONTACT_ATTACHMENTS) {
        throw new CmsError(
          `At most ${MAX_CONTACT_ATTACHMENTS} attachments are allowed`,
          400,
          url,
        );
      }
      const totalBytes = attachments.reduce((sum, f) => sum + f.size, 0);
      if (totalBytes > MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES) {
        throw new CmsError(
          `Attachments exceed the ${
            MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES / (1024 * 1024)
          } MiB total size limit`,
          400,
          url,
        );
      }
      // The API detects the type from the file's bytes, so only reject a type
      // the browser actually declared. An empty or generic one (a .docx on some
      // systems) is left for the server to judge.
      for (const f of attachments) {
        if (
          f.type &&
          f.type !== "application/octet-stream" &&
          !CONTACT_ATTACHMENT_MIME_ALLOWLIST.includes(f.type.split(";")[0].trim())
        ) {
          throw new CmsError(
            `Attachment type not allowed: ${f.type || "unknown"}`,
            400,
            url,
          );
        }
      }
    }

    let body: BodyInit;
    const headers: Record<string, string> = {};
    if (attachments?.length) {
      // multipart — the runtime must set Content-Type so the boundary is right,
      // so no Content-Type header is set here.
      const form = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) form.append(key, String(value));
      }
      for (const file of attachments) form.append("attachments", file, file.name);
      body = form;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(payload);
    }

    // No retries: the body may be a consumed stream, a resend would duplicate
    // the submission, and the one retryable-looking status here (503, a
    // misconfigured Turnstile) is a deployment fault that will not self-heal —
    // retrying it just burns the 1-per-60s write budget.
    // A timed-out submission may still have reached the CMS, so do not resend it
    // automatically either.
    const { timeoutMs = DEFAULT_SUBMIT_TIMEOUT_MS, ...fetchOptions } = options ?? {};
    return withTimeout(
      async () => {
        let response: Response;
        try {
          response = await fetch(url, {
            ...fetchOptions,
            method: "POST",
            headers: { ...headers, ...(fetchOptions.headers as Record<string, string>) },
            body,
          });
        } catch (error) {
          throw new CmsError(
            error instanceof Error ? error.message : "Network request failed",
            undefined,
            url,
          );
        }

        if (!response.ok) {
          throw await errorFromResponse(response, url);
        }

        const result = await response.json();
        return (result.data ?? result) as Contact;
      },
      timeoutMs,
      url,
    );
  }

  function fetchFaqs(
    siteId: string,
    params?: { group_id?: string; page?: number; limit?: number },
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Faq>> {
    const query = buildQueryString({
      group_id: params?.group_id,
      page: params?.page,
      limit: params?.limit,
    });
    return cmsFetchPaginated<Faq>(
      `/api/public/cms/${siteId}/faqs/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["faqs"],
        ...options,
      },
    );
  }

  // ============================================================================
  // Redirects
  // ============================================================================

  /** All enabled redirects. Throws `CmsError` 403 when redirects are turned off for the site. */
  async function fetchRedirects(
    siteId: string,
    options?: FetchOptions,
  ): Promise<Redirect[]> {
    const result = await cmsFetch<Redirect[]>(
      `/api/public/cms/${siteId}/redirects/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["redirects"],
        ...options,
      },
    );
    return result ?? [];
  }

  /**
   * The redirect matching `sourcePath`. Throws `CmsError` 404 when nothing
   * matches and 403 when redirects are turned off for the site.
   */
  function resolveRedirect(
    siteId: string,
    sourcePath: string,
    options?: FetchOptions,
  ): Promise<ResolvedRedirect | null> {
    return cmsFetch<ResolvedRedirect>(
      `/api/public/cms/${siteId}/redirects/resolve/?sourcePath=${encodeURIComponent(sourcePath)}`,
      {
        revalidate: CACHE.NO_CACHE,
        tags: ["redirects", `redirect-${sourcePath}`],
        ...options,
      },
    );
  }

  /**
   * Log a 404 hit. `referrer` is kept only when it is an absolute http(s) URL.
   * The root path and paths over 2048 characters are never logged, so they
   * resolve to null without a request instead of drawing a 400.
   */
  async function reportRedirect404(
    siteId: string,
    sourcePath: string,
    referrer?: string,
    options?: FetchOptions,
  ): Promise<null> {
    const trimmed = sourcePath.trim();
    if (!trimmed || /^\/+$/.test(trimmed) || trimmed.length > MAX_404_LOG_PATH_LENGTH) {
      return null;
    }

    const headers = {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    };

    // Answers 204 with no body: the log row is the site's traffic data.
    return cmsFetch<null>(
      `/api/public/cms/${siteId}/redirects/404-logs/`,
      {
        method: "POST",
        ...options,
        headers,
        body: JSON.stringify({
          source_path: sourcePath,
          referrer,
        }),
        revalidate: CACHE.NO_CACHE,
        tags: ["redirects", "redirect-404-logs"],
        retries: 0,
      },
    );
  }

  // ============================================================================
  // Store — Products, Categories, Brands, Collections, Orders
  // Note: Uses /api/public/store/ prefix (NOT /api/public/cms/)
  // ============================================================================

  function fetchStoreSettings(
    siteId: string,
    options?: FetchOptions,
  ): Promise<StoreSettings | null> {
    return cmsFetch<StoreSettings>(`/api/public/store/${siteId}/settings/`, {
      revalidate: CACHE.MEDIUM,
      tags: ["store-settings"],
      ...options,
    });
  }

  function fetchProductCategories(
    siteId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      /** Defaults to `order`. */
      ordering?: "order" | "-order" | "name" | "-name";
      /** A parent's id for its children, or `null` for top-level categories only. */
      parent_id?: string | null;
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<ProductCategory>> {
    // buildQueryString drops null, but the API reads the literal "null" as
    // "no parent" — without it every category comes back.
    const query = buildQueryString({
      ...params,
      parent_id: params.parent_id === null ? "null" : params.parent_id,
    });
    return cmsFetchPaginated<ProductCategory>(
      `/api/public/store/${siteId}/categories/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["product-categories"],
        ...options,
      },
    );
  }

  function fetchProductCategoryBySlug(
    siteId: string,
    slug: string,
    params: {
      page?: number;
      limit?: number;
      sort?: "name_asc" | "name_desc";
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<ProductCategoryDetail | null> {
    const query = buildQueryString(params);
    return cmsFetch<ProductCategoryDetail>(
      `/api/public/store/${siteId}/categories/${slug}/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["products", "product-categories", `product-category-${slug}`],
        ...options,
      },
    );
  }

  function fetchProductBrands(
    siteId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      /** Defaults to name ascending. */
      ordering?: "name" | "-name";
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<ProductBrand>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<ProductBrand>(
      `/api/public/store/${siteId}/brands/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["product-brands"],
        ...options,
      },
    );
  }

  function fetchProductBrandBySlug(
    siteId: string,
    slug: string,
    params: {
      page?: number;
      limit?: number;
      /** One id, or several (array or comma-separated, at most MAX_ID_LIST); includes subcategories. */
      category_id?: string | string[];
      sort?: "name_asc" | "name_desc";
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<ProductBrandDetail | null> {
    const query = buildQueryString({ ...params, category_id: joinIds(params.category_id) });
    return cmsFetch<ProductBrandDetail>(
      `/api/public/store/${siteId}/brands/${slug}/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["products", "product-brands", `product-brand-${slug}`],
        ...options,
      },
    );
  }

  function fetchProducts(
    siteId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      /** One id, or several (array or comma-separated, at most MAX_ID_LIST); includes subcategories. */
      category_id?: string | string[];
      tag_id?: string;
      /** One id, or several (array or comma-separated, at most MAX_ID_LIST). */
      brand_id?: string | string[];
      is_featured?: "true" | "false";
      /** `sort`, `min_price` and `max_price` are ignored when the store hides prices (newest first instead). */
      sort?: "price_asc" | "price_desc";
      min_price?: number;
      max_price?: number;
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<ProductListItem>> {
    const query = buildQueryString({
      ...params,
      category_id: joinIds(params.category_id),
      brand_id: joinIds(params.brand_id),
    });
    return cmsFetchPaginated<ProductListItem>(
      `/api/public/store/${siteId}/products/?${query}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["products"],
        ...options,
      },
    );
  }

  function fetchProductDetail(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<Product | null> {
    return cmsFetch<Product>(`/api/public/store/${siteId}/products/${slug}/`, {
      revalidate: CACHE.SHORT,
      tags: ["products", `product-${slug}`],
      ...options,
    });
  }

  function fetchProductsByTag(
    siteId: string,
    tag: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<ProductTagMatch>> {
    const query = buildQueryString({ tag, ...params });
    return cmsFetchPaginated<ProductTagMatch>(
      `/api/public/store/${siteId}/products/by-tag/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["products", `products-tag-${tag}`],
        ...options,
      },
    );
  }

  function fetchCollections(
    siteId: string,
    params: {
      page?: number;
      limit?: number;
      /** @deprecated Ignored by the API — collections are not searchable. */
      search?: string;
      /** Only these collections (array or comma-separated ids). At most MAX_ID_LIST (20), more is a 400. */
      id?: string | string[];
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Collection>> {
    const { search: _search, ...rest } = params;
    const query = buildQueryString({ ...rest, id: joinIds(params.id) });
    return cmsFetchPaginated<Collection>(
      `/api/public/store/${siteId}/collections/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["collections"],
        ...options,
      },
    );
  }

  function fetchCollectionDetail(
    siteId: string,
    slug: string,
    params: {
      page?: number;
      limit?: number;
      /** One id, or several (array or comma-separated, at most MAX_ID_LIST); includes subcategories. */
      category_id?: string | string[];
      sort?: "name_asc" | "name_desc";
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<CollectionDetail | null> {
    const query = buildQueryString({ ...params, category_id: joinIds(params.category_id) });
    return cmsFetch<CollectionDetail>(
      `/api/public/store/${siteId}/collections/${slug}/${
        query ? `?${query}` : ""
      }`,
      {
        revalidate: CACHE.SHORT,
        tags: ["collections", `collection-${slug}`],
        ...options,
      },
    );
  }

  function fetchCollectionDetailById(
    siteId: string,
    id: string,
    params: {
      page?: number;
      limit?: number;
      /** One id, or several (array or comma-separated, at most MAX_ID_LIST); includes subcategories. */
      category_id?: string | string[];
      sort?: "name_asc" | "name_desc";
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<CollectionDetail | null> {
    const query = buildQueryString({ ...params, category_id: joinIds(params.category_id) });
    return cmsFetch<CollectionDetail>(
      `/api/public/store/${siteId}/collections/id/${id}/${
        query ? `?${query}` : ""
      }`,
      {
        revalidate: CACHE.SHORT,
        tags: ["collections", `collection-${id}`],
        ...options,
      },
    );
  }

  /**
   * Place an order (at most MAX_ORDER_ITEMS line items). On a store that hides
   * prices the returned order carries no amounts. A 400 carries per-field
   * details in `error.errors`.
   */
  function placeOrder(
    siteId: string,
    payload: PlaceOrderPayload,
    options?: FetchOptions,
  ): Promise<Order | null> {
    return cmsFetch<Order>(`/api/public/store/${siteId}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      revalidate: CACHE.NO_CACHE,
      retries: 0,
      ...options,
    });
  }

  // ============================================================================
  // Sitemap — public endpoints for XML sitemap generation (fetch once per day)
  // ============================================================================

  function fetchSitemapBlogs(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<SitemapBlogItem>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<SitemapBlogItem>(
      `/api/public/cms/${siteId}/sitemap/blogs/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.STATIC,
        tags: ["sitemap", "sitemap-blogs"],
        ...options,
      },
    );
  }

  function fetchSitemapPages(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<SitemapPageItem>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<SitemapPageItem>(
      `/api/public/cms/${siteId}/sitemap/pages/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.STATIC,
        tags: ["sitemap", "sitemap-pages"],
        ...options,
      },
    );
  }

  function fetchSitemapProducts(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<SitemapProductItem>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<SitemapProductItem>(
      `/api/public/store/${siteId}/sitemap/products/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.STATIC,
        tags: ["sitemap", "sitemap-products"],
        ...options,
      },
    );
  }

  function fetchSitemapCollections(
    siteId: string,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<SitemapCollectionItem>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<SitemapCollectionItem>(
      `/api/public/store/${siteId}/sitemap/collections/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.STATIC,
        tags: ["sitemap", "sitemap-collections"],
        ...options,
      },
    );
  }

  // Resource key -> backend path. Store resources are namespaced under
  // /store/ and their keys are prefixed to avoid colliding with the CMS
  // `categories` route, which is a different resource entirely.
  const SITEMAP_ROUTES: Record<
    SitemapResource,
    { segment: string; store: boolean }
  > = {
    blogs: { segment: "blogs", store: false },
    pages: { segment: "pages", store: false },
    services: { segment: "services", store: false },
    events: { segment: "events", store: false },
    albums: { segment: "albums", store: false },
    "team-members": { segment: "team-members", store: false },
    "team-categories": { segment: "team-categories", store: false },
    "brand-groups": { segment: "brand-groups", store: false },
    products: { segment: "products", store: true },
    collections: { segment: "collections", store: true },
    "product-categories": { segment: "categories", store: true },
    "product-brands": { segment: "brands", store: true },
  };

  /**
   * Fetch any sitemap resource. Returns slug/url, title/name, image (where
   * the content type has one) and `updatedAt` for `lastModified`.
   */
  function fetchSitemap<R extends SitemapResource>(
    siteId: string,
    resource: R,
    params: { page?: number; limit?: number } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<SitemapResourceMap[R]>> {
    const { segment, store } = SITEMAP_ROUTES[resource];
    const namespace = store ? "store" : "cms";
    const query = buildQueryString(params);
    return cmsFetchPaginated<SitemapResourceMap[R]>(
      `/api/public/${namespace}/${siteId}/sitemap/${segment}/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.STATIC,
        tags: ["sitemap", `sitemap-${resource}`],
        ...options,
      },
    );
  }

  return {
    // Default page size for list endpoints (categories, team, brands, testimonials, etc.)
    LIST_DEFAULT_LIMIT,
    // Header, Footer, Site Config
    fetchHeader,
    fetchFooter,
    fetchSiteConfig,
    // Pages
    fetchPages,
    fetchPageByUrl,
    fetchPageByType,
    // About
    fetchAboutUs,
    // Services
    fetchServices,
    fetchServiceBySlug,
    // Blogs
    fetchBlogs,
    fetchBlogBySlug,
    fetchBlogById,
    // Categories
    fetchCategories,
    fetchCategoryBySlug,
    // Team Members
    fetchTeamMembers,
    fetchTeamMembersByCategory,
    fetchTeamMemberBySlug,
    // Albums
    fetchAlbums,
    fetchAlbumBySlug,
    fetchAlbumItems,
    // Brands
    fetchBrandGroups,
    fetchBrandGroupBySlug,
    fetchBrands,
    // Testimonials
    fetchTestimonials,
    // Events
    fetchEvents,
    fetchEventBySlug,
    // FAQ Groups
    fetchFaqGroups,
    fetchFaqs,
    // Redirects
    fetchRedirects,
    resolveRedirect,
    reportRedirect404,
    // Contact
    submitContactForm,
    fetchContactConfig,
    // Store
    fetchStoreSettings,
    fetchProductCategories,
    fetchProductBrands,
    fetchProductBrandBySlug,
    fetchProductCategoryBySlug,
    fetchProducts,
    fetchProductDetail,
    fetchProductsByTag,
    fetchCollections,
    fetchCollectionDetail,
    fetchCollectionDetailById,
    placeOrder,
    // Sitemap
    fetchSitemap,
    fetchSitemapBlogs,
    fetchSitemapPages,
    fetchSitemapProducts,
    fetchSitemapCollections,
    // Generic fetch utilities
    fetch: cmsFetch,
    fetchPaginated: cmsFetchPaginated,
    utils: {
      buildQueryString,
    },
  };
}
