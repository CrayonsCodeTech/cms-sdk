interface SitemapBase {
  updatedAt: string;
}

export interface SitemapBlogItem extends SitemapBase {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapPageItem extends SitemapBase {
  url: string;
  title: string;
}

// `products` and `collections` predate the `title` convention and still
// return `name`; renaming them would break existing SDK consumers.
export interface SitemapProductItem extends SitemapBase {
  slug: string;
  image: string | null;
  name: string;
}

export interface SitemapCollectionItem extends SitemapBase {
  slug: string;
  image: string | null;
  name: string;
}

export interface SitemapServiceItem extends SitemapBase {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapEventItem extends SitemapBase {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapAlbumItem extends SitemapBase {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapTeamMemberItem extends SitemapBase {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapTeamCategoryItem extends SitemapBase {
  slug: string;
  title: string;
}

export interface SitemapBrandGroupItem extends SitemapBase {
  slug: string;
  title: string;
}

export interface SitemapProductCategoryItem extends SitemapBase {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapProductBrandItem extends SitemapBase {
  slug: string;
  image: string | null;
  title: string;
}

export interface SitemapResourceMap {
  blogs: SitemapBlogItem;
  pages: SitemapPageItem;
  services: SitemapServiceItem;
  events: SitemapEventItem;
  albums: SitemapAlbumItem;
  "team-members": SitemapTeamMemberItem;
  "team-categories": SitemapTeamCategoryItem;
  "brand-groups": SitemapBrandGroupItem;
  products: SitemapProductItem;
  collections: SitemapCollectionItem;
  "product-categories": SitemapProductCategoryItem;
  "product-brands": SitemapProductBrandItem;
}

export type SitemapResource = keyof SitemapResourceMap;

export type SitemapItem<R extends SitemapResource = SitemapResource> =
  SitemapResourceMap[R];
