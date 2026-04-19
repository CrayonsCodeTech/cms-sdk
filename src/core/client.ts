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
import type { ContactPayload, Contact } from "../types/contact";
import type { Product, ProductListItem, ProductVariant } from "../types/product";
import type { ProductCategory } from "../types/product-category";
import type { ProductBrand } from "../types/product-brand";
import type { Collection } from "../types/collection";
import type { Order, PlaceOrderPayload } from "../types/order";

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
    params: Record<string, string | number | string[] | number[] | undefined>,
  ): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)));
        } else {
          query.append(key, String(value));
        }
      }
    });
    return query.toString();
  }

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
    options?: FetchOptions,
  ): Promise<Service[]> {
    const result = await cmsFetch<Service[]>(
      `/api/public/cms/${siteId}/services/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["services"],
        ...options,
      },
    );
    return result ?? [];
  }

  function fetchServiceById(
    siteId: string,
    id: string,
    options?: FetchOptions,
  ): Promise<Service | null> {
    return cmsFetch<Service>(`/api/public/cms/${siteId}/services/${id}/`, {
      revalidate: CACHE.SHORT,
      tags: ["services", `service-${id}`],
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

  async function fetchCategories(
    siteId: string,
    options?: FetchOptions,
  ): Promise<Category[]> {
    const result = await cmsFetch<Category[]>(
      `/api/public/cms/${siteId}/categories/`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["categories"],
        ...options,
      },
    );
    return result ?? [];
  }

  // ============================================================================
  // Team Members
  // ============================================================================

  async function fetchTeamMembers(
    siteId: string,
    options?: FetchOptions,
  ): Promise<TeamMember[]> {
    const result = await cmsFetch<TeamMember[]>(
      `/api/public/cms/${siteId}/team-members/`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["team"],
        ...options,
      },
    );
    return result ?? [];
  }

  async function fetchTeamMembersByCategory(
    siteId: string,
    categoryId: string,
    options?: FetchOptions,
  ): Promise<TeamMember[]> {
    const result = await cmsFetch<TeamMember[]>(
      `/api/public/cms/${siteId}/team-members/?category_id=${categoryId}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["team", `team-category-${categoryId}`],
        ...options,
      },
    );
    return result ?? [];
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

  async function fetchAlbumItems(
    siteId: string,
    params: { album?: string; album_id?: string },
    options?: FetchOptions,
  ): Promise<AlbumItem[]> {
    const query = buildQueryString(params);
    const result = await cmsFetch<AlbumItem[]>(
      `/api/public/cms/${siteId}/albums/album-items/?${query}`,
      {
        revalidate: CACHE.SHORT,
        tags: ["album-items"],
        ...options,
      },
    );
    return result ?? [];
  }

  // ============================================================================
  // Brands
  // ============================================================================

  async function fetchBrandGroups(
    siteId: string,
    options?: FetchOptions,
  ): Promise<BrandGroup[]> {
    const result = await cmsFetch<BrandGroup[]>(
      `/api/public/cms/${siteId}/brand-groups/`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["brand-groups"],
        ...options,
      },
    );
    return result ?? [];
  }

  async function fetchBrands(
    siteId: string,
    params: { group?: string; group_id?: string },
    options?: FetchOptions,
  ): Promise<Brand[]> {
    const query = buildQueryString(params);
    const result = await cmsFetch<Brand[]>(
      `/api/public/cms/${siteId}/brand-groups/brands/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["brands"],
        ...options,
      },
    );
    return result ?? [];
  }

  // ============================================================================
  // Testimonials
  // ============================================================================

  async function fetchTestimonials(
    siteId: string,
    params?: { type?: "testimonial" | "review" | string },
    options?: FetchOptions,
  ): Promise<Testimonial[]> {
    const query = params?.type ? buildQueryString({ type: params.type }) : "";
    const result = await cmsFetch<Testimonial[]>(
      `/api/public/cms/${siteId}/testimonials/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["testimonials"],
        ...options,
      },
    );
    return result ?? [];
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

  function fetchEventById(
    siteId: string,
    id: string,
    options?: FetchOptions,
  ): Promise<Event | null> {
    return cmsFetch<Event>(`/api/public/cms/${siteId}/events/${id}`, {
      revalidate: CACHE.SHORT,
      tags: ["events", `event-${id}`],
      ...options,
    });
  }

  // ============================================================================
  // FAQ Groups
  // ============================================================================

  async function fetchFaqGroups(
    siteId: string,
    options?: FetchOptions,
  ): Promise<FaqGroup[]> {
    const result = await cmsFetch<FaqGroup[]>(
      `/api/public/cms/${siteId}/faq-groups/`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["faq-groups"],
        ...options,
      },
    );
    return result ?? [];
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

  async function fetchFaqs(
    siteId: string,
    params?: { group_id?: string },
    options?: FetchOptions,
  ): Promise<Faq[]> {
    const query = params?.group_id
      ? buildQueryString({ group_id: params.group_id })
      : "";
    const result = await cmsFetch<Faq[]>(
      `/api/public/cms/${siteId}/faqs/?${query}`,
      {
        revalidate: CACHE.MEDIUM,
        tags: ["faqs"],
        ...options,
      },
    );
    return result ?? [];
  }

  // ============================================================================
  // Store — Products, Categories, Brands, Collections, Orders
  // Note: Uses /api/public/store/ prefix (NOT /api/public/cms/)
  // ============================================================================

  async function fetchProductCategories(
    siteId: string,
    options?: FetchOptions,
  ): Promise<ProductCategory[]> {
    const result = await cmsFetch<ProductCategory[]>(
      `/api/public/store/${siteId}/categories/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["product-categories"],
        ...options,
      },
    );
    return result ?? [];
  }

  async function fetchProductBrands(
    siteId: string,
    options?: FetchOptions,
  ): Promise<ProductBrand[]> {
    const result = await cmsFetch<ProductBrand[]>(
      `/api/public/store/${siteId}/brands/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["product-brands"],
        ...options,
      },
    );
    return result ?? [];
  }

  function fetchProducts(
    siteId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category_id?: string;
      brand_id?: string;
      is_featured?: "true" | "false";
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

  async function fetchCollections(
    siteId: string,
    options?: FetchOptions,
  ): Promise<Collection[]> {
    const result = await cmsFetch<Collection[]>(
      `/api/public/store/${siteId}/collections/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["collections"],
        ...options,
      },
    );
    return result ?? [];
  }

  function fetchCollectionDetail(
    siteId: string,
    slug: string,
    options?: FetchOptions,
  ): Promise<Collection | null> {
    return cmsFetch<Collection>(
      `/api/public/store/${siteId}/collections/${slug}/`,
      {
        revalidate: CACHE.SHORT,
        tags: ["collections", `collection-${slug}`],
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

  return {
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
    fetchServiceById,
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
    fetchEventById,
    // FAQ Groups
    fetchFaqGroups,
    fetchFaqs,
    // Contact
    submitContactForm,
    // Store
    fetchProductCategories,
    fetchProductBrands,
    fetchProducts,
    fetchProductDetail,
    fetchCollections,
    fetchCollectionDetail,
    placeOrder,
    // Generic fetch utilities
    fetch: cmsFetch,
    fetchPaginated: cmsFetchPaginated,
    utils: {
      buildQueryString,
    },
  };
}
