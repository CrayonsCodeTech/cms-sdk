# @crayons/cms-sdk

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

## Installation

You can install the SDK directly from private GitHub repository. Ensure you have access before proceeding.

```bash
npm install git+ssh://git@github.com/CrayonsCodeTech/cms-sdk.git
# or
pnpm add git+ssh://git@github.com/CrayonsCodeTech/cms-sdk.git --allow-build=@crayons/cms-sdk
# or
bun add git+ssh://git@github.com/CrayonsCodeTech/cms-sdk.git && bun pm trust @crayons/cms-sdk
```

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
import { createCmsClient } from "@crayons/cms-sdk";

export const cms = createCmsClient({
  baseUrl: process.env.NEXT_PUBLIC_CMS_BASE_URL || "https://api.example.com",
  defaultOptions: {
    revalidate: 3600, // Default 1 hour cache
  },
});

export const SITE_ID = process.env.NEXT_PUBLIC_CMS_SITE_ID || "";
```

### 3. Usage in Components

#### Conditional Rendering — Header & Footer Inner Data

`fetchHeader` and `fetchFooter` return `null` on failure. Inside your components, guard each field individually since arrays may be empty and optional fields may be absent.

**SiteHeader example:**

```tsx
// components/site-header.tsx
import type { Header, SiteConfig } from "@crayons/cms-sdk";
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
import type { Footer } from "@crayons/cms-sdk";
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

> `siteConfig` can be `null` if the fetch fails, so always guard it at the layout level and pass it down only if it exists.

#### 4. Icon Component (Lucide)

The SDK provides a built-in `Icon` component to render CMS-driven icons. It uses `lucide-react` under the hood.

```tsx
import { Icon } from "@crayons/cms-sdk";

export function FeatureItem({
  iconName,
  title,
}: {
  iconName: string;
  title: string;
}) {
  return (
    <div>
      {/* Renders the Lucide icon by name, falling back to HelpCircle if not found */}
      <Icon name={iconName} size={24} className="text-primary" />
      <h3>{title}</h3>
    </div>
  );
}
```

> **Requirements**: To use the `Icon` component, you must have `lucide-react` and `react` installed in your project.

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
import { cms, SITE_ID } from "./cms";

