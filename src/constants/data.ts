import { NavItem } from '@/types';

export const PAGE_SIZE = 20;
export const DEFAULT_LIMIT = 5;
export const RANGE_LIMIT = [5, 10, 20, 50];

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'dashboard',
    shortcut: ['d', 'd'],
    authorizeOnly: ['*'],
  },
  {
    title: 'CRM',
    href: '#',
    icon: 'userPen',
    items: [
      {
        title: 'Customers',
        href: '/crm/customers',
        icon: 'users',
        shortcut: ['c', 'c'],
        authorizeOnly: ['*'],
      },
      {
        title: 'Organizations',
        href: '/crm/organizations',
        icon: 'building',
        shortcut: ['o', 'o'],
        authorizeOnly: ['*'],
      },
    ],
  },
  {
    title: 'Staff',
    href: '#',
    icon: 'employee',
    items: [
      {
        title: 'Employees',
        href: '/staff/employees',
        icon: 'user',
        shortcut: ['e', 'e'],
        authorizeOnly: ['*'],
      },
    ],
  },
  {
    title: 'Finances',
    href: '#',
    icon: 'billing',
    items: [
      {
        title: 'Invoices',
        href: '/finances/invoices',
        icon: 'fileText',
        shortcut: ['i', 'i'],
        authorizeOnly: ['*'],
      },
      {
        title: 'Quotes',
        href: '/finances/quotes',
        icon: 'kanban',
        shortcut: ['q', 'q'],
        authorizeOnly: ['*'],
      },
      {
        title: 'Transactions',
        href: '/finances/transactions',
        icon: 'arrowLeftRight',
        shortcut: ['t', 't'],
        authorizeOnly: ['*'],
      },
      {
        title: 'Recipes',
        href: '/finances/recipes',
        icon: 'pizza',
        shortcut: ['r', 'r'],
        authorizeOnly: ['*'],
      },
    ],
  },
  {
    title: 'Inventory',
    href: '#',
    icon: 'product',
    items: [
      {
        title: 'Products',
        href: '/inventory/products',
        icon: 'product',
        shortcut: ['p', 'p'],
        authorizeOnly: ['*'],
      },
      {
        title: 'Price List',
        href: '/inventory/price-list',
        icon: 'list',
        shortcut: ['l', 'l'],
        authorizeOnly: ['canReadPriceList', 'canManagePriceList'],
      },
      {
        title: 'Vendors',
        href: '/inventory/vendors',
        icon: 'users',
        shortcut: ['v', 'v'],
        authorizeOnly: ['*'],
      },
    ],
  },
  {
    title: 'Sessions',
    href: '/sessions',
    icon: 'keyRound',
    shortcut: ['s', 's'],
    authorizeOnly: ['*'],
  },
  {
    title: 'Tools',
    href: '/tools',
    icon: 'flask',
    shortcut: ['t', 'o'],
    authorizeOnly: ['canAccessTools'],
  },
];

export const lasFloresAccount = {
  bankName: 'Commonwealth Bank',
  bsb: '063-162',
  accountNumber: '1073 0539',
  accountName: 'Las Flores Melbourne',
  abn: '39586352580',
  email: 'lasfloresmelb@gmail.com',
  phone: '0451001507',
};
