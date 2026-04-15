export interface CTA {
  type: string;
  text: string;
  path: string;
}

export interface Image {
  image_url: string;
  image_alt: string;
}

export interface HeroContent {
  section_heading: string;
  title: string;
  subtitle: string;
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  cta: CTA[];
  video_url: string;
  image: {
    image_url?: string;
    image_alt?: string;
  };
}

export interface CustomContent {
  tag: string | null;
  logo: string | null;
  section_title: string | null;
  card_title: string;
  card_content: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  card_content_bol?: boolean | null;
  cta?: CTA;
  image_src: string;
  image_src_two?: string | null;
  signature: string | null;
  reverse: boolean | null;
  image_style: string | null;
  small_image: boolean | null;
  subtitle?: string | null; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  external_link: boolean;
  stats?: Array<{
    value: string;
    label: string;
    prefix?: string | null;
    suffix?: string | null;
    icon?: string | null;
  }>;
}

export interface CTAContent {
  section_heading: string;
  title: string;
  subtitle?: string;
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  cta: CTA[];
  image: Image[];
  footer_text?: string;
}

export interface TestimonialsSection {
  section_heading: string;
  title: string;
  subtitle: string;
  type: string;
}

export interface ServicesSection {
  section_heading: string;
  title: string;
  subtitle: string;
}

export interface GenericSection {
  section_heading: string;
  title: string;
  subtitle: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
}

export interface ClientsSection extends GenericSection {
  brand_group_id: string;
}

export interface FaqSection extends GenericSection {
  group_id: string;
}

export interface TeamSection extends GenericSection {
  team_category_id: string;
}

export interface GallerySection extends GenericSection {
  album_id: string;
}

export interface RichContentSection {
  section_heading: string;
  title: string;
  subtitle: string;
  content: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
}

export interface AboutSection {
  section_heading: string;
  title: string;
  cta: CTA[];
}

export interface MultiValueItem {
  title: string;
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  image: Image;
  cta?: Partial<CTA>;
  badge?: string | null;
  icon?: string | null;
}

export interface MultiValueSection {
  section_heading: string;
  title: string;
  subtitle?: string;
  description: string; // HTML (rich text) — render with dangerouslySetInnerHTML or DOMPurify
  values: MultiValueItem[];
}

export interface MarqueeItem {
  text?: string | null;
  image?: string | null;
  link?: string | null;
  is_external?: boolean | null;
}

export interface MarqueeSection {
  section_heading: string;
  title: string;
  subtitle?: string;
  items: MarqueeItem[];
}

export interface HistoryItem {
  year: string;
  title: string;
  description?: string | null;
  image?: string | null;
  link?: string | null;
  is_external?: boolean | null;
}

export interface HistorySection {
  section_heading: string;
  title: string;
  subtitle?: string;
  items: HistoryItem[];
}

export type Section =
  | { id: string; variant?: string | null; type: "hero"; content: HeroContent[] }
  | { id: string; variant?: string | null; type: "custom"; content: CustomContent }
  | { id: string; variant?: string | null; type: "cta"; content: CTAContent }
  | { id: string; variant?: string | null; type: "testimonial"; content: TestimonialsSection }
  | { id: string; variant?: string | null; type: "service"; content: ServicesSection }
  | { id: string; variant?: string | null; type: "multi-value"; content: MultiValueSection }
  | { id: string; variant?: string | null; type: "team"; content: TeamSection }
  | { id: string; variant?: string | null; type: "clients"; content: ClientsSection }
  | { id: string; variant?: string | null; type: "gallery"; content: GallerySection }
  | { id: string; variant?: string | null; type: "event"; content: GenericSection }
  | { id: string; variant?: string | null; type: "blog"; content: GenericSection }
  | { id: string; variant?: string | null; type: "rich-content"; content: RichContentSection }
  | { id: string; variant?: string | null; type: "about"; content: AboutSection }
  | { id: string; variant?: string | null; type: "faq"; content: FaqSection }
  | { id: string; variant?: string | null; type: "marquee"; content: MarqueeSection }
  | { id: string; variant?: string | null; type: "history"; content: HistorySection };

export interface SEO {
  title: string;
  description: string;
  tags: string[];
  image?: string | null;
}

export interface Page {
  id: number;
  site_id: number;
  url: string;
  title: string;
  subtitle: string | null;
  sections: Section[];
  page_type: string;
  status: "draft" | "published" | "archived";
  seo: SEO | null;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
