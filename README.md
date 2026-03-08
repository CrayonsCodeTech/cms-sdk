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
          <img src={siteConfig.logo.logo_primary} alt={siteConfig.site_name ?? "Logo"} />
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
{contact.phone_number.map((phone) => (
  <a key={phone} href={`tel:${phone}`}>{phone}</a>
))}

// Emails (array)
{contact.email.map((email) => (
  <a key={email} href={`mailto:${email}`}>{email}</a>
))}

// Social links
{contact.socials.map((social) => (
  <a key={social.site_name} href={social.link} target="_blank" rel="noopener noreferrer">
    {social.site_name}
  </a>
))}

// Location (optional)
{contact.location?.location.map((line) => (
  <p key={line}>{line}</p>
))}
{contact.location?.google_maps_url && (
  <a href={contact.location.google_maps_url} target="_blank" rel="noopener noreferrer">
    View on Map
  </a>
)}
```

> `siteConfig` can be `null` if the fetch fails, so always guard it at the layout level and pass it down only if it exists.

---

#### URL-Based Page Rendering

Use a Next.js catch-all route (`app/[[...slug]]/page.tsx`) to resolve any URL to its CMS page. The slug segments are joined into a path and passed to `fetchPageByUrl`, which returns `null` if no match — triggering a 404.

```tsx
// app/[[...slug]]/page.tsx
import { notFound } from "next/navigation";
import { cms, SITE_ID } from "@/lib/cms";
import { RenderSections } from "@/components/render-sections";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  // Join segments back into a path; "/" for the home page
  const urlPath = slug ? `/${slug.join("/")}` : "/";

  const page = await cms.fetchPageByUrl(SITE_ID, urlPath);

  if (!page) notFound();

  return <RenderSections sections={page.sections} />;
}

