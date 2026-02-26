import { CACHE, PAGINATION } from "../constants";
import type { PaginatedResponse } from "../types/pagination";
import type { Header } from "../types/header";
import type { Footer } from "../types/footer";
import type { SiteConfig } from "../types/site-config";
import type { Page } from "../types/page";
import type { AboutUsData } from "../types/about";
import type { Service } from "../types/service";
import type { Blog } from "../types/blog";
import type { Category } from "../types/category";
import type { TeamMember } from "../types/team-member";
import type { Album, AlbumItem } from "../types/album";
import type { BrandGroup, Brand } from "../types/brand";
import type { Testimonial } from "../types/testimonials";
import type { Event } from "../types/event";
import type { FaqGroup } from "../types/faq-group";

export interface FetchOptions extends RequestInit {
  revalidate?: number;
  tags?: string[];
}

export interface CmsClientConfig {
  baseUrl: string;
  defaultOptions?: FetchOptions;
}

export function createCmsClient(config: CmsClientConfig) {
  const { baseUrl, defaultOptions = {} } = config;

  async function cmsFetch<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<T | null> {
    const url = `${baseUrl}${endpoint}`;
    const {
      revalidate = CACHE.NO_CACHE,
      tags,
      ...rest
    } = { ...defaultOptions, ...options };

    // Next.js specific fetch options are passed through 'next' property
    const fetchConfig: RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    } = {
      ...rest,
      next: {
        revalidate,
        ...(tags && { tags }),
      },
    };

    try {
      const response = await fetch(url, fetchConfig);

      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${url}`);
        return null;
      }

      const result = await response.json();
      return result.data ?? result;
    } catch (error) {
      console.error(`API request error: ${url}`, error);
      return null;
    }
  }

  async function cmsFetchPaginated<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<PaginatedResponse<T>> {
    const emptyResponse: PaginatedResponse<T> = {
      data: [],
      pagination: {
        page: 1,
        limit: PAGINATION.DEFAULT_LIMIT,
        total: 0,
        totalPages: 0,
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

    try {
      const response = await fetch(url, fetchConfig);

      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${url}`);
        return emptyResponse;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error: ${url}`, error);
      return emptyResponse;
    }
  }

  function buildQueryString(
    params: Record<string, string | number | undefined>,
  ): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
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

  async function fetchPages(
    siteId: string,
    options?: FetchOptions,
  ): Promise<Page[]> {
    const result = await cmsFetch<Page[]>(`/api/public/cms/${siteId}/page/`, {
      revalidate: CACHE.SHORT,
      tags: ["pages"],
      ...options,
    });
    return result ?? [];
  }

  async function fetchPageByUrl(
    siteId: string,
    urlPath: string,
    options?: FetchOptions,
  ): Promise<Page | null> {
    try {
      const pages = await fetchPages(siteId, options);
      if (!pages || !Array.isArray(pages)) return null;

      return (
        pages.find((p) => {
          const normalizedPageUrl =
            p.url === "/" ? "/" : `/${p.url.replace(/^\/|\/$/g, "")}`;
          const targetUrl =
            urlPath === "/" || urlPath === ""
              ? "/"
              : `/${urlPath.replace(/^\/|\/$/g, "")}`;
          return normalizedPageUrl === targetUrl;
        }) ?? null
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

  function fetchBlogById(
    siteId: string,
    id: number,
    options?: FetchOptions,
  ): Promise<Blog | null> {
    return cmsFetch<Blog>(`/api/public/cms/${siteId}/blog/${id}/`, {
      revalidate: CACHE.SHORT,
      tags: ["blogs", `blog-${id}`],
      ...options,
    });
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
    // Generic fetch utilities
    fetch: cmsFetch,
    fetchPaginated: cmsFetchPaginated,
    utils: {
      buildQueryString,
    },
  };
}
