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
  description: string;
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
  card_content: string;
  card_content_bol?: boolean | null;
  cta?: CTA;
  image_src: string;
  signature: string | null;
  reverse: boolean | null;
  image_style: string | null;
  small_image: boolean | null;
  subtitle?: string | null;
  external_link: boolean;
}

export interface CTAContent {
  section_heading: string;
  title: string;
  subtitle?: string;
  description: string;
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
  subtitle: string;
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
  content: string;
}

export interface AboutSection {
  section_heading: string;
  title: string;
  cta: CTA[];
}

export interface MultiValueItem {
  title: string;
  description: string;
  image: Image;
  cta?: Partial<CTA>;
}

export interface MultiValueSection {
  section_heading: string;
  title: string;
  subtitle?: string;
  description: string;
  values: MultiValueItem[];
}

export type Section =
  | { id: string; type: "hero"; content: HeroContent[] }
  | { id: string; type: "custom"; content: CustomContent }
  | { id: string; type: "cta"; content: CTAContent }
  | { id: string; type: "testimonial"; content: TestimonialsSection }
  | { id: string; type: "service"; content: ServicesSection }
  | { id: string; type: "multi-value"; content: MultiValueSection }
  | { id: string; type: "team"; content: TeamSection }
  | { id: string; type: "clients"; content: ClientsSection }
  | { id: string; type: "gallery"; content: GallerySection }
  | { id: string; type: "event"; content: GenericSection }
  | { id: string; type: "blog"; content: GenericSection }
  | { id: string; type: "rich-content"; content: RichContentSection }
  | { id: string; type: "about"; content: AboutSection }
  | { id: string; type: "faq"; content: FaqSection };

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
