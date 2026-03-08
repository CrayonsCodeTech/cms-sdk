# @crayons/cms-sdk

A robust, type-safe SDK for fetching data from the Crayons CMS. Designed for Next.js with built-in caching and revalidation support.

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
pnpm add git+ssh://git@github.com/CrayonsCodeTech/cms-sdk.git
# or
yarn add git+ssh://git@github.com/CrayonsCodeTech/cms-sdk.git
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
> | Field    | Value         |
> | -------- | ------------- |
> | Username | `development` |
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

#### Conditional Rendering

Always handle `null` or `undefined` states gracefully for single assets like Header and Footer.

```tsx
import { cms, SITE_ID } from "@/lib/cms";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function Layout({ children }) {
  // Parallel fetching for performance
  const [header, footer, config] = await Promise.all([
    cms.fetchHeader(SITE_ID),
    cms.fetchFooter(SITE_ID),
    cms.fetchSiteConfig(SITE_ID),
  ]);

  return (
    <>
      {/* Conditionally render if data exists */}
      {header && <SiteHeader header={header} siteConfig={config} />}
      <main>{children}</main>
      {footer && <SiteFooter footer={footer} />}
    </>
  );
}
```

#### Dynamic Page Sections

For flexible page layouts, use a `switch` statement to render different components based on the `section.type`.

```tsx
import { Section } from "@crayons/cms-sdk";
import { HeroSection } from "@/components/sections/Hero";
import { ServiceSection } from "@/components/sections/Service";
import { CustomSection } from "@/components/sections/Custom";

export function RenderSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <HeroSection key={section.id} content={section.content} />;
          case "service":
            return (
              <ServiceSection key={section.id} content={section.content} />
            );
          case "custom":
            return <CustomSection key={section.id} content={section.content} />;
          // Handle other section types...
          default:
            console.warn(`Unknown section type: ${section.type}`);
            return null;
        }
      })}
    </>
  );
}
```

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

### Key Type Locations

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
