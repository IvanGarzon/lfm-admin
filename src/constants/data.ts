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
    title: 'Customers',
    href: '/customers',
    icon: 'users',
    shortcut: ['c', 'c'],
    authorizeOnly: ['*'],
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: 'users',
    shortcut: ['e', 'e'],
    authorizeOnly: ['*'],
  },
  {
    title: 'Finances',
    href: '#',
    icon: 'billing',
    items: [
      // {
      //   title: 'Invoices',
      //   href: '/finances/invoices',
      //   icon: 'fileText',
      //   shortcut: ['i', 'i'],
      //   authorizeOnly: ['*'],
      // },
      // {
      //   title: 'Quotes',
      //   href: '/finances/quotes',
      //   icon: 'kanban',
      //   shortcut: ['q', 'q'],
      //   authorizeOnly: ['*'],
      // },
      {
        title: 'Transactions',
        href: '/finances/transactions',
        icon: 'arrowLeftRight',
        shortcut: ['t', 't'],
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

  // {
  //   title: 'Product',
  //   href: '/products',
  //   icon: 'product',
  //   shortcut: ['p', 'p'],
  //   authorizeOnly: ['*'],
  // },
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