// Pre-render all published pages at build time
export async function generateStaticParams() {
  const pages = await cms.fetchPages(SITE_ID);

  return pages.map((page) => ({
    slug: page.url.replace(/^\//, "").split("/").filter(Boolean),
  }));
}
```

> Pages not returned by `generateStaticParams` fall back to on-demand rendering. If the CMS has no matching page, `fetchPageByUrl` returns `null` and `notFound()` renders the 404 page.

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
            return <ServiceSection key={section.id} content={section.content} />;
          case "testimonial":
            return <TestimonialSection key={section.id} content={section.content} />;
          case "multi-value":
            return <MultiValueSection key={section.id} content={section.content} />;
          case "team":
            return <TeamSection key={section.id} content={section.content} />;
          case "clients":
            return <ClientsSection key={section.id} content={section.content} />;
          case "gallery":
            return <GallerySection key={section.id} content={section.content} />;
          case "event":
            return <EventSection key={section.id} content={section.content} />;
          case "blog":
            return <BlogSection key={section.id} content={section.content} />;
          case "rich-content":
            return <RichContentSection key={section.id} content={section.content} />;
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

| Section type | Carries in `content` | Fetch for actual data |
|---|---|---|
| `service` | `section_heading`, `title`, `subtitle` | `fetchServices` |
| `testimonial` | `section_heading`, `title`, `subtitle`, `type` | `fetchTestimonials` |
| `team` | `section_heading`, `title`, `subtitle`, `team_category_id` | `fetchTeamMembers` |
| `faq` | `section_heading`, `title`, `subtitle`, `group_id` | `fetchFaqGroups` / `fetchFaqs` |
| `clients` | `section_heading`, `title`, `subtitle`, `brand_group_id` | *(brands API — use `brand_group_id`)* |
| `gallery` | `section_heading`, `title`, `subtitle`, `album_id` | `fetchAlbums` |
| `event` | `section_heading`, `title`, `subtitle` | `fetchEvents` |
| `blog` | `section_heading`, `title`, `subtitle` | `fetchBlogs` |

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
                {member.socials.map((s) => s.url && (
                  <li key={s.platform}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.platform}
                    </a>
                  </li>
                ))}
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

  const faqs = targetGroup
    ? targetGroup.faqs
    : await cms.fetchFaqs(SITE_ID);

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

### Home Page — Section Rendering with Targeting

The home page is a CMS-managed page (`page_type: "home"`). It uses `RenderSections` to render its sections in order. However, because the home page often needs precise control over layout (e.g. placing a specific section above the fold, or inserting non-CMS UI between sections), you can target sections by **type + index** or by **section id** instead of blindly rendering all sections in sequence.

**Option A — target by section type and index:**

```tsx
// app/page.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { HeroSection } from "@/components/sections/hero";
import { RenderSections } from "@/components/render-sections";

export default async function HomePage() {
  const page = await cms.fetchPageByUrl(SITE_ID, "/");
  if (!page) notFound();

  const { sections } = page;

  // Pull specific sections out by type for precise placement
  const heroSections = sections.filter((s) => s.type === "hero");
  const remainingSections = sections.filter((s) => s.type !== "hero");

  return (
    <>
      {/* Render the first hero section at the top of the page */}
      {heroSections[0] && (
        <HeroSection content={heroSections[0].content} />
      )}

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

### Services Page — Fetch & Render Service Data

The `service` section type on a page provides only CMS-controlled **headings and labels** (e.g. `section_heading`, `title`, `subtitle`). The actual list of services must be fetched separately with `fetchServices`.

```tsx
// app/services/page.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import { ServiceCard } from "@/components/service-card";

export default async function ServicesPage() {
  const [page, services] = await Promise.all([
    cms.fetchPageByUrl(SITE_ID, "/services"),
    cms.fetchServices(SITE_ID),
  ]);

  if (!page) notFound();

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
// app/services/[slug]/page.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
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
// app/blog/page.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function BlogPage() {
  const [page, { data: blogs }] = await Promise.all([
    cms.fetchPageByUrl(SITE_ID, "/blog"),
    cms.fetchBlogs(SITE_ID, { page: 1, limit: 12 }),
  ]);

  if (!page) notFound();

  const blogSection = page.sections.find((s) => s.type === "blog");

  return (
    <>
      {blogSection && <h1>{blogSection.content.title}</h1>}

      <div className="grid">
        {blogs.map((blog) => (
          <Link key={blog.id} href={`/blog/${blog.slug}`}>
            {blog.image_url && <img src={blog.image_url} alt={blog.image_alt ?? blog.title} />}
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
const { data: results } = await cms.fetchBlogs(SITE_ID, { search: searchQuery });

// Category filtering — fetch categories then filter client-side, or show per-category pages
const categories = await cms.fetchCategories(SITE_ID);

// Blogs don't have a direct category_id param — fetch categories for display,
// then use them as navigation labels linking to filtered URLs
```

**Blog detail page:**

```tsx
// app/blog/[slug]/page.tsx
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
      {full.image_url && <img src={full.image_url} alt={full.image_alt ?? full.title} />}
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
// app/events/page.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EventsPage() {
  const [page, { data: events }] = await Promise.all([
    cms.fetchPageByUrl(SITE_ID, "/events"),
    cms.fetchEvents(SITE_ID, { page: 1, limit: 12 }),
  ]);

  if (!page) notFound();

  return (
    <div>
      {events.map((event) => (
        <Link key={event.id} href={`/events/${event.slug}`}>
          {event.image_url && <img src={event.image_url} alt={event.image_alt ?? event.title} />}
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
// app/events/[slug]/page.tsx
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
      {event.image_url && <img src={event.image_url} alt={event.image_alt ?? event.title} />}
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
// app/gallery/page.tsx
import { cms, SITE_ID } from "@/lib/cms";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function GalleryPage() {
  const [page, { data: albums }] = await Promise.all([
    cms.fetchPageByUrl(SITE_ID, "/gallery"),
    cms.fetchAlbums(SITE_ID),
  ]);

  if (!page) notFound();

  return (
    <div className="grid">
      {albums.map((album) => (
        <Link key={album.id} href={`/gallery/${album.slug}`}>
          {album.cover_image_url && (
            <img src={album.cover_image_url} alt={album.cover_image_alt ?? album.title} />
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
// app/gallery/[slug]/page.tsx
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
// app/contact/page.tsx  (server component — renders the form shell)
import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
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
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const payload: ContactPayload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
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
    title: blog.seo_title ? `${blog.seo_title} | ${siteName}` : `${blog.title} | ${siteName}`,
    description: blog.seo_description ?? blog.excerpt ?? undefined,
    openGraph: {
      title: blog.seo_title ?? blog.title,
      description: blog.seo_description ?? blog.excerpt ?? undefined,
      images: blog.seo_image ? [{ url: blog.seo_image }] : blog.image_url ? [{ url: blog.image_url }] : undefined,
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

Below is the folder layout that maps cleanly to how this SDK is used:

```
app/
├── layout.tsx                  # Root layout — fetches header, footer, siteConfig
├── page.tsx                    # Home page — fetchPageByUrl("/")
├── [[...slug]]/
│   └── page.tsx                # Catch-all for CMS custom pages
├── blog/
│   ├── page.tsx                # Blog listing — fetchBlogs
│   └── [slug]/page.tsx         # Blog detail — fetchBlogById
├── services/
│   ├── page.tsx                # Services listing — fetchServices
│   └── [slug]/page.tsx         # Service detail
├── events/
│   ├── page.tsx                # Events listing — fetchEvents
│   └── [slug]/page.tsx         # Event detail
├── gallery/
│   ├── page.tsx                # Albums listing — fetchAlbums
│   └── [slug]/page.tsx         # Album detail
└── contact/
    └── page.tsx                # Contact form — submitContactForm (no sections)

components/
├── site-header.tsx             # Renders Header + SiteConfig (nav, CTAs, logo)
├── site-footer.tsx             # Renders Footer + SiteConfig (nav groups, contact, socials)
├── render-sections.tsx         # Maps Section[] → section components
├── contact-form.tsx            # Client component — POSTs to /api/contact
└── sections/
    ├── hero.tsx
    ├── custom.tsx
    ├── cta.tsx
    ├── service.tsx             # Fetches fetchServices internally
    ├── testimonial.tsx         # Fetches fetchTestimonials internally
    ├── team.tsx                # Fetches fetchTeamMembers internally
    ├── faq.tsx                 # Fetches fetchFaqGroups internally
    ├── clients.tsx             # Fetches brands internally
    ├── gallery.tsx             # Fetches fetchAlbums internally
    ├── event.tsx               # Fetches fetchEvents internally
    ├── blog.tsx                # Fetches fetchBlogs internally
    ├── rich-content.tsx
    ├── about.tsx
    └── multi-value.tsx

lib/
└── cms.ts                      # Singleton CMS client + SITE_ID export

api/
└── contact/
    └── route.ts                # Server route — calls submitContactForm
```

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
- `fetchTeamMembers(siteId, options?)`: Returns all team members.
- `fetchTestimonials(siteId, params?, options?)`: Returns testimonials. Params: `{ type: 'testimonial' | 'review' }`.
- `fetchEvents(siteId, params?, options?)`: Returns paginated events.
- `fetchAlbums(siteId, params?, options?)`: Returns paginated albums.

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

## Developer Tips

- **Site ID**: Always ensure your `SITE_ID` is valid, as most methods require it.
