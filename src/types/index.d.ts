import { Icons } from '@/components/icons';
import { Employee } from '@/prisma/client';

export type SiteConfig = {
  author: string;
  name: string;
  description: string;
  title: string;
  theme: string;
  email: string;
  links: {
    instagram: string;
    facebook: string;
  };
  url: string;
  logo: string;
  image: string;
  socialBanner: string;
  locale: string;
  language: string;
  postDateTemplate: {
    weekday: string;
    year: string;
    month: string;
    day: string;
  };
  analytics: {
    plausibleDataDomain?: string;
    simpleAnalytics: boolean;
    umamiWebsiteId?: string;
    googleAnalyticsId?: string;
    posthogAnalyticsId?: string;
  };
  blur64: string;
};

export interface NavItem {
  title: string;
  href: string;
  badge?: number;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  description?: string;
  authorizeOnly?: string[];
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export type EmployeePagination = {
  items: Employee[];
  pagination: Pagination;
};

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
