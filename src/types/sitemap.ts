export interface SitemapBlogItem {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapPageItem {
  url: string;
  title: string;
}

export interface SitemapProductItem {
  slug: string;
  image: string | null;
  name: string;
}

export interface SitemapCollectionItem {
  slug: string;
  image: string | null;
  name: string;
}