export async function resolveCmsRoute(slug: string[]) {
  const urlPath = slug.length > 0 ? `/${slug.join("/")}` : "/";
  const pages = await cms.fetchPages(SITE_ID);

  // 1. Check for exact match
  const exactPage = pages.find((p) => {
    const norm = (u: string) => "/" + u.replace(/^\/|\/$/g, "");
    return norm(p.url) === norm(urlPath);
  });

  if (exactPage) return { type: "page" as const, data: exactPage };

  // 2. Check for detail page (walking up the path)
  if (slug.length > 0) {
    for (let i = slug.length - 1; i >= 0; i--) {
      const parentPath = "/" + slug.slice(0, i).join("/");
      const parentPage = pages.find((p) => p.url === parentPath);

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

```tsx
// components/render-sections.tsx
import type { Section } from "@crayons/cms-sdk";
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

export function RenderSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <HeroSection key={section.id} content={section.content} />;
          case "custom":
            return <CustomSection key={section.id} content={section.content} />;
          case "cta":
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
          default:
            console.warn(`Unknown section type: ${(section as any).type}`);
            return null;
        }
      })}
    </>
  );
}
```

#### Data-Driven Section Components

Several section types only carry **display text** (headings, subtitles) in `section.content`. The actual entity data must be fetched separately and passed into the section component. This is the same pattern as services, blogs, and events — just applied inside individual section components.

| Section name     | `type` discriminant | Content type          | Primary table/entity          | API call(s) needed                                                                          |
| ---------------- | ------------------- | --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Hero             | `"hero"`            | `HeroContent[]`       | `page.sections` (from `page`) | None — content is inline                                                                    |
| Custom           | `"custom"`          | `CustomContent`       | `page.sections` (from `page`) | None — content is inline                                                                    |
| Call to Action   | `"cta"`             | `CTAContent`          | `page.sections` (from `page`) | None — content is inline                                                                    |
| Rich Content     | `"rich-content"`    | `RichContentSection`  | `page.sections` (from `page`) | None — content is inline                                                                    |
| About            | `"about"`           | `AboutSection`        | `page.sections` + `about-us`  | `fetchAboutUs(siteId)` for profile/vision/mission/stats                                     |
| Multi Value      | `"multi-value"`     | `MultiValueSection`   | `page.sections` (from `page`) | None — content is inline                                                                    |
| Services         | `"service"`         | `ServicesSection`     | `services`                    | `fetchServices(siteId)`                                                                     |
| Testimonials     | `"testimonial"`     | `TestimonialsSection` | `testimonials`                | `fetchTestimonials(siteId, { type })` — use `content.type` to filter                        |
| Team             | `"team"`            | `TeamSection`         | `team-members`                | `fetchTeamMembers(siteId)` / `fetchTeamMembersByCategory(siteId, content.team_category_id)` |
| FAQ              | `"faq"`             | `FaqSection`          | `faq-groups` + `faqs`         | `fetchFaqGroups(siteId)` or `fetchFaqs(siteId, { group_id: content.group_id })`             |
| Clients / Brands | `"clients"`         | `ClientsSection`      | `brand-groups` + `brands`     | `fetchBrandGroups(siteId)` + `fetchBrands(siteId, { group_id: content.brand_group_id })`    |
| Gallery          | `"gallery"`         | `GallerySection`      | `albums` + `album-items`      | `fetchAlbums(siteId)` + `fetchAlbumItems(siteId, { album_id })` as needed                   |
| Events           | `"event"`           | `GenericSection`      | `events`                      | `fetchEvents(siteId, { page, limit, search })`                                              |
| Blog             | `"blog"`            | `GenericSection`      | `blog`                        | `fetchBlogs(siteId, { page, limit, search })`                                               |

**How to handle this in section components:**

Each section component receives its own `content` prop from `RenderSections`. When it needs live entity data, it fetches it itself using the ID or type from `content`.

```tsx
// components/sections/testimonial.tsx
import { cms, SITE_ID } from "@/lib/cms";
import type { TestimonialsSection } from "@crayons/cms-sdk";

interface Props {
  content: TestimonialsSection;
}

export async function TestimonialSection({ content }: Props) {
  // content.type is "testimonial" | "review" — use it to filter
  const testimonials = await cms.fetchTestimonials(SITE_ID, {
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
import type { TeamSection } from "@crayons/cms-sdk";

export async function TeamSection({ content }: { content: TeamSection }) {
  const members = await cms.fetchTeamMembers(SITE_ID);

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
import type { FaqSection } from "@crayons/cms-sdk";

export async function FaqSection({ content }: { content: FaqSection }) {
  // Fetch the specific group if a group_id is set, otherwise fetch all
  const groups = content.group_id
    ? await cms.fetchFaqGroups(SITE_ID)
    : await cms.fetchFaqGroups(SITE_ID);

  const targetGroup = content.group_id
    ? groups.find((g) => g.id === content.group_id)
    : null;

  const faqs = targetGroup ? targetGroup.faqs : await cms.fetchFaqs(SITE_ID);

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

| Route                   | Primary tables/entities           | Required fetch call(s)                                                         |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| `/` (home)              | `page` (+ inline `page.sections`) | `fetchPageByUrl(siteId, "/")`                                                  |
| `[[...slug]]` CMS pages | `page` (+ inline `page.sections`) | `fetchPageByUrl(siteId, urlPath)`                                              |
| `/about`                | `page` + `about-us`               | `fetchPageByUrl(siteId, "/about")` + `fetchAboutUs(siteId)`                    |
| `/services`             | `page` + `services`               | `fetchPageByUrl(siteId, "/services")` + `fetchServices(siteId)`                |
| `/services/[slug]`      | `services`                        | `fetchServices(siteId)` (slug lookup) or `fetchServiceById(siteId, id)`        |
| `/blog`                 | `page` + `blog`                   | `fetchPageByUrl(siteId, "/blog")` + `fetchBlogs(siteId, params)`               |
| `/blog/[slug]`          | `blog`                            | `fetchBlogs(siteId, { limit })` (slug lookup) + `fetchBlogById(siteId, id)`    |
| `/events`               | `page` + `events`                 | `fetchPageByUrl(siteId, "/events")` + `fetchEvents(siteId, params)`            |
| `/events/[slug]`        | `events`                          | `fetchEvents(siteId, { limit })` (slug lookup) or `fetchEventById(siteId, id)` |
| `/gallery`              | `page` + `albums`                 | `fetchPageByUrl(siteId, "/gallery")` + `fetchAlbums(siteId, params)`           |
| `/gallery/[slug]`       | `albums` + `album-items`          | `fetchAlbums(siteId, { limit })` + `fetchAlbumItems(siteId, { album: slug })`  |
| `/team/[slug]`          | `team-members`                    | `fetchTeamMembers(siteId)` (slug lookup) or custom `fetch`                     |
| `/contact`              | `contact` (form submissions)      | `submitContactForm(siteId, payload)`                                           |

### Home Page — Section Rendering with Targeting

The home page is a CMS-managed page (`page_type: "home"`). It uses `RenderSections` to render its sections in order. However, because the home page often needs precise control over layout (e.g. placing a specific section above the fold, or inserting non-CMS UI between sections), you can target sections by **type + index** or by **section id** instead of blindly rendering all sections in sequence.

**Option A — target by section type and index:**

```tsx
// components/pages/HomePage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { HeroSection } from "@/components/sections/hero";
import { RenderSections } from "@/components/render-sections";
import type { Page } from "@crayons/cms-sdk";

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
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import SafeHtml from "@/components/safe-html";
import type { Page, SiteConfig } from "@crayons/cms-sdk";

export default async function AboutPage({
  page,
  site,
}: {
  page: Page;
  site?: SiteConfig | null;
}) {
  const about = await cms.fetchAboutUs(SITE_ID);
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
import type { Page } from "@crayons/cms-sdk";

export default async function ServicesPage({ page }: { page: Page }) {
  const services = await cms.fetchServices(SITE_ID);

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
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";

export default async function ServiceDetailPage({
  params,
  parentUrl,
}: {
  params: Promise<{ slug: string }>;
  parentUrl?: string;
}) {
  const { slug } = await params;
  const services = await cms.fetchServices(SITE_ID);
  const service = services.find((s) => s.slug === slug);

  if (!service) notFound();

  return (
    <article>
      {service.image_url && (
        <img src={service.image_url} alt={service.image_alt} />
      )}
      <h1>{service.title}</h1>
      <p>{service.short_description}</p>
      <div dangerouslySetInnerHTML={{ __html: service.description }} />
      {service.features.length > 0 && (
        <ul>
          {service.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
```

---

### Blog Page — Listing & Detail

The `blog` section type carries heading/subtitle text only. Fetch the actual posts with `fetchBlogs`.

**Listing page:**

```tsx
// components/pages/BlogPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Page } from "@crayons/cms-sdk";

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
const categories = await cms.fetchCategories(SITE_ID);

// Blogs don't have a direct category_id param — fetch categories for display,
// then use them as navigation labels linking to filtered URLs
```

**Blog detail page:**

```tsx
// components/pages/BlogDetailPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // fetchBlogById accepts the numeric id — fetch the list to resolve the slug first
  const { data: blogs } = await cms.fetchBlogs(SITE_ID, { limit: 1000 });
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) notFound();

  const full = await cms.fetchBlogById(SITE_ID, blog.id);
  if (!full) notFound();

  return (
    <article>
      {full.image_url && (
        <img src={full.image_url} alt={full.image_alt ?? full.title} />
      )}
      <h1>{full.title}</h1>
      <p>By {full.author}</p>
      {full.description && (
        <div dangerouslySetInnerHTML={{ __html: full.description }} />
      )}
    </article>
  );
}
```

---

### Events Page — Listing & Detail

Same pattern as blogs. The `event` section carries display text; actual event data comes from `fetchEvents`.

**Listing page:**

```tsx
// components/pages/EventPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Page, SiteConfig } from "@crayons/cms-sdk";

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
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: events } = await cms.fetchEvents(SITE_ID, { limit: 1000 });
  const event = events.find((e) => e.slug === slug);

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
      {event.description && (
        <div dangerouslySetInnerHTML={{ __html: event.description }} />
      )}
    </article>
  );
}
```

---

### Gallery Page — Albums & Photos

The `gallery` section carries the `album_id` to display. Fetch albums with `fetchAlbums`; each album includes its `items` (photos).

```tsx
// components/pages/GalleryPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Page } from "@crayons/cms-sdk";

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
          {album.description && <p>{album.description}</p>}
        </Link>
      ))}
    </div>
  );
}
```

**Album detail page:**

```tsx
// components/pages/GalleryDetailPage.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: albums } = await cms.fetchAlbums(SITE_ID);
  const album = albums.find((a) => a.slug === slug);

  if (!album) notFound();

  return (
    <div>
      <h1>{album.title}</h1>
      {album.description && <p>{album.description}</p>}

      <div className="grid">
        {album.items?.map((item) => (
          <figure key={item.id}>
            <img src={item.image_url} alt={item.image_alt ?? ""} />
            {item.caption && <figcaption>{item.caption}</figcaption>}
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

```tsx
// components/pages/ContactPage.tsx
import { ContactForm } from "@/components/contact-form";
import type { Page, SiteConfig } from "@crayons/cms-sdk";

export default function ContactPage({
  page,
  site,
}: {
  page: Page;
  site?: SiteConfig | null;
}) {
  return (
    <main>
      <h1>Contact Us</h1>
      <ContactForm />
    </main>
  );
}
```

```tsx
// components/contact-form.tsx  (client component — handles submission)
"use client";

import { useState } from "react";
import type { ContactPayload } from "@crayons/cms-sdk";

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const payload: ContactPayload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
      type: "contact",
    };

    try {
      // submitContactForm is called from a server action or API route to keep SITE_ID server-side
      const res = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" />
      <input name="subject" placeholder="Subject" />
      <textarea name="message" placeholder="Message" required />
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {status === "success" && <p>Message sent!</p>}
      {status === "error" && <p>Something went wrong. Please try again.</p>}
    </form>
  );
}
```

```ts
// app/api/contact/route.ts  (server — keeps SITE_ID out of the client bundle)
import { cms, SITE_ID } from "@/lib/cms";
import type { ContactPayload } from "@crayons/cms-sdk";

export async function POST(req: Request) {
  const payload: ContactPayload = await req.json();
  const result = await cms.submitContactForm(SITE_ID, payload);
  return Response.json(result);
}
```

> `SITE_ID` is kept server-side. Never call `submitContactForm` directly from a client component.

---

## SEO & Metadata

Every `Page` returned by `fetchPageByUrl` or `fetchPages` includes an `seo` field (`SEO | null`) with `title`, `description`, `tags`, and `image`. Use Next.js `generateMetadata` to apply this per page, falling back to the site-wide defaults from `SiteConfig`.

```tsx
// app/[[...slug]]/page.tsx
import type { Metadata } from "next";
import { cms, SITE_ID } from "@/lib/cms";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const urlPath = slug ? `/${slug.join("/")}` : "/";

  const [page, siteConfig] = await Promise.all([
    cms.fetchPageByUrl(SITE_ID, urlPath),
    cms.fetchSiteConfig(SITE_ID),
  ]);

  const siteName = siteConfig?.site_name ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

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
      url: `${baseUrl}${urlPath}`,
      siteName,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteName,
      description: description ?? undefined,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: `${baseUrl}${urlPath}`,
    },
  };
}
```

For dedicated pages (blog detail, service detail, etc.) the pattern is the same — use the entity's own SEO fields:

```tsx
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: blogs } = await cms.fetchBlogs(SITE_ID, { limit: 1000 });
  const blog = blogs.find((b) => b.slug === slug);
  const siteConfig = await cms.fetchSiteConfig(SITE_ID);
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
│   └── page.tsx                # Catch-all handles EVERYTHING
├── layout.tsx                  # Root layout — fetches header, footer, siteConfig
├── api/
│   └── contact/
│       └── route.ts            # Server route for form submission
components/
├── pages/                      # Registry-mapped page layouts
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
│   ├── ProductsPage.tsx
│   ├── ProductDetailPage.tsx
│   ├── ContactPage.tsx
│   └── CustomPage.tsx
├── sections/                   # Individual Section components
│   ├── hero.tsx
│   ├── custom.tsx
│   ├── cta.tsx
│   ├── service.tsx             # Fetches fetchServices internally
│   ├── testimonial.tsx         # Fetches fetchTestimonials internally
│   ├── team.tsx                # Fetches fetchTeamMembers internally
│   ├── faq.tsx                 # Fetches fetchFaqGroups internally
│   ├── clients.tsx             # Fetches brands internally
│   ├── gallery.tsx             # Fetches fetchAlbums internally
│   ├── event.tsx               # Fetches fetchEvents internally
│   ├── blog.tsx                # Fetches fetchBlogs internally
│   ├── rich-content.tsx
│   ├── about.tsx               # Fetches fetchAboutUs internally
│   ├── multi-value.tsx
│   └── contact-form.tsx        # Client component (form only)
└── render-sections.tsx         # The section dispatcher
lib/
├── cms.ts                      # Client initialization (singleton)
├── cms-registry.ts             # Component mapping (PAGE_COMPONENT_MAP)
└── cms-router.ts               # Route resolution logic (resolveCmsRoute)
```

> **Note**: This structure eliminates the need for hardcoded folders for `/blog`, `/services`, etc.

> All `sections/` components that need live data are **async server components**. The `contact-form.tsx` is the only client component (`"use client"`).

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
    totalPages: number;
  };
}
```

### Caching (Next.js)

All fetch methods accept `FetchOptions`:

```typescript
export interface FetchOptions extends RequestInit {
  revalidate?: number; // Seconds to cache
  tags?: string[]; // Cache tags for on-demand revalidation
}
```

## API Reference

### Global Configuration

- `fetchHeader(siteId, options?)`: Fetches the site header navigation and CTAs.
- `fetchFooter(siteId, options?)`: Fetches the site footer configuration.
- `fetchSiteConfig(siteId, options?)`: Fetches site-wide settings (logo, name, etc.).

### Pages

- `fetchPages(siteId, options?)`: Returns all pages for a site.
- `fetchPageByUrl(siteId, urlPath, options?)`: Finds a specific page by its URL path.

### Blogs & Categories

- `fetchBlogs(siteId, params?, options?)`: Returns paginated blogs. Params: `{ page, limit, search }`.
- `fetchBlogById(siteId, id, options?)`: Returns a single blog post.
- `fetchCategories(siteId, options?)`: Returns all blog categories.

### Other Entities

- `fetchServices(siteId, options?)`: Returns all services.
- `fetchServiceById(siteId, id, options?)`: Returns a single service by ID.
- `fetchTeamMembers(siteId, options?)`: Returns all team members.
- `fetchTeamMembersByCategory(siteId, categoryId, options?)`: Returns team members filtered by category.
- `fetchTestimonials(siteId, params?, options?)`: Returns testimonials. Params: `{ type: 'testimonial' | 'review' }`.
- `fetchEvents(siteId, params?, options?)`: Returns paginated events.
- `fetchEventById(siteId, id, options?)`: Returns a single event by ID.
- `fetchAlbums(siteId, params?, options?)`: Returns paginated albums.
- `fetchAlbumItems(siteId, params, options?)`: Returns items for an album. Params: `{ album, album_id }`.

### FAQ & Help

- `fetchFaqGroups(siteId, options?)`: Returns FAQ groups with their nested FAQs.
- `fetchFaqs(siteId, params?, options?)`: Returns flat list of FAQs. Params: `{ group_id }`.

### Forms & Submissions

- `submitContactForm(siteId, payload, options?)`: Submits a contact form.
  - **Payload Structure**:
    ```typescript
    {
      name: string;      // Required
      message: string;   // Required
      email?: string;    // Optional
      subject?: string;  // Optional
      type?: string;     // Default: "contact"
    }
    ```

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
} from "@crayons/cms-sdk";
```

### Browsing All Types After Installation

After installing the package, the source files are not included. All exported types are compiled into a single declaration file:

```
node_modules/@crayons/cms-sdk/dist/index.d.ts
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

Several fields in the type definitions contain **HTML markup** produced by the CMS rich-text editor. These fields must be rendered with `dangerouslySetInnerHTML` (or a sanitizer such as DOMPurify) — never as plain text.

Each such field is annotated with `@remarks Rendered as HTML` in its type definition. Hover over the field in your IDE to see the annotation, or browse the source on GitHub (link above).

**Fields that contain HTML:**

| Type                 | Field          | Notes                              |
| -------------------- | -------------- | ---------------------------------- |
| `HeroContent`        | `description`  | Hero slide body copy               |
| `CustomContent`      | `card_content` | Main body of a custom card         |
| `CustomContent`      | `subtitle`     | Secondary copy line (optional)     |
| `CTAContent`         | `description`  | CTA section body copy              |
| `MultiValueSection`  | `description`  | Section-level intro text           |
| `MultiValueItem`     | `description`  | Per-item description               |
| `RichContentSection` | `content`      | Full rich-text article body        |
| `Faq`                | `answer`       | FAQ answer (supports lists, links) |
| `Blog`               | `description`  | Full blog post body                |
| `Service`            | `description`  | Full service detail body           |
| `Event`              | `description`  | Full event detail body             |

## Error Handling

The SDK is designed to be "fail-safe" for UI components:

- **Single Assets**: Return `null` on failure.
- **Lists**: Return `[]` (empty array) on failure.
- **Paginated Lists**: Return an empty `PaginatedResponse` structure.

Specific errors are logged to the console with the URL and status code. Transient server errors (502, 503, 504) are automatically retried up to 2 times with exponential backoff.

### Custom Error Class

```typescript
import { CmsError } from "@crayons/cms-sdk";
```

The `CmsError` class provides `status` and `url` properties for debugging.

## FAQ & Common Issues

This section addresses common questions and issues reported by developers.

### 1. Rendering Rich Text / "HTML Tags in Response" (#6)

Many CMS fields (like `description`, `content`, `vision`, `mission`) contain HTML markup. If you render them as plain text, you will see raw tags.

**Solution**: Use `dangerouslySetInnerHTML`.

```tsx
// Simple rendering
<div
  dangerouslySetInnerHTML={{ __html: blog.description }}
  className="prose max-w-none"
/>;

// Recommended with Sanitization
import DOMPurify from "isomorphic-dompurify";

export function RichText({ content }: { content: string }) {
  const cleanHtml = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
```

### 2. Social Links as Raw URLs in Team Section (#8)

The `socials` field in `TeamMember` returns an array of objects.

**Solution**: Use the built-in `Icon` component to map platforms to icons.

```tsx
import { Icon } from "@crayons/cms-sdk";

export function SocialLinks({ socials }: { socials: TeamMember["socials"] }) {
  if (!socials) return null;

  return (
    <div className="flex gap-4">
      {socials.map((social, i) => (
        <a key={i} href={social.url} target="_blank" rel="noopener noreferrer">
          {/* Automatically handles "Facebook", "Twitter", "Linkedin", etc. */}
          <Icon name={social.platform || "Link"} size={20} />
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
import { cms, SITE_ID } from "@/lib/cms";
import { Icon } from "@crayons/cms-sdk";
import type { AboutSection as AboutSectionType } from "@crayons/cms-sdk";

export async function AboutSection({ content }: { content: AboutSectionType }) {
  const about = await cms.fetchAboutUs(SITE_ID);

  if (!about) return null;

  return (
    <section>
      <h2>{content.title || "About Us"}</h2>
      {content.subtitle && <p>{content.subtitle}</p>}

      <div dangerouslySetInnerHTML={{ __html: about.company_profile }} />

      <h3>Our Values</h3>
      <div className="grid">
        {about.values.map((v, i) => (
          <div key={i}>
            <Icon name={v.icon} />
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
    <Link key={page.id} href={page.url === "/" ? "/" : `/${page.url}`}>
      {page.title}
    </Link>
  ));
}
```

### 5. "How to see Types" (#4)

You can view all available types by looking at the `index.d.ts` file in `node_modules/@crayons/cms-sdk/dist/index.d.ts`. Alternatively, you can browse the source types in the GitHub repository's `src/types` folder.

**Solution**:

1.  **Console Logging**: Since these are Server Components, logs will appear in your **terminal**, not the browser console.
    ```ts
    const data = await fetchBlogs(siteId);
    console.log("DEBUG BLOGS:", JSON.stringify(data, null, 2));
    ```
2.  **Type Inspection**: Hover over any variable in VS Code to see its structure, or CMD+Click on the fetch method to jump to the `index.d.ts` definition.

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

The SDK returns `[]` for lists and `null` for single objects if data is missing or an error occurs.

**Solution**: Always guard your components.

```tsx
const services = await cms.fetchServices(SITE_ID);
if (!services || services.length === 0) return <p>No services found.</p>;
```

---

## Developer Tips

- **Site ID**: Always ensure your `SITE_ID` is valid, as most methods require it.
- **Async Components**: Always use `await` when calling SDK methods inside Server Components.

---

## Full Data Flow — How Everything Connects

This is the complete picture of how a page request travels through the system from the browser to the screen.

### Step 1 — Browser makes a request

A user visits any URL, e.g. `/services` or `/blog/my-post`. Next.js routes every request to the single catch-all file: `app/[[...slug]]/page.tsx`.

### Step 2 — Catch-all fetches the pages list

The first thing the catch-all does is call `fetchPages(siteId)`. This returns every page that exists in the CMS — each page has a `url` (e.g. `/services`) and a `page_type` (e.g. `"services"`). The catch-all uses this list to figure out what to render.

### Step 3 — URL is matched to a page

The catch-all compares the incoming URL against the pages list:

- **Exact match** (`/services` → finds the `services` page) → this is a listing page.
- **Parent match** (`/services/web-design` → parent `/services` found) → this is a detail page.
- **No match** → `notFound()`.

### Step 4 — Page data is passed to the right component

Once a match is found, the catch-all looks up the correct page component from a registry (`PAGE_COMPONENT_MAP`) using `page_type`. It then renders that component, passing the matched `page` object along with `params`, `searchParams`, and `allPages` so the component has everything it might need.

Detail pages (e.g. a single blog post) skip the `page` prop and receive `params` (containing the item slug) and `parentUrl` instead.

### Step 5 — Page component fetches its own entity data

The page component receives the `page` object which contains the **section chrome** (headings, subtitles, labels) for that page. It then calls its own API to get the actual content:

- `ServicesPage` calls `fetchServices(siteId)` to get the list of services.
- `BlogsPage` calls `fetchBlogs(siteId, { page, limit })` with pagination from `searchParams`.
- `EventsPage` calls `fetchEvents(siteId, { page, limit })`.
- `GalleryPage` calls `fetchAlbums(siteId)`.
- `AboutPage` calls `fetchAboutUs(siteId)` for mission, vision, values.
- `HomePage` and `CustomPage` skip their own fetch — they already have `allPages` and just find their page from it.

Detail pages (e.g. `BlogDetailPage`) fetch the full list, find the matching item by slug, then call the single-item fetch (e.g. `fetchBlogById`) to get the complete data.

### Step 6 — Sections are rendered

The page component passes `page.sections` to `RenderSections` (or `SectionRenderer`). This maps each section's `type` to its component:

- Sections like `hero`, `cta`, `custom`, `rich-content`, `multi-value`, and `about` render **inline** — all their content is already inside `section.content`, no extra fetch needed.
- Sections like `service`, `testimonial`, `team`, `faq`, `clients`, `gallery`, `event`, and `blog` only have heading/subtitle text in `section.content`. The section component fetches its own data (e.g. `TeamSection` calls `fetchTeamMembers`).

### Step 7 — HTML fields are sanitized and rendered

Some fields (`description`, `content`, `answer`, etc.) contain **HTML markup** from the CMS rich-text editor. These must be passed to `dangerouslySetInnerHTML` — always sanitize them with DOMPurify first. Fields that contain HTML are marked with a comment in their type definitions.

### Step 8 — Layout wraps everything

The root `layout.tsx` runs on every request independently of the catch-all. It calls `fetchHeader`, `fetchFooter`, and `fetchSiteConfig` once and wraps the rendered page in the site's navigation and footer.

---

### Summary in one line per step

| Step | What happens |
|------|-------------|
| 1 | Browser hits any URL → Next.js sends it to `[[...slug]]/page.tsx` |
| 2 | Catch-all fetches the full pages list from the CMS |
| 3 | URL is matched to a CMS page (exact) or its parent (detail) |
| 4 | Matched page data is passed to the right page component via a registry |
| 5 | Page component fetches its own entity data (services, blogs, events, etc.) |
| 6 | `page.sections` is passed to `RenderSections`; data-driven sections fetch their own data |
| 7 | Rich-text HTML fields are sanitized (DOMPurify) before rendering |
| 8 | Root layout independently fetches header, footer, and site config |
