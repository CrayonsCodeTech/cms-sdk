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
  id: string;
  site_id: string;
  nav_groups: FooterNavGroup[];
  extra: Record<string, any>;
}
