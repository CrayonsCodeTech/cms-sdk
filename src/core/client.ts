import { CACHE, PAGINATION } from "../constants";
import type { PaginatedResponse } from "../types/pagination";
import type { Header } from "../types/header";
import type { Footer } from "../types/footer";
import type { SiteConfig } from "../types/site-config";
import type { Page, PageListItem } from "../types/page";
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
import type { Redirect, Redirect404Log, ResolvedRedirect } from "../types/redirect";
import type { ContactPayload, Contact } from "../types/contact";
import type { Product, ProductListItem, ProductVariant } from "../types/product";
import type { ProductCategory } from "../types/product-category";
import type { ProductBrand } from "../types/product-brand";
import type { Collection, CollectionDetail } from "../types/collection";
import type { Order, PlaceOrderPayload } from "../types/order";
import type { StoreSettings } from "../types/store-setting";
import type {
  SitemapBlogItem,
  SitemapPageItem,
  SitemapProductItem,
  SitemapCollectionItem,
} from "../types/sitemap";

export interface FetchOptions extends RequestInit {
  revalidate?: number;
  tags?: string[];
}

export interface CmsClientConfig {
  baseUrl: string;
  defaultOptions?: FetchOptions;
}

export class CmsError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public url?: string,
  ) {
    super(message);
    this.name = "CmsError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createCmsClient(config: CmsClientConfig) {
  const { baseUrl, defaultOptions = {} } = config;

  async function cmsFetch<T>(
    endpoint: string,
    options: FetchOptions = {},
    retries = 2,
  ): Promise<T | null> {
    const url = `${baseUrl}${endpoint}`;
    const {
      revalidate = CACHE.NO_CACHE,
      tags,
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

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, fetchConfig);

        if (!response.ok) {
          const errorMsg = `API request failed: ${response.status} ${url}`;
          console.error(errorMsg);

          // Retry on transient server errors (502, 503, 504)
          if (attempt < retries && [502, 503, 504].includes(response.status)) {
            await sleep(Math.pow(2, attempt) * 1000);
            continue;
          }

          return null;
        }

        const result = await response.json();
        return result.data ?? result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `API request error (attempt ${attempt + 1}/${retries + 1}): ${url}`,
          lastError,
        );

        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    return null;
  }

  async function cmsFetchPaginated<T>(
    endpoint: string,
    options: FetchOptions = {},
    retries = 2,
  ): Promise<PaginatedResponse<T>> {
    const emptyResponse: PaginatedResponse<T> = {
      data: [],
      pagination: {
        page: 1,
        limit: PAGINATION.DEFAULT_LIMIT,
        total: 0,
      },
    };

    const url = `${baseUrl}${endpoint}`;
    const {
      revalidate = CACHE.NO_CACHE,
      tags,
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
        const response = await fetch(url, fetchConfig);

        if (!response.ok) {
          console.error(`API request failed: ${response.status} ${url}`);

          if (attempt < retries && [502, 503, 504].includes(response.status)) {
            await sleep(Math.pow(2, attempt) * 1000);
            continue;
          }

          return emptyResponse;
        }

        return await response.json();
      } catch (error) {
        console.error(
          `API request error (attempt ${attempt + 1}/${retries + 1}): ${url}`,
          error,
        );

        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    return emptyResponse;
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

  // Default page size for list endpoints (categories, team, brands, testimonials,
  // faq-groups, faqs, album-items). Matches the backend's getPaginationParamsWithoutLimit(c, 20).
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
    params: { page?: number } = {},
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
    try {
      const targetUrl =
        urlPath === "/" || urlPath === ""
          ? "/"
          : `/${urlPath.replace(/^\/|\/$/g, "")}`;

      return await cmsFetch<Page>(
        `/api/public/cms/${siteId}/page/by-url/?url=${encodeURIComponent(targetUrl)}`,
        {
          revalidate: CACHE.SHORT,
          tags: ["pages", `page-${targetUrl || "root"}`],
          ...options,
        },
      );
    } catch (error) {
      console.error(`Error in fetchPageByUrl for ${urlPath}:`, error);
      return null;
    }
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

  // ============================================================================
  // Albums
  // ============================================================================

  function fetchAlbums(
    siteId: string,
    params: { page?: number; limit?: number; search?: string } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Album>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<Album>(
      `/api/public/cms/${siteId}/albums/?${query}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["albums"],
        ...options,
      },
    );
  }

  function fetchAlbumItems(
    siteId: string,
    params: { album?: string; album_id?: string; page?: number; limit?: number },
    options?: FetchOptions,
  ): Promise<PaginatedResponse<AlbumItem>> {
    const query = buildQueryString(params);
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

  async function submitContactForm(
    siteId: string,
    payload: ContactPayload,
    options?: FetchOptions,
  ): Promise<Contact | null> {
    return cmsFetch<Contact>(`/api/public/cms/${siteId}/contact/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      revalidate: CACHE.NO_CACHE, // Never cache form submissions
      ...options,
    });
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

  function reportRedirect404(
    siteId: string,
    sourcePath: string,
    referrer?: string,
    options?: FetchOptions,
  ): Promise<Redirect404Log | null> {
    const headers = {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    };

    return cmsFetch<Redirect404Log>(
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
      },
      0,
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
      ordering?: string;
      parent_id?: string | null;
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<ProductCategory>> {
    const query = buildQueryString(params);
    return cmsFetchPaginated<ProductCategory>(
      `/api/public/store/${siteId}/categories/${query ? `?${query}` : ""}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["product-categories"],
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
      ordering?: string;
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

  function fetchProducts(
    siteId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category_id?: string;
      tag_id?: string;
      brand_id?: string;
      is_featured?: "true" | "false";
      sort?: "price_asc" | "price_desc";
      min_price?: number;
      max_price?: number;
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<ProductListItem>> {
    const query = buildQueryString(params);
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
  ): Promise<PaginatedResponse<{ item: unknown; product: Product }> | null> {
    const query = buildQueryString({ tag, ...params });
    return cmsFetch<PaginatedResponse<{ item: unknown; product: Product }>>(
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
      search?: string;
      /** Comma-separated list of collection IDs (e.g., "id1,id2") */
      id?: string;
    } = {},
    options?: FetchOptions,
  ): Promise<PaginatedResponse<Collection>> {
    const query = buildQueryString(params);
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
      category_id?: string;
      sort?: "name_asc" | "name_desc";
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<CollectionDetail | null> {
    const query = buildQueryString(params);
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
      category_id?: string;
      sort?: "name_asc" | "name_desc";
      availability?: "in_stock" | "out_of_stock";
    } = {},
    options?: FetchOptions,
  ): Promise<CollectionDetail | null> {
    const query = buildQueryString(params);
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
    // Team Members
    fetchTeamMembers,
    fetchTeamMembersByCategory,
    // Albums
    fetchAlbums,
    fetchAlbumItems,
    // Brands
    fetchBrandGroups,
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
    // Store
    fetchStoreSettings,
    fetchProductCategories,
    fetchProductBrands,
    fetchProducts,
    fetchProductDetail,
    fetchProductsByTag,
    fetchCollections,
    fetchCollectionDetail,
    fetchCollectionDetailById,
    placeOrder,
    // Sitemap
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
