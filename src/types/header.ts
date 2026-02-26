export interface NavGrandChild {
  title: string;
  url: string;
}

export interface NavChild {
  title: string;
  url: string;
  children?: NavGrandChild[];
}

export interface NavLink {
  title: string;
  url: string;
  children?: NavChild[];
}

export interface Cta {
  title: string;
  title_url: string;
}

export interface Header {
  id: number;
  site_id: number;
  nav_links: NavLink[];
  ctas: Cta[];
  extra: Record<string, any>;
}
