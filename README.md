# @crayonscodetech/cms-sdk

A robust, type-safe SDK/Package for fetching data from the Crayons CMS. Designed for Next.js.

## Technical Overview

Data is fetched from the CMS backend at: <https://api.cms.deployown.com>

Content updates and management are handled through the CMS dashboard:  
[https://cms.deployown.com](https://cms.deployown.com)

### How it Works

- **Headless CMS:** This package is purely for data fetching. It provides the raw content (JSON) without any UI or layout constraints.
- **Conditional Rendering:** You should fetch the data and use conditional logic to render your components based on the content received.
- **Full Style Control:** The backend does not provide CSS or styling. You have total creative freedom to define your own styles and themes within your frontend application.

## Features

- 🛠 **Type-safe**: Complete TypeScript definitions for all CMS entities.
- ⚡️ **Next.js Optimized**: Seamless integration with Next.js `fetch` (caching, revalidation, tags).
- 🔄 **Resilient**: Automatic retries for transient server errors (502, 503, 504).
- 🧱 **Structured**: Easy-to-use API for Headers, Footers, Blogs, Events, and more.
- 🎨 **Section Variants**: All page sections support optional `variant` field (e.g., "home-1", "about-2") for flexible conditional styling.

## Installation

The SDK is published to npm as `@crayonscodetech/cms-sdk`.

```bash
npm install @crayonscodetech/cms-sdk
# or
pnpm add @crayonscodetech/cms-sdk
# or
bun add @crayonscodetech/cms-sdk
```

Installing from the private GitHub repository also works if you have access, but it builds the package on install:

```bash
pnpm add git+ssh://git@github.com/CrayonsCodeTech/cms-sdk.git --allow-build=@crayonscodetech/cms-sdk
```

## Quick Start: Creating a New Next.js App (Cloudflare)

If you are starting a new project, we recommend using the Cloudflare Next.js starter which comes with **OpenNext** support out of the box.

Run the following command to initialize your app:

```bash
npm create cloudflare@latest -- my-next-app --framework=next
```

For detailed instructions on deploying Next.js to Cloudflare Workers, refer to the [official Cloudflare documentation](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).

---

## Getting Started

### 1. Environment Variables

Create a `.env.local` file in your root directory with the following variables:

```bash
NEXT_PUBLIC_CMS_BASE_URL=https://api.yourcms.com
NEXT_PUBLIC_CMS_SITE_ID=your-site-id-here
```

> **Development Environment**
>
> Visit [cms.deployown.com/login](https://cms.deployown.com/login) to view and edit data for the website.
>
> Use the following credentials to log in:
>
> | Field    | Value                 |
> | -------- | --------------------- |
> | Username | `development`         |
> | Password | _(provided by admin)_ |
>
> Add these to your `.env.local`:
>
> ```bash
> NEXT_PUBLIC_CMS_BASE_URL=https://api.cms.deployown.com
> NEXT_PUBLIC_CMS_SITE_ID=30de3c6b-70bd-45dd-a0bd-58143f738902
> ```

### 2. Initialization

It is recommended to create a singleton instance of the CMS client in your project (e.g., `lib/cms.ts`).

```typescript
import { CmsError, createCmsClient } from "@crayonscodetech/cms-sdk";
import type { PaginatedResponse } from "@crayonscodetech/cms-sdk";

export const cms = createCmsClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL || "https://api.example.com",
  defaultOptions: {
    revalidate: 3600, // Default 1 hour cache
  },
});

export const SITE_ID = process.env.NEXT_PUBLIC_CMS_SITE_ID || "";

/**
 * Read methods throw a `CmsError` for any non-2xx response, a 404 included.
 * Wrap a read in `orNull()` when "not there" is a normal outcome: 404 (missing)
 * and 403 (a feature such as the store or redirects is switched off for the
 * site) resolve to `null`. Every other error still throws.
 */
export async function orNull<T>(request: Promise<T | null>): Promise<T | null> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof CmsError && (error.status === 404 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

/**
 * Pages through a list method until an item matches. Use it where the API has
 * no by-slug lookup (albums, product categories, product brands); public list
 * endpoints return at most 20–40 items per page, so a single page can miss it.
 */
export async function findInPages<T>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
  match: (item: T) => boolean,
): Promise<T | null> {
  for (let page = 1; ; page++) {
    const { data, pagination } = await fetchPage(page);
    const hit = data.find(match);
    if (hit) return hit;
    if (data.length === 0 || page * pagination.limit >= pagination.total) return null;
  }
}
```

### 3. Usage in Components

#### Conditional Rendering — Header & Footer Inner Data

`fetchHeader` and `fetchFooter` throw a `CmsError` when the request fails, including a 404 when the site has none yet. Fetch them as `orNull(cms.fetchHeader(SITE_ID))` (see [Initialization](#2-initialization)) so a missing header or footer is `null` instead of an error page, and render nothing in that case. Inside your components, guard each field individually since arrays may be empty and optional fields may be absent.

**SiteHeader example:**

```tsx
// components/site-header.tsx
import type { Header, SiteConfig } from "@crayonscodetech/cms-sdk";
import Link from "next/link";

interface Props {
  header: Header;
  siteConfig: SiteConfig | null;
}

export function SiteHeader({ header, siteConfig }: Props) {
  return (
    <nav>
      {/* Logo — use logo.logo_primary (light) or logo.logo_dark as needed */}
      {siteConfig?.logo.logo_primary && (
        <Link href="/">
          <img
            src={siteConfig.logo.logo_primary}
            alt={siteConfig.site_name ?? "Logo"}
          />
        </Link>
      )}

      {/* Nav links — each link may have nested children */}
      {header.nav_links.length > 0 && (
        <ul>
          {header.nav_links.map((link) => (
            <li key={link.url}>
              <Link href={link.url}>{link.title}</Link>

              {/* Dropdown children — only render if they exist */}
              {link.children && link.children.length > 0 && (
                <ul>
                  {link.children.map((child) => (
                    <li key={child.url}>
                      <Link href={child.url}>{child.title}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* CTAs — map through the array, skip if empty */}
      {header.ctas.length > 0 && (
        <div>
          {header.ctas.map((cta) => (
            <Link key={cta.title_url} href={cta.title_url}>
              {cta.title}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
```

**SiteFooter example:**

```tsx
// components/site-footer.tsx
import type { Footer } from "@crayonscodetech/cms-sdk";
import Link from "next/link";

export function SiteFooter({ footer }: { footer: Footer }) {
  return (
    <footer>
      {/* Nav groups — each group has a name and a list of links */}
      {footer.nav_groups.length > 0 && (
        <div>
          {footer.nav_groups.map((group) => (
            <div key={group.name}>
              <h4>{group.name}</h4>

              {group.links.length > 0 && (
                <ul>
                  {group.links.map((link) => (
                    <li key={link.url}>
                      <Link href={link.url}>{link.title}</Link>

                      {/* Nested children under each footer link */}
                      {link.children && link.children.length > 0 && (
                        <ul>
                          {link.children.map((child) => (
                            <li key={child.url}>
                              <Link href={child.url}>{child.title}</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </footer>
  );
}
```

**Using `SiteConfig` contact & social data in the footer:**

`SiteConfig` also carries the site's contact details and social links — render these directly in the footer rather than hardcoding them.

```tsx
// Destructure the fields you need from siteConfig
const { site_name, logo, contact } = siteConfig;

// Phone numbers (array)
{
  contact.phone_number.map((phone) => (
    <a key={phone} href={`tel:${phone}`}>
      {phone}
    </a>
  ));
}

// Emails (array)
{
  contact.email.map((email) => (
    <a key={email} href={`mailto:${email}`}>
      {email}
    </a>
  ));
}

// Social links
{
  contact.socials.map((social) => (
    <a
      key={social.site_name}
      href={social.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      {social.site_name}
    </a>
  ));
}

// Location (optional)
{
  contact.location?.location.map((line) => <p key={line}>{line}</p>);
}
{
  contact.location?.google_maps_url && (
    <a
      href={contact.location.google_maps_url}
      target="_blank"
      rel="noopener noreferrer"
    >
      View on Map
    </a>
  );
}
```

> Fetch it as `orNull(cms.fetchSiteConfig(SITE_ID))`: `fetchSiteConfig` throws a `CmsError` if the request fails, and `orNull` turns a missing config into `null`. Guard it at the layout level and pass it down only if it exists.

#### 4. Icons

CMS fields that hold an icon store an icon **name** such as `"Mail"` or `"Calendar"`. The SDK exports the list of names the CMS offers as `ICON_NAMES` and its type as `IconName`; it does not ship an icon component or depend on React. Render the name with your own icon library. With `lucide-react`, whose component names match:

```tsx
// components/cms-icon.tsx
import { icons, HelpCircle, type LucideProps } from "lucide-react";
import type { IconName } from "@crayonscodetech/cms-sdk";

export function CmsIcon({ name, ...props }: { name: IconName | string } & LucideProps) {
  const Icon = icons[name as keyof typeof icons] ?? HelpCircle;
  return <Icon {...props} />;
}
```

```tsx
<CmsIcon name={item.icon} size={24} className="text-primary" />
```

> The CMS can return a name your library doesn't have, so always keep a fallback icon.

---

#### Advanced UI Implementation (Recommended)

For production-grade applications, we recommend a declarative approach using a **Registry** and **Router**. This pattern removes the need for hardcoded folders (like `/blog` or `/services`) and handles all CMS-driven URLs dynamically.

##### 1. Declarative Page Registry

Map CMS `page_type` strings to their corresponding React components. This centralizes your UI mapping.

```tsx
// lib/cms-registry.ts
import HomePage from "@/components/pages/HomePage";
import AboutPage from "@/components/pages/AboutPage";
import BlogsPage from "@/components/pages/BlogPage";
import ServicesPage from "@/components/pages/ServicesPage";
import EventsPage from "@/components/pages/EventPage";
import GalleryPage from "@/components/pages/GalleryPage";
import TeamPage from "@/components/pages/TeamPage";
import ContactPage from "@/components/pages/ContactPage";
import CustomPage from "@/components/pages/CustomPage";
import ProductsPage from "@/components/pages/ProductsPage";

// Detail views (sub-pages)
import BlogDetailPage from "@/components/pages/BlogDetailPage";
import ServiceDetailPage from "@/components/pages/ServiceDetailPage";
import EventDetailPage from "@/components/pages/EventDetailPage";
import GalleryDetailPage from "@/components/pages/GalleryDetailPage";
import TeamMemberDetailPage from "@/components/pages/TeamMemberDetailPage";
import TeamCategoryPage from "@/components/pages/TeamCategoryPage";
import ProductDetailPage from "@/components/pages/ProductDetailPage";

export const PAGE_COMPONENT_MAP: Record<string, any> = {
  home: HomePage,
  about: AboutPage,
  blog: BlogsPage,
  services: ServicesPage,
  events: EventsPage,
  gallery: GalleryPage,
  team: TeamPage,
  contact: ContactPage,
  custom: CustomPage,
  products: ProductsPage,
};

// Maps parent page type to its detail component
export const DETAIL_COMPONENT_MAP: Record<string, any> = {
  blog: BlogDetailPage,
  services: ServiceDetailPage,
  events: EventDetailPage,
  gallery: GalleryDetailPage,
  products: ProductDetailPage,
  team: {
    member: TeamMemberDetailPage,
    category: TeamCategoryPage,
  },
};
```

##### 2. Route Resolution Helper

This utility determines if a URL path is an exact CMS page or a "Detail" page (e.g., a specific blog post).

```tsx
// lib/cms-router.ts
import { cms, orNull, SITE_ID } from "./cms";

export async function resolveCmsRoute(slug: string[]) {
  const urlPath = slug.length > 0 ? `/${slug.join("/")}` : "/";
  // fetchPageByUrl throws on 404; orNull turns "no such page" into null so the
  // detail-page fallback below can run.
  const exactPage = await orNull(cms.fetchPageByUrl(SITE_ID, urlPath));

  if (exactPage) return { type: "page" as const, data: exactPage };

  // 2. Check for detail page (walking up the path)
  // Example: /blog/my-post or /news/my-post
  if (slug.length > 0) {
    for (let i = slug.length - 1; i >= 0; i--) {
      const parentPath = "/" + slug.slice(0, i).join("/");
      const parentPage = await orNull(cms.fetchPageByUrl(SITE_ID, parentPath || "/"));

      if (parentPage) {
        return {
          type: "detail" as const,
          parentType: parentPage.page_type,
          slug: slug.slice(i), // e.g., ["my-post-slug"]
          parentUrl: parentPage.url,
        };
      }
    }
  }

  return null;
}
```

##### 3. Unified Catch-All Route

Using the registry and router, your `app/[[...slug]]/page.tsx` handles every route dynamically.

```tsx
// app/[[...slug]]/page.tsx
import { notFound } from "next/navigation";
import { resolveCmsRoute } from "@/lib/cms-router";
import { PAGE_COMPONENT_MAP, DETAIL_COMPONENT_MAP } from "@/lib/cms-registry";

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;
  const resolution = await resolveCmsRoute(slug);

  if (!resolution) notFound();

  if (resolution.type === "page") {
    const Component =
      PAGE_COMPONENT_MAP[resolution.data.page_type] ||
      PAGE_COMPONENT_MAP.custom;
    return <Component page={resolution.data} />;
  }

  if (resolution.type === "detail") {
    const Component = DETAIL_COMPONENT_MAP[resolution.parentType];
    if (!Component) notFound();

    // Special handling for nested detail types (like Team)
    if (resolution.parentType === "team") {
      if (resolution.slug.length === 1) {
        return (
          <Component.category
            params={Promise.resolve({ category: resolution.slug[0] })}
          />
        );
      }
      return (
        <Component.member
          params={Promise.resolve({
            category: resolution.slug[0],
            slug: resolution.slug[1],
          })}
        />
      );
    }

    return (
      <Component
        params={Promise.resolve({ slug: resolution.slug[0] })}
        parentUrl={resolution.parentUrl}
      />
    );
  }

  notFound();
}
```

#### Dynamic Page Sections — `RenderSections` Component

The `RenderSections` component is the core rendering primitive. It receives `page.sections` and maps each section type to its component. Every known section type from the CMS is handled; unknown types are warned and skipped.

> **Important:** All section types include an optional `variant` field (e.g., `"home-1"`, `"about-1"`, `"contact-2"`). Use this for conditional rendering to create different visual styles of the same section type. See the example below for how to handle variants.

```tsx
// components/render-sections.tsx
import type { Section } from "@crayonscodetech/cms-sdk";

// Import base section components
import { HeroSection } from "@/components/sections/hero";
import { CustomSection } from "@/components/sections/custom";
import { CtaSection } from "@/components/sections/cta";
import { ServiceSection } from "@/components/sections/service";
import { TestimonialSection } from "@/components/sections/testimonial";
import { MultiValueSection } from "@/components/sections/multi-value";
import { TeamSection } from "@/components/sections/team";
import { ClientsSection } from "@/components/sections/clients";
import { GallerySection } from "@/components/sections/gallery";
import { EventSection } from "@/components/sections/event";
import { BlogSection } from "@/components/sections/blog";
import { RichContentSection } from "@/components/sections/rich-content";
import { AboutSection } from "@/components/sections/about";
import { FaqSection } from "@/components/sections/faq";
import { MarqueeSection } from "@/components/sections/marquee";
import { HistorySection } from "@/components/sections/history";
import { ProductsSection } from "@/components/sections/products";
import { CollectionGroupSection } from "@/components/sections/collection-group";

// Import variant components as needed (example imports)
import { HeroDark } from "@/components/sections/hero-dark";
import { HeroCentered } from "@/components/sections/hero-centered";
import { CtaPrimary } from "@/components/sections/cta-primary";

export function RenderSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => {
        // Each section has: { id, type, variant?, content }
        // - id: auto-generated identifier (e.g., "hero-1", "custom-2", "cta-3")
        // - type: section type discriminator (e.g., "hero", "custom", "cta")
        // - variant: optional style variant (e.g., "home-1", "home-2", "about-1")
        // - content: the actual content data for that section
        //
        // Example section object:
        // { id: "hero-1", type: "hero", variant: "home-1", content: [...] }
        switch (section.type) {
          case "hero":
            // Variant-aware rendering: check section.variant for conditional styling
            if (section.variant === "home-1") {
              return <HeroDark key={section.id} content={section.content} />;
            }
            if (section.variant === "home-2") {
              return (
                <HeroCentered key={section.id} content={section.content} />
              );
            }
            // Default fallback when variant is undefined/null
            return <HeroSection key={section.id} content={section.content} />;

          case "custom":
            return <CustomSection key={section.id} content={section.content} />;

          case "cta":
            // Example: different CTA styles based on variant
            if (section.variant === "home-1") {
              return <CtaPrimary key={section.id} content={section.content} />;
            }
            return <CtaSection key={section.id} content={section.content} />;

          case "service":
            return (
              <ServiceSection key={section.id} content={section.content} />
            );

          case "testimonial":
            return (
              <TestimonialSection key={section.id} content={section.content} />
            );

          case "multi-value":
            return (
              <MultiValueSection key={section.id} content={section.content} />
            );

          case "team":
            return <TeamSection key={section.id} content={section.content} />;

          case "clients":
            return (
              <ClientsSection key={section.id} content={section.content} />
            );

          case "gallery":
            return (
              <GallerySection key={section.id} content={section.content} />
            );

          case "event":
            return <EventSection key={section.id} content={section.content} />;

          case "blog":
            return <BlogSection key={section.id} content={section.content} />;

          case "rich-content":
            return (
              <RichContentSection key={section.id} content={section.content} />
            );

          case "about":
            return <AboutSection key={section.id} content={section.content} />;

          case "faq":
            return <FaqSection key={section.id} content={section.content} />;

          case "marquee":
            return (
              <MarqueeSection key={section.id} content={section.content} />
            );

          case "history":
            return (
              <HistorySection key={section.id} content={section.content} />
            );

          case "products":
            return (
              <ProductsSection key={section.id} content={section.content} />
            );

          case "collection-group":
            return (
              <CollectionGroupSection
                key={section.id}
                content={section.content}
              />
            );

          default:
            console.warn(`Unknown section type: ${(section as any).type}`);
            return null;
        }
      })}
    </>
  );
}
```

> **Note:** Each section includes:
>
> - **`id`**: Auto-generated unique identifier in format `{type}-{count}` (e.g., `"hero-1"`, `"hero-2"`, `"custom-1"`, `"cta-3"`). Useful for targeting specific sections or debugging.
> - **`variant`**: Optional style variant (e.g., `"home-1"`, `"home-2"`, `"about-1"`) for conditional styling.
>
> Always provide a default fallback when `section.variant` is undefined or null. If your design doesn't use variants, you can simplify the switch cases to just render single components per type. Use `section.id` when you need to target or reference specific sections programmatically.

#### Data-Driven Section Components

Several section types only carry **display text** (headings, subtitles) in `section.content`. The actual entity data must be fetched separately and passed into the section component. This is the same pattern as services, blogs, and events — just applied inside individual section components.

| Section name     | `type` discriminant  | Content type             | Primary table/entity          | API call(s) needed                                                                          |
| ---------------- | -------------------- | ------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Hero             | `"hero"`             | `HeroContent[]`          | `page.sections` (from `page`) | None — content is inline                                                                    |
| Custom           | `"custom"`           | `CustomContent`          | `page.sections` (from `page`) | None — content is inline                                                                    |
| Call to Action   | `"cta"`              | `CTAContent`             | `page.sections` (from `page`) | None — content is inline                                                                    |
| Rich Content     | `"rich-content"`     | `RichContentSection`     | `page.sections` (from `page`) | None — content is inline                                                                    |
| About            | `"about"`            | `AboutSection`           | `page.sections` + `about-us`  | `fetchAboutUs(siteId)` for profile/vision/mission/stats                                     |
| Multi Value      | `"multi-value"`      | `MultiValueSection`      | `page.sections` (from `page`) | None — content is inline                                                                    |
| Services         | `"service"`          | `ServicesSection`        | `services`                    | `fetchServices(siteId)`                                                                     |
| Testimonials     | `"testimonial"`      | `TestimonialsSection`    | `testimonials`                | `fetchTestimonials(siteId, { type })` — use `content.type` to filter                                                      |
| Team             | `"team"`             | `TeamSection`            | `team-members`                | `fetchTeamMembers(siteId)` / `fetchTeamMembersByCategory(siteId, { categoryId: content.team_category_id })`               |
| FAQ              | `"faq"`              | `FaqSection`             | `faq-groups` + `faqs`         | `fetchFaqGroups(siteId)` or `fetchFaqs(siteId, { group_id: content.group_id })`                                           |
| Clients / Brands | `"clients"`          | `ClientsSection`         | `brand-groups` + `brands`     | `fetchBrandGroups(siteId)` + `fetchBrands(siteId, { group_id: content.brand_group_id })`                                  |
| Gallery          | `"gallery"`          | `GallerySection`         | `albums` + `album-items`      | `fetchAlbums(siteId)` + `fetchAlbumItems(siteId, { album_id })` as needed                   |
| Events           | `"event"`            | `GenericSection`         | `events`                      | `fetchEvents(siteId, { page, limit, search })`                                              |
| Blog             | `"blog"`             | `GenericSection`         | `blog`                        | `fetchBlogs(siteId, { page, limit, search })`                                               |
| Products         | `"products"`         | `ProductsSection`        | `products` / `collections`    | `fetchProducts(...)` or `fetchCollectionDetailById(...)`, depending on `content.filter`     |
| Collection Group | `"collection-group"` | `CollectionGroupSection` | `collections`                 | `fetchCollections(siteId, { id: content.collection_groups.join(',') })`                     |
| Marquee          | `"marquee"`          | `MarqueeSection`         | `page.sections` (from `page`) | None — content is inline                                                                    |
| History          | `"history"`          | `HistorySection`         | `page.sections` (from `page`) | None — content is inline                                                                    |

**How to handle this in section components:**

Each section component receives its own `content` prop from `RenderSections`. When it needs live entity data, it fetches it itself using the ID or type from `content`.

For the new store-aware sections:

- `products` content uses `filter` plus one of `collection_id`, `category_id`, or `tag_id`, along with `limit`
- `collection-group` content uses `collection_groups: string[]`

```tsx
// components/sections/testimonial.tsx
import { cms, SITE_ID } from "@/lib/cms";
import type { TestimonialsSection } from "@crayonscodetech/cms-sdk";

interface Props {
  content: TestimonialsSection;
}

export async function TestimonialSection({ content }: Props) {
  // content.type is "testimonial" | "review" — use it to filter
  const { data: testimonials } = await cms.fetchTestimonials(SITE_ID, {
    type: content.type as "testimonial" | "review",
  });

  return (
    <section>
      <h2>{content.title}</h2>
      {content.subtitle && <p>{content.subtitle}</p>}

      {testimonials.map((t) => (
        <blockquote key={t.id}>
          {t.image_url && <img src={t.image_url} alt={t.image_alt ?? t.name} />}
          <p>{t.quote}</p>
          <cite>
            {t.name}
            {t.position && `, ${t.position}`}
            {t.company && ` — ${t.company}`}
          </cite>
        </blockquote>
      ))}
    </section>
  );
}
```

```tsx
// components/sections/team.tsx
import { cms, SITE_ID } from "@/lib/cms";
import type { TeamSection } from "@crayonscodetech/cms-sdk";

export async function TeamSection({ content }: { content: TeamSection }) {
  const { data: members } = await cms.fetchTeamMembers(SITE_ID);

  return (
    <section>
      <h2>{content.title}</h2>
      {content.subtitle && <p>{content.subtitle}</p>}

      <div className="grid">
        {members.map((member) => (
          <div key={member.id}>
            {member.profile_image && (
              <img src={member.profile_image} alt={member.name} />
            )}
            <h3>{member.name}</h3>
            {member.position && <p>{member.position}</p>}
            {member.socials && member.socials.length > 0 && (
              <ul>
                {member.socials.map(
                  (s) =>
                    s.url && (
                      <li key={s.platform}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {s.platform}
                        </a>
                      </li>
                    ),
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

```tsx
// components/sections/faq.tsx
import { cms, SITE_ID } from "@/lib/cms";
import type { FaqSection } from "@crayonscodetech/cms-sdk";

export async function FaqSection({ content }: { content: FaqSection }) {
  // Fetch the specific group if a group_id is set, otherwise fetch all
  const { data: groups } = await cms.fetchFaqGroups(SITE_ID);

  const targetGroup = content.group_id
    ? groups.find((g) => g.id === content.group_id)
    : null;

  const faqs = targetGroup
    ? targetGroup.faqs
    : (await cms.fetchFaqs(SITE_ID)).data;

  return (
    <section>
      <h2>{content.title}</h2>
      {content.subtitle && <p>{content.subtitle}</p>}

      <dl>
        {faqs.map((faq) => (
          <div key={faq.id}>
            <dt>{faq.question}</dt>
            <dd>{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

> Section components that fetch their own data must be **async server components**. This works because `RenderSections` itself is also a server component — you can `await` inside any section component freely.

---

## Page Architecture

Different page types follow different rendering strategies. Understanding these patterns is key to building correctly.

### Page Fetch Map (Route -> Table/Entity -> SDK Fetch)

| Route                   | Primary tables/entities           | Required fetch call(s)                                                                          |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/` (home)              | `page` (+ inline `page.sections`) | `fetchPageByUrl(siteId, "/")`                                                                   |
| `[[...slug]]` CMS pages | `page` (+ inline `page.sections`) | `fetchPageByUrl(siteId, urlPath)`                                                               |
| `/about`                | `page` + `about-us`               | `fetchPageByUrl(siteId, "/about")` + `fetchAboutUs(siteId)`                                     |
| `/services`             | `page` + `services`               | `fetchPageByUrl(siteId, "/services")` + `fetchServices(siteId)`                                 |
| `/services/[slug]`      | `services`                        | `fetchServiceBySlug(siteId, slug)`                                                              |
| `/blog` or `/news`      | `page` + `blog`                   | `fetchPageByUrl(siteId, "/blog")` (or your CMS-defined base url) + `fetchBlogs(siteId, params)` |
| `/blog/[slug]`          | `blog`                            | `fetchBlogBySlug(siteId, slug)`                                                                 |
| `/events`               | `page` + `events`                 | `fetchPageByUrl(siteId, "/events")` + `fetchEvents(siteId, params)`                             |
| `/events/[slug]`        | `events`                          | `fetchEventBySlug(siteId, slug)`                                                                |
| `/gallery`              | `page` + `albums`                 | `fetchPageByUrl(siteId, "/gallery")` + `fetchAlbums(siteId, params)`                            |
| `/gallery/[slug]`       | `albums` + `album-items`          | `fetchAlbums(siteId, { limit })` + `fetchAlbumItems(siteId, { album: slug })`                   |
| `/team/[slug]`          | `team-members`                    | `fetchTeamMembers(siteId)` (slug lookup) or custom `fetch`                                      |
| `/contact`              | `contact` (form submissions)      | `fetchContactConfig(siteId)` + `submitContactForm(siteId, payload, attachments?)`               |

### Home Page — Section Rendering with Targeting

The home page is a CMS-managed page (`page_type: "home"`). It uses `RenderSections` to render its sections in order. However, because the home page often needs precise control over layout (e.g. placing a specific section above the fold, or inserting non-CMS UI between sections), you can target sections by **type + index** or by **section id** instead of blindly rendering all sections in sequence.

**Option A — target by section type and index:**

```tsx
// components/pages/HomePage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { HeroSection } from "@/components/sections/hero";
import { RenderSections } from "@/components/render-sections";
import type { Page } from "@crayonscodetech/cms-sdk";

export default async function HomePage({ page }: { page: Page }) {
  const { sections } = page;

  // Pull specific sections out by type for precise placement
  const heroSections = sections.filter((s) => s.type === "hero");
  const remainingSections = sections.filter((s) => s.type !== "hero");

  return (
    <>
      {/* Render the first hero section at the top of the page */}
      {heroSections[0] && <HeroSection content={heroSections[0].content} />}

      {/* Your own custom UI can go here between sections */}

      {/* Render the rest of the sections in CMS order */}
      <RenderSections sections={remainingSections} />
    </>
  );
}
```

**Option B — target by section id:**

```tsx
// Pull a specific section by its id (visible in the CMS dashboard)
const featuredSection = sections.find((s) => s.id === "your-section-id");
const otherSections = sections.filter((s) => s.id !== "your-section-id");
```

> For most home pages, just rendering all sections with `<RenderSections sections={page.sections} />` in CMS order is the simplest and correct approach. Only reach for targeting when the design requires it.

---

### Custom Pages — Render Sections in Order

Pages with `page_type: "custom"` (e.g. About, Pricing, any landing page) are fully CMS-driven. Render their sections exactly as they come — no targeting or special logic needed.

```tsx
// This is handled automatically by the [[...slug]] catch-all route.
// The page component just passes sections straight through:
return <RenderSections sections={page.sections} />;
```

The CMS editor controls the order and content of all sections. Your job is to make sure every section type is handled in `RenderSections`.

---

### About Us Page — Page Sections + About Data

About pages usually combine:

- **Page-managed section chrome** (`section_heading`, `title`, CTA labels) from `fetchPageByUrl("/about")`
- **Actual about content** (company profile, vision, mission, stats, values) from `fetchAboutUs`

```tsx
// components/pages/AboutPage.tsx
import { cms, orNull, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import SafeHtml from "@/components/safe-html"; // defined under "Rich Text / HTML Fields"
import type { Page, SiteConfig } from "@crayonscodetech/cms-sdk";

export default async function AboutPage({
  page,
  site,
}: {
  page: Page;
  site?: SiteConfig | null;
}) {
  const about = await orNull(cms.fetchAboutUs(SITE_ID));
  if (!about) notFound();

  const aboutSection = page.sections.find((s) => s.type === "about");

  return (
    <main>
      {aboutSection && (
        <header>
          <p>{aboutSection.content.section_heading}</p>
          <h1>{aboutSection.content.title}</h1>
        </header>
      )}

      <section>
        <h2>Company Profile</h2>
        <SafeHtml html={about.company_profile} />
      </section>

      <section>
        <h2>Vision</h2>
        <SafeHtml html={about.vision} />
      </section>

      <section>
        <h2>Mission</h2>
        <SafeHtml html={about.mission} />
      </section>

      {about.values.length > 0 && (
        <section>
          <h2>Core Values</h2>
          <ul>
            {about.values.map((value) => (
              <li key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
```

---

### Services Page — Fetch & Render Service Data

The `service` section type on a page provides only CMS-controlled **headings and labels** (e.g. `section_heading`, `title`, `subtitle`). The actual list of services must be fetched separately with `fetchServices`.

```tsx
// components/pages/ServicesPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { ServiceCard } from "@/components/service-card";
import type { Page } from "@crayonscodetech/cms-sdk";

export default async function ServicesPage({ page }: { page: Page }) {
  // fetchServices is paginated: the list is in `.data`
  const { data: services } = await cms.fetchServices(SITE_ID);

  // The "service" section from the page carries the heading/subtitle
  const serviceSection = page.sections.find((s) => s.type === "service");

  return (
    <>
      {serviceSection && (
        <header>
          <h1>{serviceSection.content.title}</h1>
          {serviceSection.content.subtitle && (
            <p>{serviceSection.content.subtitle}</p>
          )}
        </header>
      )}

      <div className="grid">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </>
  );
}
```

**Service detail page:**

```tsx
// components/pages/ServiceDetailPage.tsx
import { cms, orNull, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { RenderSections } from "@/components/render-sections";
import SafeHtml from "@/components/safe-html";

export default async function ServiceDetailPage({
  params,
  parentUrl,
}: {
  params: Promise<{ slug: string }>;
  parentUrl?: string;
}) {
  const { slug } = await params;
  const service = await orNull(cms.fetchServiceBySlug(SITE_ID, slug));

  if (!service) notFound();

  return (
    <article>
      {service.image_url && (
        <img src={service.image_url} alt={service.image_alt ?? service.title} />
      )}
      <h1>{service.title}</h1>
      {service.excerpt && <p>{service.excerpt}</p>}
      <SafeHtml html={service.description} />
      {service.features.length > 0 && (
        <ul>
          {service.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}

      {/* Render sections from extra.sections if present */}
      {service.extra?.sections && service.extra.sections.length > 0 && (
        <RenderSections sections={service.extra.sections} />
      )}
    </article>
  );
}
```

> **Note**: Services can have custom sections stored in `extra.sections`. Use `<RenderSections />` to render them on the detail page. This is optional — if no sections are defined, the service renders normally as shown above.

---

### Blog Page — Listing & Detail

The `blog` section type carries heading/subtitle text only. Fetch the actual posts with `fetchBlogs`.

**Listing page:**

```tsx
// components/pages/BlogPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Page } from "@crayonscodetech/cms-sdk";

export default async function BlogPage({ page }: { page: Page }) {
  const { data: blogs } = await cms.fetchBlogs(SITE_ID, { page: 1, limit: 12 });

  const blogSection = page.sections.find((s) => s.type === "blog");

  return (
    <>
      {blogSection && <h1>{blogSection.content.title}</h1>}

      <div className="grid">
        {blogs.map((blog) => (
          <Link key={blog.id} href={`/blog/${blog.slug}`}>
            {blog.image_url && (
              <img src={blog.image_url} alt={blog.image_alt ?? blog.title} />
            )}
            <h2>{blog.title}</h2>
            {blog.excerpt && <p>{blog.excerpt}</p>}
          </Link>
        ))}
      </div>
    </>
  );
}
```

**Search and category filtering:**

```tsx
// Search — pass the query as a param
const { data: results } = await cms.fetchBlogs(SITE_ID, {
  search: searchQuery,
});

// Category filtering — fetch categories then filter client-side, or show per-category pages
const { data: categories } = await cms.fetchCategories(SITE_ID);

// Blogs don't have a direct category_id param — fetch categories for display,
// then use them as navigation labels linking to filtered URLs
```

**Blog detail page:**

```tsx
// components/pages/BlogDetailPage.tsx
import { cms, orNull, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { RenderSections } from "@/components/render-sections";
import SafeHtml from "@/components/safe-html";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const full = await orNull(cms.fetchBlogBySlug(SITE_ID, slug));
  if (!full) notFound();

  return (
    <article>
      {full.image_url && (
        <img src={full.image_url} alt={full.image_alt ?? full.title} />
      )}
      <h1>{full.title}</h1>
      <p>By {full.author}</p>
      <SafeHtml html={full.description} />

      {/* Render sections from extra.sections if present */}
      {full.extra?.sections && full.extra.sections.length > 0 && (
        <RenderSections sections={full.extra.sections} />
      )}
    </article>
  );
}
```

> **Note**: Blogs can have custom sections stored in `extra.sections`. Use `<RenderSections />` to render them on the detail page. This is optional — if no sections are defined, the blog renders normally as shown above.

---

### Events Page — Listing & Detail

Same pattern as blogs. The `event` section carries display text; actual event data comes from `fetchEvents`.

**Listing page:**

```tsx
// components/pages/EventPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Page, SiteConfig } from "@crayonscodetech/cms-sdk";

export default async function EventsPage({
  page,
  site,
}: {
  page: Page;
  site?: SiteConfig | null;
}) {
  const { data: events } = await cms.fetchEvents(SITE_ID, {
    page: 1,
    limit: 12,
  });

  return (
    <div>
      {events.map((event) => (
        <Link key={event.id} href={`/events/${event.slug}`}>
          {event.image_url && (
            <img src={event.image_url} alt={event.image_alt ?? event.title} />
          )}
          <h2>{event.title}</h2>
          <time>{event.start_date}</time>
          {event.location_name && <p>{event.location_name}</p>}
          {event.excerpt && <p>{event.excerpt}</p>}
        </Link>
      ))}
    </div>
  );
}
```

**Event detail page:**

```tsx
// components/pages/EventDetailPage.tsx
import { cms, orNull, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { RenderSections } from "@/components/render-sections";
import SafeHtml from "@/components/safe-html";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await orNull(cms.fetchEventBySlug(SITE_ID, slug));

  if (!event) notFound();

  return (
    <article>
      {event.image_url && (
        <img src={event.image_url} alt={event.image_alt ?? event.title} />
      )}
      <h1>{event.title}</h1>
      <time>{event.start_date}</time>
      {event.end_date && <time> – {event.end_date}</time>}
      {event.location_name && <p>{event.location_name}</p>}
      {event.address && <address>{event.address}</address>}
      <SafeHtml html={event.description} />

      {/* Render sections from extra.sections if present */}
      {event.extra?.sections && event.extra.sections.length > 0 && (
        <RenderSections sections={event.extra.sections} />
      )}
    </article>
  );
}
```

> **Note**: Events can have custom sections stored in `extra.sections`. Use `<RenderSections />` to render them on the detail page. This is optional — if no sections are defined, the event renders normally as shown above.

---

### Gallery Page — Albums & Photos

The `gallery` section carries the `album_id` to display. Fetch albums with `fetchAlbums`; each album includes its `items` (photos).

```tsx
// components/pages/GalleryPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import Link from "next/link";
import SafeHtml from "@/components/safe-html";
import type { Page } from "@crayonscodetech/cms-sdk";

export default async function GalleryPage({ page }: { page: Page }) {
  const { data: albums } = await cms.fetchAlbums(SITE_ID);

  return (
    <div className="grid">
      {albums.map((album) => (
        <Link key={album.id} href={`/gallery/${album.slug}`}>
          {album.cover_image_url && (
            <img
              src={album.cover_image_url}
              alt={album.cover_image_alt ?? album.title}
            />
          )}
          <h2>{album.title}</h2>
          {/* description is rich-text HTML */}
          <SafeHtml html={album.description} />
        </Link>
      ))}
    </div>
  );
}
```

**Album detail page:**

There is no album-by-slug method, so page through `fetchAlbums` with `findInPages` (see [Initialization](#2-initialization)); a single page can miss albums beyond the first 20.

```tsx
// components/pages/GalleryDetailPage.tsx
import { cms, findInPages, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import SafeHtml from "@/components/safe-html";

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await findInPages(
    (page) => cms.fetchAlbums(SITE_ID, { page }),
    (a) => a.slug === slug,
  );

  if (!album) notFound();

  return (
    <div>
      <h1>{album.title}</h1>
      <SafeHtml html={album.description} />

      <div className="grid">
        {album.items?.map((item) => (
          <figure key={item.id}>
            <img src={item.image_url} alt={item.image_alt ?? ""} />
            {item.caption && (
              <figcaption>
                <SafeHtml html={item.caption} />
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
```

---

### Contact Page — Form Only, No Section Rendering

The contact page does **not** use `RenderSections`. It is a dedicated form page that submits directly to the CMS via `submitContactForm`. Do not render CMS sections here — just build your form UI and wire it to the SDK.

**If the site has Turnstile enabled, the form will not work without it.** Fetch the config
on the server, render the widget with the site key, and forward the token through your own
API route along with the rest of the payload.

```tsx
// components/pages/ContactPage.tsx  (server component)
import { ContactForm } from "@/components/contact-form";
import { cms, SITE_ID } from "@/lib/cms";
import type { Page, SiteConfig } from "@crayonscodetech/cms-sdk";

export default async function ContactPage({
  page,
  site,
}: {
  page: Page;
  site?: SiteConfig | null;
}) {
  // Public site key only — safe to hand to the client.
  const contactConfig = await cms.fetchContactConfig(SITE_ID);
  const turnstile = contactConfig?.turnstile;

  // enabled with no site key = misconfigured; the widget cannot render and every
  // submission would be rejected, so do not show a form that cannot succeed.
  if (turnstile?.enabled && !turnstile.site_key) {
    return (
      <main>
        <h1>Contact Us</h1>
        <p>The contact form is temporarily unavailable.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Contact Us</h1>
      <ContactForm turnstileSiteKey={turnstile?.enabled ? turnstile.site_key : null} />
    </main>
  );
}
```

```tsx
// components/contact-form.tsx  (client component — handles submission)
"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

export function ContactForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string | null;
}) {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const widget = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (turnstileSiteKey && !token) {
      setError("Please complete the verification.");
      return;
    }
    setStatus("sending");
    setError("");

    const form = e.currentTarget;
    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
      type: "contact",
      turnstile_token: token,
    };

    try {
      // Proxied through your own route so SITE_ID stays server-side.
      const res = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      // Turnstile tokens are single-use — always reset, success or failure, or
      // the next submit replays a spent token and is rejected.
      widget.current?.reset();
      setToken("");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" />
      <input name="subject" placeholder="Subject" />
      <textarea name="message" placeholder="Message" required />
      {turnstileSiteKey && (
        <Turnstile ref={widget} siteKey={turnstileSiteKey} onSuccess={setToken} />
      )}
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {status === "success" && <p>Message sent!</p>}
      {status === "error" && <p>{error}</p>}
    </form>
  );
}
```

```ts
// app/api/contact/route.ts  (server — keeps SITE_ID out of the client bundle)
import { cms, SITE_ID } from "@/lib/cms";
import { CmsError, type ContactPayload } from "@crayonscodetech/cms-sdk";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload: ContactPayload = await req.json();

  try {
    const contact = await cms.submitContactForm(SITE_ID, payload);
    return Response.json({ ok: true, contact });
  } catch (e) {
    // submitContactForm throws rather than returning null, so the visitor can be
    // told what actually went wrong.
    if (e instanceof CmsError) {
      const message =
        e.status === 403
          ? "Verification failed. Please try again."
          : e.status === 429
            ? "Too many attempts. Please wait a moment."
            : e.message;
      return Response.json({ ok: false, error: message }, { status: e.status ?? 502 });
    }
    return Response.json({ ok: false, error: "Submission failed" }, { status: 502 });
  }
}
```

> `SITE_ID` is kept server-side. Never call `submitContactForm` directly from a client component.

---

## Store

The store is a separate product/e-commerce layer built on top of the CMS. It uses a completely different API prefix (`/api/public/store/`) and its routes are **hardcoded in the catch-all** — they are not CMS-managed pages.

### Overview

| Concern          | CMS                         | Store                         |
| ---------------- | --------------------------- | ----------------------------- |
| API prefix       | `/api/public/cms/{siteId}/` | `/api/public/store/{siteId}/` |
| Route management | CMS dashboard (page_type)   | Hardcoded in `[[...slug]]`    |
| Content editing  | Via CMS                     | Via store admin               |

**Feature flag** — gate all store UI behind a constant so it can be disabled per project:

```ts
// config/store.ts
export const STORE_ENABLED = true;
```

---

### Store Types

| File                  | Exports                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| `product.ts`          | `Product`, `ProductVariant`, `ProductImage`, `ProductStatus`                            |
| `product-category.ts` | `ProductCategory`                                                                       |
| `product-brand.ts`    | `ProductBrand`                                                                          |
| `collection.ts`       | `Collection`, `CollectionDetail`, `CollectionItem`                                      |
| `order.ts`            | `Order`, `OrderItem`, `ShippingAddress`, `PlaceOrderPayload`, `CartItem`, `OrderStatus` |
| `seo.ts`              | `ProductSEO`, `ProductExtraData`                                                        |

```ts
import type {
  Product,
  ProductVariant,
  ProductCategory,
  ProductBrand,
  Collection,
  CollectionDetail,
  CollectionItem,
  Order,
  PlaceOrderPayload,
  CartItem,
  ProductSEO,
} from "@crayonscodetech/cms-sdk";
```

> **SEO and Extra Fields**
>
> The following types include `seo` and `extra` fields:
>
> - `Product`
> - `ProductListItem`
> - `ProductCategory`
> - `ProductBrand`
> - `Collection` / `CollectionListItem`
>
> The `ProductSEO` interface contains:
>
> ```ts
> interface ProductSEO {
>   title?: string | null;
>   description?: string | null;
>   tags?: string[] | null;
> }
> ```
>
> `ProductExtraData` is a flexible `Record<string, unknown>` for custom data.
>
> `Product` and `ProductListItem` also carry `tags?: ProductTag[]` (`{ id, name, slug }`) — the store tags assigned in the CMS, not the SEO keywords in `seo.tags`.

> `Product.description` is HTML — render it through `SafeHtml` (see [Rich Text / HTML Fields](#rich-text--html-fields)), never raw. Public product variants expose `inventory` as a boolean plus `low_stock`, never include `cost_price`, and omit `price`/`sale_price` when the site's `price_visibility` is false (so `price` is optional). `attributes`, `features`, `specifications` and `included_items` are `null` when unset. Collection detail responses normalize both manual and smart collections into `collection.items`.

---

### Route Structure

Store routes are top-level and handled before CMS page resolution in `[[...slug]]/page.tsx`:

```
/products               → product listing
/products/[slug]        → product detail
/categories             → all categories
/categories/[slug]      → products filtered by category
/brands                 → all brands
/brands/[slug]          → products filtered by brand
/collections            → all collections
/collections/[slug]     → collection detail + its products
```

**Catch-all integration — handle store routes first:**

```tsx
// app/[[...slug]]/page.tsx
import { notFound } from "next/navigation";
import { STORE_ENABLED } from "@/config/store";
import ProductsPage from "@/components/pages/ProductsPage";
import ProductDetailPage from "@/components/pages/ProductDetailPage";
import ProductCategoriesPage from "@/components/pages/ProductCategoriesPage";
import CategoryProductsPage from "@/components/pages/CategoryProductsPage";
import BrandsPage from "@/components/pages/BrandsPage";
import BrandProductsPage from "@/components/pages/BrandProductsPage";
import CollectionsPage from "@/components/pages/CollectionsPage";
import CollectionDetailPage from "@/components/pages/CollectionDetailPage";

export default async function CatchAll({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug = [] } = await params;

  // ── Store routes (resolved before CMS pages) ──────────────────────────────
  if (
    !STORE_ENABLED &&
    ["products", "categories", "brands", "collections"].includes(slug[0])
  ) {
    notFound();
  }

  if (slug[0] === "products") {
    if (slug.length === 1) return <ProductsPage searchParams={searchParams} />;
    return <ProductDetailPage params={Promise.resolve({ slug: slug[1] })} />;
  }

  if (slug[0] === "categories") {
    if (slug.length === 1) return <ProductCategoriesPage />;
    return (
      <CategoryProductsPage
        params={Promise.resolve({ slug: slug[1] })}
        searchParams={searchParams}
      />
    );
  }

  if (slug[0] === "brands") {
    if (slug.length === 1) return <BrandsPage />;
    return (
      <BrandProductsPage
        params={Promise.resolve({ slug: slug[1] })}
        searchParams={searchParams}
      />
    );
  }

  if (slug[0] === "collections") {
    if (slug.length === 1) return <CollectionsPage />;
    return (
      <CollectionDetailPage
        params={Promise.resolve({ slug: slug[1] })}
        searchParams={searchParams}
      />
    );
  }

  // ── CMS pages (catch-all continues below) ────────────────────────────────
  // ... resolveCmsRoute / fetchPageByUrl logic
}
```

---

### Products Page

```tsx
// components/pages/ProductsPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import type { Product, ProductCategory } from "@crayonscodetech/cms-sdk";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category_id?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { page = "1", search, category_id } = await searchParams;

  const [{ data: products, pagination }, { data: categories }] = await Promise.all([
    cms.fetchProducts(SITE_ID, {
      page: Number(page),
      limit: 12,
      search,
      category_id,
    }),
    cms.fetchProductCategories(SITE_ID, { limit: 40 }),
  ]);

  return (
    <div>
      {/* Category filter tabs */}
      <nav>
        <Link href="/products">All</Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/products?category_id=${cat.id}`}>
            {cat.name}
          </Link>
        ))}
      </nav>

      {/* Product grid */}
      <div className="grid">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            {product.thumbnail_url && (
              <img src={product.thumbnail_url} alt={product.name} />
            )}
            <h2>{product.name}</h2>
            {product.subtitle && <p>{product.subtitle}</p>}
            {product.is_featured && <span>Featured</span>}
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <p>
        Page {pagination.page} • Total products: {pagination.total}
      </p>
    </div>
  );
}
```

---

### Product Detail Page

The detail page is split into a **server component** (data fetch) and a **client component** (interactivity — variant selection, cart). `variants` is only returned by `fetchProductDetail`, not the list endpoint.

```tsx
// components/pages/ProductDetailPage.tsx  (server component)
import { cms, orNull, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/store/ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await orNull(cms.fetchProductDetail(SITE_ID, slug));

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
```

```tsx
// components/store/ProductDetailClient.tsx  (client component)
"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@crayonscodetech/cms-sdk";
import { useCart } from "@/context/CartContext";
import SafeHtml from "@/components/safe-html";

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null,
  );
  const [quantity, setQuantity] = useState(1);

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem(product, selectedVariant, quantity);
  }

  return (
    <article>
      {product.thumbnail_url && (
        <img src={product.thumbnail_url} alt={product.name} />
      )}
      <h1>{product.name}</h1>
      {product.subtitle && <p>{product.subtitle}</p>}

      {/* Variant selector */}
      {product.variants && product.variants.length > 0 && (
        <div>
          {product.variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariant(v)}
              aria-pressed={selectedVariant?.id === v.id}
            >
              {v.name ?? v.sku}
              {/* price is absent when the site hides prices */}
              {(v.sale_price ?? v.price) != null && ` — $${v.sale_price ?? v.price}`}
              {!v.inventory && " (Out of stock)"}
            </button>
          ))}
        </div>
      )}

      {/* Quantity + add to cart */}
      <div>
        <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
          -
        </button>
        <span>{quantity}</span>
        <button onClick={() => setQuantity((q) => q + 1)}>+</button>
      </div>
      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant || !selectedVariant.inventory}
      >
        Add to Cart
      </button>

      {/* Rich-text description */}
      <SafeHtml html={product.description} />

      {/* Variant specs */}
      {selectedVariant?.specifications &&
        Object.entries(selectedVariant.specifications).map(([group, specs]) => (
          <div key={group}>
            <h3>{group}</h3>
            {Object.entries(specs).map(([k, v]) => (
              <p key={k}>
                <strong>{k}:</strong> {v}
              </p>
            ))}
          </div>
        ))}
    </article>
  );
}
```

---

### Categories Page

```tsx
// components/pages/ProductCategoriesPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import Link from "next/link";

export default async function ProductCategoriesPage() {
  // Paginated, up to 40 per page: pass { page } to show more
  const { data: categories } = await cms.fetchProductCategories(SITE_ID, { limit: 40 });

  return (
    <div className="grid">
      {categories.map((cat) => (
        <Link key={cat.id} href={`/categories/${cat.slug}`}>
          {cat.image_url && <img src={cat.image_url} alt={cat.name} />}
          <h2>{cat.name}</h2>
          {cat.description && <p>{cat.description}</p>}
        </Link>
      ))}
    </div>
  );
}
```

**Category detail page — products filtered by category:**

```tsx
// components/pages/CategoryProductsPage.tsx
import { cms, findInPages, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function CategoryProductsPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { page = "1", search } = await searchParams;

  // Resolve category_id from slug. There is no by-slug lookup and the list is
  // paginated, so page through it rather than searching only the first page.
  const category = await findInPages(
    (p) => cms.fetchProductCategories(SITE_ID, { page: p, limit: 40 }),
    (c) => c.slug === slug,
  );
  if (!category) notFound();

  const { data: products, pagination } = await cms.fetchProducts(SITE_ID, {
    category_id: category.id,
    page: Number(page),
    limit: 12,
    search,
  });

  return (
    <div>
      <h1>{category.name}</h1>
      {category.description && <p>{category.description}</p>}

      <div className="grid">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            {product.thumbnail_url && (
              <img src={product.thumbnail_url} alt={product.name} />
            )}
            <h2>{product.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

### Brands Page

```tsx
// components/pages/BrandsPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import Link from "next/link";

export default async function BrandsPage() {
  // Paginated, up to 40 per page: pass { page } to show more
  const { data: brands } = await cms.fetchProductBrands(SITE_ID, { limit: 40 });

  return (
    <div className="grid">
      {brands.map((brand) => (
        <Link key={brand.id} href={`/brands/${brand.slug}`}>
          {brand.logo_url && <img src={brand.logo_url} alt={brand.name} />}
          <h2>{brand.name}</h2>
          {brand.description && <p>{brand.description}</p>}
        </Link>
      ))}
    </div>
  );
}
```

**Brand detail page — products filtered by brand:**

```tsx
// components/pages/BrandProductsPage.tsx
import { cms, findInPages, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function BrandProductsPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { page = "1", search } = await searchParams;

  // No by-slug lookup and at most 40 brands per page: page through the list.
  const brand = await findInPages(
    (p) => cms.fetchProductBrands(SITE_ID, { page: p, limit: 40 }),
    (b) => b.slug === slug,
  );
  if (!brand) notFound();

  const { data: products, pagination } = await cms.fetchProducts(SITE_ID, {
    brand_id: brand.id,
    page: Number(page),
    limit: 12,
    search,
  });

  return (
    <div>
      {brand.logo_url && <img src={brand.logo_url} alt={brand.name} />}
      <h1>{brand.name}</h1>

      <div className="grid">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`}>
            {product.thumbnail_url && (
              <img src={product.thumbnail_url} alt={product.name} />
            )}
            <h2>{product.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

### Collections Page

```tsx
// components/pages/CollectionsPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import Link from "next/link";

export default async function CollectionsPage() {
  const { data: collections } = await cms.fetchCollections(SITE_ID);

  return (
    <div className="grid">
      {collections.map((col) => (
        <Link key={col.id} href={`/collections/${col.slug}`}>
          <h2>{col.name}</h2>
          {col.description && <p>{col.description}</p>}
          {col._count && <span>{col._count.items} products</span>}
        </Link>
      ))}
    </div>
  );
}
```

**Collection detail — renders the collection's products in order:**

```tsx
// components/pages/CollectionDetailPage.tsx
import { cms, orNull, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category_id?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { category_id, page = "1" } = await searchParams;
  const collection = await orNull(
    cms.fetchCollectionDetail(SITE_ID, slug, {
      category_id,
      page: Number(page),
      limit: 20,
    }),
  );

  if (!collection) notFound();

  // Works for both manual collections and smart collections
  const items = collection.items ?? [];

  return (
    <div>
      <h1>{collection.name}</h1>
      {collection.description && <p>{collection.description}</p>}
      {collection.collection_type === "smart" && (
        <p>This collection is populated automatically.</p>
      )}

      <div className="grid">
        {items.map((item) => (
          <Link key={item.id} href={`/products/${item.product.slug}`}>
            {item.product.thumbnail_url && (
              <img src={item.product.thumbnail_url} alt={item.product.name} />
            )}
            <h2>{item.product.name}</h2>
            {/* Show lowest variant price */}
            {/* price is absent when the site hides prices */}
            {item.product.variants?.some((v) => v.price != null) && (
              <p>
                From $
                {Math.min(
                  ...item.product.variants.map(
                    (v) => v.sale_price ?? v.price ?? Infinity,
                  ),
                )}
              </p>
            )}
          </Link>
        ))}
      </div>

      {collection.pagination && (
        <p>
          Page {collection.pagination.page} • Total matched products:{" "}
          {collection.pagination.total}
        </p>
      )}
    </div>
  );
}
```

> `collection.items` includes the full `product` object with `variants` for both manual and smart collections. The backend resolves smart collections before returning the public detail payload.

---

### Cart State (CartContext)

The cart is managed client-side using React Context with `localStorage` persistence. Wrap the root layout with the provider.

```tsx
// context/CartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { CartItem, Product, ProductVariant } from "@crayonscodetech/cms-sdk";

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setItems(JSON.parse(stored));
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  function addItem(
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant.id === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variant.id === variant.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { product, variant, quantity }];
    });
  }

  function removeItem(variantId: string) {
    setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  }

  function updateQuantity(variantId: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.variant.id === variantId ? { ...i, quantity } : i)),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.variant.sale_price ?? i.variant.price ?? 0) * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        isOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
```

```tsx
// app/layout.tsx — wrap children with CartProvider
import type { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import CartDrawer from "@/components/store/CartDrawer";
import { cms, orNull, SITE_ID } from "@/lib/cms";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [header, footer, siteConfig] = await Promise.all([
    orNull(cms.fetchHeader(SITE_ID)),
    orNull(cms.fetchFooter(SITE_ID)),
    orNull(cms.fetchSiteConfig(SITE_ID)),
  ]);

  return (
    <html>
      <body>
        <CartProvider>
          {header && <SiteHeader header={header} siteConfig={siteConfig} />}
          {children}
          {footer && <SiteFooter footer={footer} />}
          <CartDrawer />   {/* slides in when isOpen = true */}
        </CartProvider>
      </body>
    </html>
  );
}
```

> `CartProvider` and `useCart` are client-only. Never call `useCart` inside a server component.

---

### Order Placement

`placeOrder` must be called server-side (keep `SITE_ID` out of the client bundle). Use an API route.

```ts
// app/api/store/orders/route.ts
import { cms, SITE_ID } from "@/lib/cms";
import type { PlaceOrderPayload } from "@crayonscodetech/cms-sdk";

export async function POST(req: Request) {
  const payload: PlaceOrderPayload = await req.json();
  const order = await cms.placeOrder(SITE_ID, payload);
  if (!order) return Response.json({ error: "Order failed" }, { status: 500 });
  return Response.json(order);
}
```

```tsx
// components/store/CheckoutForm.tsx  (client component)
"use client";

import { useState } from "react";
import type { PlaceOrderPayload } from "@crayonscodetech/cms-sdk";
import { useCart } from "@/context/CartContext";

export function CheckoutForm() {
  const { items, subtotal, clearCart } = useCart();
  const [status, setStatus] = useState<
    "idle" | "placing" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("placing");

    const form = e.currentTarget;
    const payload: PlaceOrderPayload = {
      customer_name: (form.elements.namedItem("name") as HTMLInputElement)
        .value,
      customer_email: (form.elements.namedItem("email") as HTMLInputElement)
        .value,
      customer_phone:
        (form.elements.namedItem("phone") as HTMLInputElement).value || null,
      shipping_address: {
        line1: (form.elements.namedItem("line1") as HTMLInputElement).value,
        city: (form.elements.namedItem("city") as HTMLInputElement).value,
        zip: (form.elements.namedItem("zip") as HTMLInputElement).value,
        country: (form.elements.namedItem("country") as HTMLInputElement).value,
      },
      items: items.map((i) => ({
        product_variant_id: i.variant.id,
        quantity: i.quantity,
      })),
      notes:
        (form.elements.namedItem("notes") as HTMLTextAreaElement).value || null,
    };

    const res = await fetch("/api/store/orders", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      clearCart();
      setStatus("success");
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Full name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="phone" placeholder="Phone (optional)" />
      <input name="line1" placeholder="Street address" required />
      <input name="city" placeholder="City" required />
      <input name="zip" placeholder="ZIP / Postcode" required />
      <input name="country" placeholder="Country" required />
      <textarea name="notes" placeholder="Order notes (optional)" />

      <p>Subtotal: ${subtotal.toFixed(2)}</p>

      <button
        type="submit"
        disabled={status === "placing" || items.length === 0}
      >
        {status === "placing" ? "Placing order…" : "Place Order"}
      </button>
      {status === "success" && <p>Order placed successfully!</p>}
      {status === "error" && <p>Something went wrong. Please try again.</p>}
    </form>
  );
}
```

---

## Redirects

The CMS supports managed redirects (301/302/307/308) configured through the dashboard. The SDK provides three methods:

| Method                                             | Use                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `resolveRedirect(siteId, sourcePath)`              | Resolve a single path — use this in middleware                          |
| `fetchRedirects(siteId)`                           | Fetch all redirects — use this in `next.config.ts` for static redirects |
| `reportRedirect404(siteId, sourcePath, referrer?)` | Log a 404 hit so the CMS can suggest redirect candidates                |

`resolveRedirect` supports both **manual** redirects (exact path match) and **pattern** redirects (e.g. `/blog/:slug → /news/:slug`). When a pattern matches, `ResolvedRedirect.params` contains the captured values and `destinationPath` already has them substituted in.

> **Feature gate**: redirects and 404 logging are enabled **per site by a super admin** in the CMS dashboard (Super User → Sites). When a site has redirects disabled, those endpoints answer `403`, and the SDK methods **throw** a `CmsError` with `status: 403`. `resolveRedirect` also throws a `CmsError` with `status: 404` when no redirect matches the path, which is the normal case for most requests. The examples below handle both: `orNull()` (see [Initialization](#2-initialization)) turns a 404 or 403 into `null`, so the middleware falls through to normal rendering, and the 404 logger swallows its rejection.

---

### Option A — Middleware (Recommended)

Handle redirects at the edge before any page renders. This is the correct approach for SSR/ISR apps deployed to Vercel, Cloudflare Workers, or any edge runtime.

Use the shared CMS client singleton from `@/lib/cms` — do **not** create a new client inside middleware.

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cms, orNull, SITE_ID } from "@/lib/cms";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip internal Next.js paths, API routes, static assets, and home page
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Normalize trailing slash for consistent CMS lookup
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  try {
    // No match (404) and redirects switched off (403) both resolve to null here;
    // anything else is a real failure and lands in the catch below.
    const resolution = await orNull(cms.resolveRedirect(SITE_ID, normalizedPath));

    if (resolution && resolution.redirect.enabled) {
      const { destinationPath, redirect } = resolution;
      const destinationUrl = new URL(destinationPath, request.url);

      // Forward original query string if destination has none
      if (search && !destinationUrl.search) {
        destinationUrl.search = search;
      }

      return NextResponse.redirect(destinationUrl, {
        status: redirect.status_code || 301,
      });
    }
  } catch (error) {
    // Silently continue — never let redirect errors break page rendering
    console.error("Middleware redirect resolution error:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|assets|sitemap.xml|robots.txt).*)",
  ],
};
```

> **Edge Runtime note**: `cms.resolveRedirect` uses `fetch` internally, which is available in both Node.js and Edge runtimes. This middleware is safe to deploy to Cloudflare Workers and Vercel Edge.

---

### Option B — `next.config.ts` (Static only)

Use this when you want redirects baked in at build time (no runtime latency). Suitable for a small, infrequently-changing redirect list.

```ts
// next.config.ts
import type { NextConfig } from "next";
import { CmsError, createCmsClient } from "@crayonscodetech/cms-sdk";

const cms = createCmsClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL || "",
});

const SITE_ID = process.env.NEXT_PUBLIC_CMS_SITE_ID || "";

const nextConfig: NextConfig = {
  async redirects() {
    let redirects: Awaited<ReturnType<typeof cms.fetchRedirects>> = [];
    try {
      redirects = await cms.fetchRedirects(SITE_ID);
    } catch (error) {
      // 403 = redirects are switched off for this site; build without them.
      // Anything else should fail the build rather than ship without redirects.
      if (!(error instanceof CmsError && error.status === 403)) throw error;
    }

    // fetchRedirects returns enabled redirects only
    return redirects
      .map((r) => ({
        source: r.source_path,
        destination: r.destination_path,
        permanent: r.status_code === 301 || r.status_code === 308,
      }));
  },
};

export default nextConfig;
```

> **Limitation**: These are resolved once at build time. New redirects added in the CMS dashboard won't take effect until the next deployment. Use middleware (Option A) if redirects need to update without a redeploy.

---

### Logging 404s as Redirect Candidates

`reportRedirect404` must be called from a **client component** — `not-found.tsx` runs before the URL is known server-side, so `window.location.pathname` is the reliable source. Create a small `NotFoundLogger` client component and drop it into your `not-found.tsx`.

```tsx
// components/shared/NotFoundLogger.tsx
"use client";

import { useEffect } from "react";
import { cms, SITE_ID } from "@/lib/cms";

// Module-level deduplication flag (prevents React Strict Mode double-fire in dev)
declare global {
  interface Window {
    __lastRedirect404Log?: { path: string; timestamp: number };
  }
}

export default function NotFoundLogger() {
  useEffect(() => {
    if (!SITE_ID || typeof window === "undefined") return;

    const pathname = window.location.pathname;
    if (!pathname || pathname === "/") return;

    const now = Date.now();
    const previous = window.__lastRedirect404Log;

    // Skip duplicate reports within 1 second (Strict Mode remounts)
    if (previous?.path === pathname && now - previous.timestamp < 1000) return;

    window.__lastRedirect404Log = { path: pathname, timestamp: now };

    // Fire and forget. The call rejects when 404 logging is switched off for the
    // site (403) or rate-limited (429); neither should surface to the visitor.
    cms
      .reportRedirect404(SITE_ID, pathname, document.referrer || undefined, {
        cache: "no-store",
      })
      .catch(() => {});
  }, []);

  return null;
}
```

```tsx
// app/not-found.tsx
import NotFoundLogger from "@/components/shared/NotFoundLogger";

export default function NotFoundPage() {
  return (
    <>
      <NotFoundLogger />
      <main>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
      </main>
    </>
  );
}
```

> The logger renders nothing — it only fires the `reportRedirect404` call on mount. The CMS dashboard accumulates these hits and surfaces high-frequency 404 paths as redirect candidates.

---

## SEO & Metadata

Every `Page` returned by `fetchPageByUrl` or `fetchPages` includes an `seo` field (`SEO | null`) with `title`, `description`, `tags`, and `image`. Use Next.js `generateMetadata` to apply this per page, falling back to the site-wide defaults from `SiteConfig`.

> **Required env var for canonical URLs**: add `NEXT_PUBLIC_SITE_URL=https://www.yoursite.com` (your website's own domain — not the CMS API URL) to `.env.local`. Without it, `canonical` and `og:url` tags are omitted.

```tsx
// app/[[...slug]]/page.tsx
import type { Metadata } from "next";
import { cms, orNull, SITE_ID } from "@/lib/cms";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const urlPath = slug ? `/${slug.join("/")}` : "/";

  // Without orNull, an unknown URL would throw here and turn the 404 into a 500.
  const [page, siteConfig] = await Promise.all([
    orNull(cms.fetchPageByUrl(SITE_ID, urlPath)),
    orNull(cms.fetchSiteConfig(SITE_ID)),
  ]);

  const siteName = siteConfig?.site_name ?? "";
  // NEXT_PUBLIC_SITE_URL is your website's own domain (e.g. https://www.example.com),
  // NOT the CMS API URL.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  if (!page?.seo) {
    return { title: siteName };
  }

  const { title, description, tags, image } = page.seo;

  return {
    title: title ? `${title} | ${siteName}` : siteName,
    description: description ?? undefined,
    keywords: tags.length > 0 ? tags : undefined,
    openGraph: {
      title: title ?? siteName,
      description: description ?? undefined,
      url: siteUrl ? `${siteUrl}${urlPath}` : undefined,
      siteName,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteName,
      description: description ?? undefined,
      images: image ? [image] : undefined,
    },
    ...(siteUrl && {
      alternates: {
        canonical: `${siteUrl}${urlPath}`,
      },
    }),
  };
}
```

For dedicated pages (blog detail, service detail, etc.) the pattern is the same — use the entity's own SEO fields:

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";
import { cms, orNull, SITE_ID } from "@/lib/cms";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [blog, siteConfig] = await Promise.all([
    orNull(cms.fetchBlogBySlug(SITE_ID, slug)),
    orNull(cms.fetchSiteConfig(SITE_ID)),
  ]);
  const siteName = siteConfig?.site_name ?? "";

  if (!blog) return { title: "Not Found" };

  return {
    title: blog.seo_title
      ? `${blog.seo_title} | ${siteName}`
      : `${blog.title} | ${siteName}`,
    description: blog.seo_description ?? blog.excerpt ?? undefined,
    openGraph: {
      title: blog.seo_title ?? blog.title,
      description: blog.seo_description ?? blog.excerpt ?? undefined,
      images: blog.seo_image
        ? [{ url: blog.seo_image }]
        : blog.image_url
          ? [{ url: blog.image_url }]
          : undefined,
    },
  };
}
```

> `Blog`, `Event`, and `Service` all carry individual `seo_title`, `seo_description`, `seo_keywords`, and `seo_image` fields. Always prefer these over the generic page title when present.

---

## Image Setup (`next.config.ts`)

CMS images are served from an external domain. You must add it to `remotePatterns` in `next.config.ts` or Next.js will refuse to render them with `<Image>`.

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.cms.deployown.com", // CMS image host
      },
      // Add any other image CDN domains your project uses
    ],
  },
};

export default nextConfig;
```

> Without this, `next/image` will throw a runtime error for any image URL returned from the CMS. Plain `<img>` tags work without this config but lose Next.js image optimization.

---

## Recommended Project Structure

Align your project structure to handle CMS data efficiently using Server Components and the declarative registry pattern.

```
app/
├── [[...slug]]/
│   └── page.tsx                # Catch-all — handles CMS pages + store routes
├── layout.tsx                  # Root layout — fetches header, footer, siteConfig
├── api/
│   ├── contact/
│   │   └── route.ts            # CMS contact form submission
│   └── store/
│       └── orders/
│           └── route.ts        # Store order placement (placeOrder)
components/
├── pages/                      # CMS page layouts (registry-mapped)
│   ├── HomePage.tsx
│   ├── AboutPage.tsx
│   ├── BlogPage.tsx
│   ├── BlogDetailPage.tsx
│   ├── ServicesPage.tsx
│   ├── ServiceDetailPage.tsx
│   ├── EventPage.tsx
│   ├── EventDetailPage.tsx
│   ├── GalleryPage.tsx
│   ├── GalleryDetailPage.tsx
│   ├── TeamPage.tsx
│   ├── TeamCategoryPage.tsx
│   ├── TeamMemberDetailPage.tsx
│   ├── ContactPage.tsx
│   ├── CustomPage.tsx
│   │
│   │   # Store pages (hardcoded routes, not CMS-driven)
│   ├── ProductsPage.tsx            # /products
│   ├── ProductDetailPage.tsx       # /products/[slug]
│   ├── ProductCategoriesPage.tsx   # /categories
│   ├── CategoryProductsPage.tsx    # /categories/[slug]
│   ├── BrandsPage.tsx              # /brands
│   ├── BrandProductsPage.tsx       # /brands/[slug]
│   ├── CollectionsPage.tsx         # /collections
│   └── CollectionDetailPage.tsx    # /collections/[slug]
├── store/                      # Store UI components (client-side interactivity)
│   ├── ProductDetailClient.tsx # Client component — variant selection + cart
│   ├── CartDrawer.tsx          # Slide-in cart panel
│   └── CheckoutForm.tsx        # Client component — order form
├── sections/                   # CMS section components
│   ├── hero.tsx
│   ├── custom.tsx
│   ├── cta.tsx
│   ├── service.tsx
│   ├── testimonial.tsx
│   ├── team.tsx
│   ├── faq.tsx
│   ├── clients.tsx
│   ├── gallery.tsx
│   ├── event.tsx
│   ├── blog.tsx
│   ├── rich-content.tsx
│   ├── about.tsx
│   └── multi-value.tsx
└── render-sections.tsx         # The section dispatcher
context/
└── CartContext.tsx             # localStorage cart state + useCart hook
config/
└── store.ts                    # STORE_ENABLED feature flag
lib/
├── cms.ts                      # SDK client singleton (CMS + Store)
├── cms-registry.ts             # CMS page component map
└── cms-router.ts               # CMS route resolution
```

> **Note**: This structure eliminates the need for hardcoded folders for `/blog`, `/services`, etc.

> All `sections/` components that need live data are **async server components**. The `contact-form.tsx` is the only client component (`"use client"`).

> Store pages are resolved first in `[[...slug]]/page.tsx` before CMS page lookup. `ProductDetailClient.tsx`, `CartDrawer.tsx`, `CheckoutForm.tsx`, and `CartContext.tsx` are the only store-side client components (`"use client"`).

## Core Concepts

### Pagination

List endpoints return a `PaginatedResponse<T>` object:

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

Public list endpoints cap `limit` (usually 20, 40 for product categories and brands), so a larger `limit` silently returns fewer items. Page with `{ page }`, or use `findInPages` (see [Initialization](#2-initialization)) to look an item up.

### Request Options (`FetchOptions`)

Every method takes an optional last argument of type `FetchOptions`:

```typescript
export interface FetchOptions extends RequestInit {
  revalidate?: number; // Seconds to cache (Next.js `fetch` cache)
  tags?: string[]; // Cache tags for on-demand revalidation (Next.js)
  retries?: number; // Extra attempts after a network error or a 502/503/504 (default 1)
}
```

- **Caching**: most methods set their own `revalidate` and `tags`, and those take precedence over the client's `defaultOptions`. To change caching for a call, pass `options` to that call. `revalidate` and `tags` only have an effect in Next.js; other runtimes ignore them.
- **Retries**: a failed attempt is retried after 1 s, then 2 s. Errors other than 502/503/504 (a 404, for example) are not retried. `placeOrder` sends with `retries: 0` unless you pass `retries`, and `submitContactForm` never retries, so a slow response can't create a duplicate order or message. The generic `cms.fetch` retries whatever method you give it, so pass `retries: 0` for a `POST`.
- **Errors**: see [Error Handling](#error-handling).

## API Reference

Every method throws a `CmsError` when the request fails, including a `404` when a single item is not found (see [Error Handling](#error-handling)). Wrap single-item reads in `orNull()` where "not found" is a normal outcome.

### Global Configuration

- `fetchHeader(siteId, options?)`: Fetches the site header navigation and CTAs.
- `fetchFooter(siteId, options?)`: Fetches the site footer configuration.
- `fetchSiteConfig(siteId, options?)`: Fetches site-wide settings (logo, name, etc.).

### Pages

- `fetchPages(siteId, params?, options?)`: Returns paginated page summaries (`10` items per backend page, no `sections`). Params: `{ page }`.
- `fetchPageByUrl(siteId, urlPath, options?)`: Fetches a specific page directly by URL path. Throws a `CmsError` with status `404` when no published page has that URL.
- `fetchPageByType(siteId, pageType, options?)`: Fetches the site's single published page of a given `PageType` (for example `"home"` or `"blog"`), with its sections. Prefer it when you know which kind of page you want but not its URL, since editors can rename URLs. Throws a `CmsError` with status `404` when the site has no published page of that type.

### Blogs & Categories

- `fetchBlogs(siteId, params?, options?)`: Returns paginated blogs. Params: `{ page, limit, search }`.
- `fetchBlogBySlug(siteId, slug, options?)`: Returns a single blog post by slug.
- `fetchBlogById(siteId, idOrSlug, options?)`: Backwards-compatible alias (internally resolves via slug route).
- `fetchCategories(siteId, params?, options?)`: Returns paginated team categories. Params: `{ page, limit }`. Default limit: 20.

### Other Entities

- `fetchServices(siteId, params?, options?)`: Returns paginated services. Params: `{ page, limit }`. Only published services are returned — the backend filters on `is_published`, and each item carries `is_published` plus a nullable `published_at`.
- `fetchServiceBySlug(siteId, slug, options?)`: Returns a single published service by slug, including its `extra.sections`. Throws a `CmsError` with status `404` if not found or unpublished.
- `fetchTeamMembers(siteId, params?, options?)`: Returns paginated team members. Params: `{ page, limit }`. Default limit: 20.
- `fetchTeamMembersByCategory(siteId, params, options?)`: Returns paginated team members filtered by category. Params: `{ categoryId, page?, limit? }`. Default limit: 20. **Note:** `categoryId` is now inside the params object.
- `fetchTestimonials(siteId, params?, options?)`: Returns paginated testimonials. Params: `{ type?, page?, limit? }`. Default limit: 20.
- `fetchEvents(siteId, params?, options?)`: Returns paginated events. Params: `{ page, limit, search }`.
- `fetchEventBySlug(siteId, slug, options?)`: Returns a single published event by slug. Throws a `CmsError` with status `404` if not found or unpublished.
- `fetchAlbums(siteId, params?, options?)`: Returns paginated albums. Params: `{ page, limit, search }`.
- `fetchAlbumItems(siteId, params, options?)`: Returns paginated items for an album. Params: `{ album?, album_id?, page?, limit? }`. Default limit: 20.

### Redirects

- `fetchRedirects(siteId, options?)`: Returns the site's enabled redirects (disabled ones are not returned). Use in `next.config.ts` for build-time static redirects. Throws a `CmsError` with status `403` when redirects are switched off for the site.
- `resolveRedirect(siteId, sourcePath, options?)`: Resolves a single path against CMS redirects. Returns a `ResolvedRedirect` (`redirect`, `destinationPath`, `params`, `type`). Throws a `CmsError` with status `404` when nothing matches and `403` when redirects are switched off, so wrap it in `orNull()`. Supports pattern redirects with captured params. Use in middleware.
- `reportRedirect404(siteId, sourcePath, referrer?, options?)`: Logs a 404 hit to the CMS for redirect candidate tracking. Call fire-and-forget from `not-found.tsx`, with a `.catch()`: it rejects with `403` when 404 logging is switched off and `429` when rate-limited.

### FAQ & Help

- `fetchBrandGroups(siteId, params?, options?)`: Returns paginated published brand groups. Params: `{ page?, limit? }`. Default limit: 20.
- `fetchBrands(siteId, params, options?)`: Returns paginated brands, optionally filtered by group. Params: `{ group?, group_id?, page?, limit? }`. Default limit: 20.
- `fetchFaqGroups(siteId, params?, options?)`: Returns paginated FAQ groups with their nested FAQs. Params: `{ page?, limit? }`. Default limit: 20.
- `fetchFaqs(siteId, params?, options?)`: Returns paginated flat list of FAQs. Params: `{ group_id?, page?, limit? }`. Default limit: 20.

### Forms & Submissions

- `fetchContactConfig(siteId, options?)`: Public Turnstile settings for the contact form.
  Call it before rendering the form.
  - **Returns**: `{ turnstile: { enabled: boolean; site_key: string | null } }`
  - When `enabled` is true you MUST render the Turnstile widget with `site_key` and pass the
    resulting token as `turnstile_token`, or every submission is rejected with 403.
  - `enabled: true` with a null `site_key` means the site is misconfigured — hide the form
    rather than submitting into a guaranteed rejection.

- `submitContactForm(siteId, payload, attachments?, options?)`: Submits a contact form.
  - **Payload Structure**:
    ```typescript
    {
      name: string;              // Required
      message: string;           // Required
      email?: string;            // Optional
      subject?: string;          // Optional
      type?: string;             // Default: "contact"
      turnstile_token?: string;  // Required when Turnstile is enabled
    }
    ```
  - **Attachments** (optional): `File[]`. Sending them switches the request to multipart.
    Caps, enforced server-side and pre-checked client-side: max 3 files, 3 MiB total, and a
    MIME allowlist (PDF, PNG, JPEG, WebP, GIF, plain text, DOC, DOCX).
  - **Throws `CmsError` on failure**, like every method. Check `error.status` to tell
    rejection kinds apart:
    `403` captcha failed (reset the widget — tokens are single-use), `429` rate limited,
    `400` validation, `503` Turnstile misconfigured server-side.
  - Never retried: a resend would duplicate the submission.

    ```typescript
    import { CmsError } from "@crayonscodetech/cms-sdk";

    try {
      const contact = await cms.submitContactForm(SITE_ID, payload, files);
    } catch (e) {
      if (e instanceof CmsError && e.status === 403) {
        // captcha rejected — reset the widget and let the visitor retry
      }
    }
    ```

### Store

> All store methods use the `/api/public/store/` API prefix, not `/api/public/cms/`.

- `fetchStoreSettings(siteId, options?)`: Returns `{ currency, price_visibility, is_store_enabled }`. Fetch this first — public endpoints never return `cost_price`, and when `price_visibility` is false the API also strips `price` and `sale_price` from every variant, so the storefront must render an inquiry flow rather than prices.
- `fetchProductCategories(siteId, params?, options?)`: Returns paginated product categories. Params: `{ page, limit, search, ordering, parent_id }`.
- `fetchProductBrands(siteId, params?, options?)`: Returns paginated product brands. Params: `{ page, limit, search, ordering }`.
- `fetchProducts(siteId, params?, options?)`: Returns paginated products. Params: `{ page, limit, search, category_id, tag_id, brand_id, is_featured }`.
  - `category_id` is hierarchy-aware on the backend and includes child/grandchild categories.
- `fetchProductDetail(siteId, slug, options?)`: Returns a single product by slug, **including `variants`**.
- `fetchCollections(siteId, params?, options?)`: Returns collections (with `_count.items`, no products). Params: `{ page, limit, search, id }`. The `id` parameter accepts a comma-separated string of collection IDs (e.g., `"id1,id2"`) to filter the results.
- `fetchCollectionDetail(siteId, slug, params?, options?)`: Returns a single collection **with full `items` array** (products + variants included).
  - Params: `{ page, limit, category_id }`
  - Works for both manual and smart collections
- `fetchCollectionDetailById(siteId, id, params?, options?)`: Same as `fetchCollectionDetail`, but keyed by collection ID for CMS-driven product sections.
- `fetchProductsByTag(siteId, tag, params?, options?)`: Returns paginated products carrying a tag. Params: `{ page, limit }`.
- `placeOrder(siteId, payload, options?)`: Places an order. Call from a server API route — never client-side.
  - `metadata` on the payload must be a **flat `Record<string, string>`** — the API validates it on a strict schema, so nested objects, numbers and arrays are rejected with a 400.

---

## Sitemap

The SDK exposes twelve lightweight sitemap endpoints that return only the fields needed to build an XML sitemap (slug/URL, image, title/name, plus `updatedAt` for `lastModified`). Each endpoint filters to published content only and defaults to up to **2,000 items per request** — enough for most sites without needing to paginate.

> **These endpoints must only be called once per day.** Place them inside Next.js's `app/sitemap.ts` file and export `revalidate = 86400`. Never call them at request time.

### Methods

Use `fetchSitemap(siteId, resource, params?, options?)` for any resource. The
return type narrows automatically from the resource key:

```typescript
const pages = await cms.fetchSitemap(siteId, "pages");
pages.data[0].url; // typed — pages are addressed by url
const blogs = await cms.fetchSitemap(siteId, "blogs");
blogs.data[0].slug; // typed — everything else is addressed by slug
```

| `resource`            | Namespace | Item type                     |
| --------------------- | --------- | ----------------------------- |
| `"blogs"`             | cms       | `SitemapBlogItem`             |
| `"pages"`             | cms       | `SitemapPageItem`             |
| `"services"`          | cms       | `SitemapServiceItem`          |
| `"events"`            | cms       | `SitemapEventItem`            |
| `"albums"`            | cms       | `SitemapAlbumItem`            |
| `"team-members"`      | cms       | `SitemapTeamMemberItem`       |
| `"team-categories"`   | cms       | `SitemapTeamCategoryItem`     |
| `"brand-groups"`      | cms       | `SitemapBrandGroupItem`       |
| `"products"`          | store     | `SitemapProductItem`          |
| `"collections"`       | store     | `SitemapCollectionItem`       |
| `"product-categories"`| store     | `SitemapProductCategoryItem`  |
| `"product-brands"`    | store     | `SitemapProductBrandItem`     |

These four remain available as named shortcuts:

| Method                                                   | Returns                                        |
| -------------------------------------------------------- | ---------------------------------------------- |
| `fetchSitemapBlogs(siteId, params?, options?)`           | `PaginatedResponse<SitemapBlogItem>`           |
| `fetchSitemapPages(siteId, params?, options?)`           | `PaginatedResponse<SitemapPageItem>`           |
| `fetchSitemapProducts(siteId, params?, options?)`        | `PaginatedResponse<SitemapProductItem>`        |
| `fetchSitemapCollections(siteId, params?, options?)`     | `PaginatedResponse<SitemapCollectionItem>`     |

All accept optional `{ page?: number; limit?: number }` params.

**Field naming:** most resources return `title`; `products` and `collections`
return `name` instead (kept for backwards compatibility). `pages` is addressed
by `url` rather than `slug`, and `pages`, `team-categories` and `brand-groups`
have no `image` field.

### Types

```typescript
// Every item type includes `updatedAt` — use it for `lastModified`.
interface SitemapBlogItem {
  slug: string;
  image: string | null;
  title: string;
  updatedAt: string;
}

interface SitemapPageItem {
  url: string;   // e.g. "/about", "/services"
  title: string;
  updatedAt: string;
}

interface SitemapProductItem {
  slug: string;
  image: string | null;
  name: string;
  updatedAt: string;
}

interface SitemapCollectionItem {
  slug: string;
  image: string | null;
  name: string;
  updatedAt: string;
}
```

### Next.js `app/sitemap.ts` example

Place this file at `app/sitemap.ts`. Next.js calls it at build time and regenerates it every 24 hours via ISR.

```typescript
import type { MetadataRoute } from "next";
import { createCmsClient } from "@crayonscodetech/cms-sdk";

// Regenerate the sitemap at most once per day — do NOT remove this export.
export const revalidate = 86400;

const cms = createCmsClient({ baseUrl: process.env.NEXT_PUBLIC_CMS_API_URL! });
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL!; // e.g. "https://example.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, pages, products, collections] = await Promise.all([
    cms.fetchSitemapBlogs(SITE_ID),
    cms.fetchSitemapPages(SITE_ID),
    cms.fetchSitemapProducts(SITE_ID),
    cms.fetchSitemapCollections(SITE_ID),
  ]);

  const blogEntries: MetadataRoute.Sitemap = blogs.data.map((b) => ({
    url: `${BASE_URL}/blog/${b.slug}`,
    images: b.image ? [b.image] : undefined,
  }));

  const pageEntries: MetadataRoute.Sitemap = pages.data.map((p) => ({
    url: `${BASE_URL}${p.url}`,
  }));

  const productEntries: MetadataRoute.Sitemap = products.data.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    images: p.image ? [p.image] : undefined,
  }));

  const collectionEntries: MetadataRoute.Sitemap = collections.data.map((c) => ({
    url: `${BASE_URL}/collections/${c.slug}`,
    images: c.image ? [c.image] : undefined,
  }));

  return [
    { url: BASE_URL }, // homepage
    ...pageEntries,
    ...blogEntries,
    ...productEntries,
    ...collectionEntries,
  ];
}
```

> **Note:** If your site has more than 2,000 entries for any content type, use the `limit` param together with Next.js's [`generateSitemaps`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-multiple-sitemaps) to split the output across multiple sitemap files.

## Type System

All types are exported from the main package and are located in the `src/types/` directory.

### Importing Types

```typescript
import type {
  Header,
  Footer,
  Blog,
  Page,
  Section, // Use for map logic
  ContactPayload, // Use for form submission
  SiteConfig,
  PaginatedResponse,
  Redirect,
  ResolvedRedirect,
  RedirectStatusCode,
} from "@crayonscodetech/cms-sdk";
```

### Browsing All Types After Installation

After installing the package, the source files are not included. All exported types are compiled into one declaration file per module format:

```
node_modules/@crayonscodetech/cms-sdk/dist/index.d.mts   # ESM
node_modules/@crayonscodetech/cms-sdk/dist/index.d.cts   # CommonJS
```

Open that file to see every type, interface, and method signature the package exports. Your editor's "Go to Definition" (`F12` / `Cmd+Click`) on any imported type will also jump straight to it.

### Key Type Locations (source)

> These paths are in the SDK repository itself, not in your project's `node_modules`.

- **Entities**: `src/types/[entity].ts` (e.g., `src/types/blog.ts`)
- **API Wrappers**: `src/types/api-response.ts`
- **Pagination**: `src/types/pagination.ts`
- **Forms**: `src/types/contact.ts`

> **Browse all source types on GitHub:** [`src/types/`](https://github.com/CrayonsCodeTech/cms-sdk/tree/main/src/types)

### Rich Text / HTML Fields

Several fields contain **HTML markup** produced by the CMS rich-text editor. Render them as HTML, not as plain text, and **always sanitize them first**: anyone who can edit content in the CMS controls this HTML, and rendering it raw lets a stored `<script>` or `onerror=` handler run on your site.

DOMPurify needs a DOM, so it can't run during server rendering on Cloudflare Workers (and `isomorphic-dompurify` depends on jsdom). Use a sanitizer that works without one, such as [`xss`](https://www.npmjs.com/package/xss). The examples in this README render HTML fields through this component:

```tsx
// components/safe-html.tsx
import { filterXSS } from "xss";

/**
 * Renders CMS rich-text HTML after sanitizing it. `filterXSS` needs no DOM, so this
 * works in server components on Workers as well as in client components.
 * Its default allowlist drops <script>, <iframe>, event handlers and javascript: URLs;
 * pass a custom `whiteList` if you need to allow specific embeds.
 */
export default function SafeHtml({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: filterXSS(html) }} />;
}
```

Each HTML field is marked with a `// HTML (rich text)` comment in its type definition; hover over the field in your IDE, or browse the source on GitHub (link above).

**Fields that contain HTML:**

| Type                 | Field                                   |
| -------------------- | --------------------------------------- |
| `HeroContent`        | `description`                           |
| `CustomContent`      | `card_content`, `subtitle`              |
| `CTAContent`         | `description`                           |
| `GenericSection`     | `subtitle`                              |
| `MultiValueSection`  | `description`                           |
| `MultiValueItem`     | `description`                           |
| `HistoryItem`        | `description`                           |
| `RichContentSection` | `content`                               |
| `AboutUsData`        | `company_profile`, `vision`, `mission`  |
| `Blog`               | `description`                           |
| `Service`            | `description`                           |
| `Event`              | `description`                           |
| `Album`              | `description`                           |
| `AlbumItem`          | `caption`                               |
| `Category`           | `description`                           |
| `TeamMember`         | `description`                           |
| `Brand`              | `description`                           |
| `BrandGroup`         | `description`                           |
| `Faq`                | `answer`                                |
| `FaqGroup`           | `description`                           |
| `Product`            | `description`                           |

## Error Handling

Every method **throws a `CmsError`** when a request fails. The SDK does not log anything; handling and logging errors is up to your app.

- **Any non-2xx response throws**, a `404` for a missing item included. The single-item methods are typed `T | null`, but they only resolve to `null` for an empty (`204`) response.
- **Network errors throw** a `CmsError` with no `status`, after the retries described in [Request Options](#request-options-fetchoptions).
- **Paginated lists** resolve to a `PaginatedResponse` (`{ data, pagination }`), whose `data` may be empty. They never resolve to a bare array or `null`.
- **Feature gates** answer `403`: store methods when the site's store is off, and redirect methods when redirects are off.

Use `orNull()` from [Initialization](#2-initialization) where "not found" is a normal outcome. It turns `404` and `403` into `null` and rethrows everything else, so a real outage still reaches your error page instead of rendering an empty page:

```tsx
const blog = await orNull(cms.fetchBlogBySlug(SITE_ID, slug));
if (!blog) notFound();
```

### Custom Error Class

```typescript
import { CmsError } from "@crayonscodetech/cms-sdk";

try {
  await cms.placeOrder(SITE_ID, payload);
} catch (error) {
  if (error instanceof CmsError && error.status === 400) {
    // Validation message written by the CMS, safe to show the user
    console.warn(error.message);
  }
}
```

`CmsError` has `message` (the CMS's `message` field when the response had one), `status` (absent for network errors) and `url` (the full request URL, query string included, so avoid logging it where query strings may hold personal data).

## FAQ & Common Issues

This section addresses common questions and issues reported by developers.

### 1. Rendering Rich Text / "HTML Tags in Response" (#6)

Many CMS fields (like `description`, `content`, `vision`, `mission`) contain HTML markup. If you render them as plain text, you will see raw tags.

**Solution**: Render them through the `SafeHtml` component from [Rich Text / HTML Fields](#rich-text--html-fields), which sanitizes before rendering. Never pass a CMS field to `dangerouslySetInnerHTML` directly.

```tsx
import SafeHtml from "@/components/safe-html";

<SafeHtml html={blog.description} className="prose max-w-none" />;
```

### 2. Social Links as Raw URLs in Team Section (#8)

The `socials` field in `TeamMember` is an array of `{ platform?, url? }` objects, where `platform` is free text such as `"LinkedIn"`.

**Solution**: Render each one as a labelled link. The SDK has no icon component, and `lucide-react` no longer ships brand logos, so map platform names to your own brand SVGs if you want logos.

```tsx
import type { TeamMember } from "@crayonscodetech/cms-sdk";

export function SocialLinks({ socials }: { socials: TeamMember["socials"] }) {
  const links = (socials ?? []).filter((s) => s.url);
  if (links.length === 0) return null;

  return (
    <div className="flex gap-4">
      {links.map((social) => (
        <a key={social.url} href={social.url} target="_blank" rel="noopener noreferrer">
          {social.platform || "Link"}
        </a>
      ))}
    </div>
  );
}
```

### 3. How to Render the "About" Page Section (#7, #5)

The `about` section type in the CMS refers to global "About Us" data (mission, vision, values, stats). When this section appears in a page's `sections` array, it only contains small heading/subtitles. You must fetch the actual company data using `fetchAboutUs`.

**Solution**: Fetch the data within your `AboutSection` component.

```tsx
// components/sections/about.tsx
import { cms, orNull, SITE_ID } from "@/lib/cms";
import { CmsIcon } from "@/components/cms-icon"; // see "Icons" under Usage in Components
import SafeHtml from "@/components/safe-html";
import type { AboutSection as AboutSectionType } from "@crayonscodetech/cms-sdk";

export async function AboutSection({ content }: { content: AboutSectionType }) {
  const about = await orNull(cms.fetchAboutUs(SITE_ID));

  if (!about) return null;

  return (
    <section>
      {content.section_heading && <p>{content.section_heading}</p>}
      <h2>{content.title || "About Us"}</h2>

      <SafeHtml html={about.company_profile} />

      <h3>Our Values</h3>
      <div className="grid">
        {about.values.map((v, i) => (
          <div key={i}>
            {v.icon && <CmsIcon name={v.icon} />}
            <h4>{v.title}</h4>
            <p>{v.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

### 4. How to Navigate Between Pages (#3)

The `Page` object returns a `url` property. Use the Next.js `<Link>` component for navigation. CMS URLs are relative to the root.

**Solution**:

```tsx
import Link from "next/link";

// In your Header or Page
{
  pages.map((page) => (
    <Link key={page.id} href={page.url}>
      {page.title}
    </Link>
  ));
}
```

### 5. "How to see Types" (#4)

You can view all available types in `node_modules/@crayonscodetech/cms-sdk/dist/index.d.mts` (or `index.d.cts` for CommonJS). Alternatively, you can browse the source types in the GitHub repository's `src/types` folder.

**Solution**:

1.  **Console Logging**: Since these are Server Components, logs will appear in your **terminal**, not the browser console.
    ```ts
    const data = await cms.fetchBlogs(SITE_ID);
    console.log("DEBUG BLOGS:", JSON.stringify(data, null, 2));
    ```
2.  **Type Inspection**: Hover over any variable in VS Code to see its structure, or CMD+Click on the fetch method to jump to its declaration.

### 6. My Images are broken (#4)

If you see images in your data but they don't render with `<Image />`, you likely missed the `remotePatterns` config.

**Solution**: Ensure `next.config.ts` includes the CMS domain:

```ts
remotePatterns: [{ protocol: "https", hostname: "api.cms.deployown.com" }];
```

### 7. Environmental Variables not working

If `cms.fetch...` is failing with "Invalid URL", your `NEXT_PUBLIC_CMS_BASE_URL` might be missing or incorrectly formatted.

**Solution**:

- Ensure `.env.local` has `NEXT_PUBLIC_CMS_BASE_URL=https://api.cms.deployown.com` (no trailing slash).
- If calling from a **Client Component**, the variable _must_ start with `NEXT_PUBLIC_`.

### 8. Handling Empty States

Paginated lists resolve to `{ data, pagination }`, and `data` is an empty array when there is nothing to show. Errors are not turned into empty values: a failed request throws a `CmsError` (see [Error Handling](#error-handling)).

**Solution**: Check `data.length`, and use `orNull()` for single items.

```tsx
const { data: services } = await cms.fetchServices(SITE_ID);
if (services.length === 0) return <p>No services found.</p>;

const about = await orNull(cms.fetchAboutUs(SITE_ID));
if (!about) return null;
```

---

## Developer Tips

- **Site ID**: Always ensure your `SITE_ID` is valid, as most methods require it.
- **Async Components**: Always use `await` when calling SDK methods inside Server Components.
- **Section Variants**: All CMS sections have an optional `variant` field (e.g., `"home-1"`, `"about-2"`) for conditional styling. Check `section.variant` in your `RenderSections` component to render different visual styles of the same section type.
- **Section IDs**: Each section has an auto-generated `id` in format `{type}-{count}` (e.g., `"hero-1"`, `"cta-2"`). Use this for targeting specific sections when needed.

---

## Full Data Flow — How Everything Connects

This is the complete picture of how a page request travels through the system from the browser to the screen.

### Step 1 — Browser makes a request

A user visits any URL, e.g. `/services` or `/blog/my-post`. Next.js routes every request to the single catch-all file: `app/[[...slug]]/page.tsx`.

### Step 2 — Catch-all fetches the page by URL

The catch-all calls `fetchPageByUrl(siteId, urlPath)` for the current request path. Pages are fetched on-demand only when users navigate to them (SSR-friendly dynamic routing).

### Step 3 — URL is matched to a page

- **Exact match**: `fetchPageByUrl(siteId, urlPath)` returns a page (`/services`, `/blog`, `/news`, etc.).
- **Parent match**: if exact lookup fails, walk parent paths (`/blog/my-post` -> check `/blog`) and treat remaining segments as the entity slug.
- **No match**: `notFound()`.

### Step 4 — Page data is passed to the right component

Once a match is found, the catch-all looks up the correct page component from a registry (`PAGE_COMPONENT_MAP`) using `page_type`. It then renders that component, passing the matched `page` object plus route params/search params.

Detail pages (e.g. a single blog post) skip the `page` prop and receive `params` (containing the item slug) and `parentUrl` instead.

### Step 5 — Page component fetches its own entity data

The page component receives the `page` object which contains the **section chrome** (headings, subtitles, labels) for that page. It then calls its own API to get the actual content:

- `ServicesPage` calls `fetchServices(siteId)` to get the list of services.
- `BlogsPage` calls `fetchBlogs(siteId, { page, limit })` with pagination from `searchParams`.
- `EventsPage` calls `fetchEvents(siteId, { page, limit })`.
- `GalleryPage` calls `fetchAlbums(siteId)`.
- `AboutPage` calls `fetchAboutUs(siteId)` for mission, vision, values.
- `HomePage` and `CustomPage` can render directly from the fetched page object.

Detail pages (e.g. `BlogDetailPage`) should call slug-based fetches directly (e.g. `fetchBlogBySlug(siteId, slug)`).

### Step 6 — Sections are rendered

The page component passes `page.sections` to `RenderSections` (or `SectionRenderer`). This maps each section's `type` to its component:

- Sections like `hero`, `cta`, `custom`, `rich-content`, `multi-value`, and `about` render **inline** — all their content is already inside `section.content`, no extra fetch needed.
- Sections like `service`, `testimonial`, `team`, `faq`, `clients`, `gallery`, `event`, and `blog` only have heading/subtitle text in `section.content`. The section component fetches its own data (e.g. `TeamSection` calls `fetchTeamMembers`).

### Step 7 — HTML fields are sanitized and rendered

Some fields (`description`, `content`, `answer`, etc.) contain **HTML markup** from the CMS rich-text editor. Render them through `SafeHtml` (see [Rich Text / HTML Fields](#rich-text--html-fields)), which sanitizes them with a DOM-free sanitizer so it also works during server rendering on Workers. Fields that contain HTML are marked with a `// HTML (rich text)` comment in their type definitions.

### Step 8 — Layout wraps everything

The root `layout.tsx` runs on every request independently of the catch-all. It calls `fetchHeader`, `fetchFooter`, and `fetchSiteConfig` once and wraps the rendered page in the site's navigation and footer.

---

### Summary in one line per step

| Step | What happens                                                                             |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | Browser hits any URL → Next.js sends it to `[[...slug]]/page.tsx`                        |
| 2    | Catch-all calls `fetchPageByUrl` for the current URL path                                |
| 3    | URL is matched to a CMS page (exact) or its parent (detail)                              |
| 4    | Matched page data is passed to the right page component via a registry                   |
| 5    | Page component fetches its own entity data (services, blogs, events, etc.)               |
| 6    | `page.sections` is passed to `RenderSections`; data-driven sections fetch their own data |
| 7    | Rich-text HTML fields are sanitized (`SafeHtml`) before rendering                        |
| 8    | Root layout independently fetches header, footer, and site config                        |
