export interface FooterNavChild {
  title: string;
  url: string;
}

export interface FooterNavGroupLink {
  title: string;
  url: string;
  children: FooterNavChild[];
}

export interface FooterNavGroup {
  name: string;
  links: FooterNavGroupLink[];
}

export interface Footer {
  id: number;
  site_id: number;
  nav_groups: FooterNavGroup[];
  extra: Record<string, any>;
}
