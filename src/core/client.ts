import { CACHE, PAGINATION } from "../constants";
import type { PaginatedResponse } from "../types/pagination";

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

  return {
    fetchHeader: (siteId: string, options?: FetchOptions) =>
      cmsFetch(`/api/public/cms/${siteId}/header/`, {
        revalidate: CACHE.MEDIUM,
        tags: ["header"],
        ...options,
      }),

    fetchFooter: (siteId: string, options?: FetchOptions) =>
      cmsFetch(`/api/public/cms/${siteId}/footer/`, {
        revalidate: CACHE.MEDIUM,
        tags: ["footer"],
        ...options,
      }),

    fetchSiteConfig: (siteId: string, options?: FetchOptions) =>
      cmsFetch(`/api/public/cms/${siteId}/site-config/`, {
        revalidate: CACHE.MEDIUM,
        tags: ["site-config"],
        ...options,
      }),

    fetchBlogs: (
      siteId: string,
      params: { page?: number; limit?: number; search?: string } = {},
      options?: FetchOptions,
    ) => {
      const query = buildQueryString(params);
      return cmsFetchPaginated(`/api/public/cms/${siteId}/blog/?${query}`, {
        revalidate: CACHE.SHORT,
        tags: ["blogs"],
        ...options,
      });
    },

    // Generic fetch for endpoints not yet explicitly mapped
    fetch: cmsFetch,
    fetchPaginated: cmsFetchPaginated,
    utils: {
      buildQueryString,
    },
  };
}
