import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { env } from 'env';
import { Metadata } from 'next';
import { site } from '@/config/site';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusInput = [
  // base
  'focus:ring-2',
  // ring color
  'focus:ring-blue-200 focus:dark:ring-blue-700/30',
  // border color
  'focus:border-blue-500 focus:dark:border-blue-700',
];

export const focusRing = [
  // base
  'outline outline-offset-2 outline-0 focus-visible:outline-2',
  // outline color
  'outline-blue-500 dark:outline-blue-500',
];

export const hasErrorInput = [
  // base
  'ring-2',
  // border color
  'border-red-500 dark:border-red-700',
  // ring color
  'ring-red-200 dark:ring-red-700/30',
];

export const getPaginationMetadata = (totalItems: number, take: number, currentPage: number) => {
  const totalPages = Math.ceil(totalItems / take);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    totalItems,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? currentPage + 1 : null,
    previousPage: hasPreviousPage ? currentPage - 1 : null,
  };
};

export function constructMetadata({
  title = site.name,
  description = site.description,
  image = site.image,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    keywords: ['Flowers', 'Admin', 'Las Flores Melbourne'],
    authors: [
      {
        name: site.author,
        url: site.url,
      },
    ],
    creator: site.author,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: site.url,
      title,
      description,
      siteName: site.name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: site.author,
    },
    manifest: `${site.url}/static/faviconx/site.webmanifest`,
    icons: {
      icon: [
        //! Favicon Icons
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          url: '/static/faviconx/favicon-16x16.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          url: '/static/faviconx/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          url: '/static/faviconx/favicon-96x96.png',
        },

        //! Android Icons
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '36x36',
          url: '/static/faviconx/android-icon-36x36.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '48x48',
          url: '/static/faviconx/android-icon-48x48.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '72x72',
          url: '/static/faviconx/android-icon-72x72.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '96x96',
          url: '/static/faviconx/android-icon-96x96.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '144x144',
          url: '/static/faviconx/android-icon-144x144.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          url: '/android-icon-192x192.png',
        },

        //! Apple Icons
        {
          rel: 'apple-touch-icon',
          type: 'image/ico',
          url: '/static/faviconx/apple-icon.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '57x57',
          url: '/static/faviconx/apple-icon-57x57.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '60x60',
          url: '/static/faviconx/apple-icon-60x60.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '72x72',
          url: '/static/faviconx/apple-icon-72x72.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '76x76',
          url: '/static/faviconx/apple-icon-76x76.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '114x114',
          url: '/static/faviconx/apple-icon-114x114.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '120x120',
          url: '/static/faviconx/apple-icon-120x120.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '144x144',
          url: '/static/faviconx/apple-icon-144x144.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '152x152',
          url: '/static/faviconx/apple-icon-152x152.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          url: '/static/faviconx/apple-icon-180x180.png',
        },

        //! Other Icons
        {
          rel: 'apple-touch-icon-precomposed',
          url: '/static/faviconx/apple-icon-precomposed.png',
        },
        {
          rel: 'msapplication-TileImage',
          url: '/static/favicons/mstile-150x150.png',
          sizes: '150x150',
        },

        //! MS Tile
        {
          rel: 'msapplication-TileImage',
          sizes: '150x150',
          url: '/static/faviconx/mstile-150x150.png',
        },
      ],
      apple: [{ url: '/static/faviconx/apple-icon-180x180.png' }],
      shortcut: [{ url: '/static/faviconx/favicon.ico' }],
      other: [
        {
          rel: 'manifest',
          url: '/site.webmanifest',
        },
        {
          rel: 'mask-icon',
          url: '/static/favicons/safari-pinned-tab.svg',
          color: '#5bbad5',
        },
        {
          rel: 'msapplication-TileImage',
          url: '/static/favicons/mstile-150x150.png',
        },
      ],
    },
    metadataBase: new URL(site.url),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export const formatCurrency = ({
  number,
  currency = 'AUD',
  maxFractionDigits = 2,
}: {
  number: number;
  currency?: string;
  maxFractionDigits?: number;
}) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: maxFractionDigits,
  }).format(number);

export const formatNumber = (number: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'decimal',
  }).format(number);

export const formatPercentage = ({
  number,
  decimals = 1,
}: {
  number: number;
  decimals?: number;
}) => {
  const formattedNumber = new Intl.NumberFormat('en-AU', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
  const symbol = number > 0 && number !== Infinity ? '+' : '';

  return `${symbol}${formattedNumber}`;
};

export const formatMillion = ({ number, decimals = 1 }: { number: number; decimals?: number }) => {
  const formattedNumber = new Intl.NumberFormat('en-AU', {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
  return `${formattedNumber}M`;
};

export const formatters: { [key: string]: any } = {
  toDateOnlyUTC: (date: Date) => {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  },
};

export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-AU', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts,
    }).format(new Date(date));
  } catch (_err) {
    return '';
  }
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function enumToOptions<T extends Record<string, string>>(enumObj: T) {
  function formatLabel(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  return Object.entries(enumObj).map(([key, value]) => ({
    value,
    label: formatLabel(key),
  }));
}

export function capitalize(str: string) {
  if (!str || typeof str !== 'string') {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function nFormatter(num: number, digits?: number) {
  if (!num) {
    return '0';
  }

  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });

  return item ? (num / item.value).toFixed(digits || 1).replace(rx, '$1') + item.symbol : '0';
}

export const truncate = (str: string, length: number) => {
  if (!str || str.length <= length) {
    return str;
  }

  return `${str.slice(0, length)}...`;
};

// export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
//   if (!timestamp) return 'never';
//   return `${ms(Date.now() - new Date(timestamp).getTime())}${timeOnly ? '' : ' ago'}`;
// };

export const getBlurDataURL = async (url: string | null) => {
  if (!url) {
    return 'data:image/webp;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  }

  if (url.startsWith('/_static/')) {
    url = `${site.url}${url}`;
  }

  try {
    const response = await fetch(`https://wsrv.nl/?url=${url}&w=50&h=50&blur=5`);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    return 'data:image/webp;base64,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  }
};

export const placeholderBlurhash =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAoJJREFUWEfFl4lu4zAMRO3cx/9/au6reMaOdkxTTl0grQFCRoqaT+SQotq2bV9N8rRt28xms87m83l553eZ/9vr9Wpkz+ezkT0ej+6dv1X81AFw7M4FBACPVn2c1Z3zLgDeJwHgeLFYdAARYioAEAKJEG2WAjl3gCwNYymQQ9b7/V4spmIAwO6Wy2VnAMikBWlDURBELf8CuN1uHQSrPwMAHK5WqwFELQ01AIXdAa7XawfAb3p6AOwK5+v1ugAoEq4FRSFLgavfQ49jAGQpAE5wjgGCeRrGdBArwHOPcwFcLpcGU1X0IsBuN5tNgYhaiFFwHTiAwq8I+O5xfj6fOz38K+X/fYAdb7fbAgFAjIJ6Aav3AYlQ6nfnDoDz0+lUxNiLALvf7XaDNGQ6GANQBKR85V27B4D3QQRw7hGIYlQKWGM79hSweyCUe1blXhEAogfABwHAXAcqSYkxCtHLUK3XBajSc4Dj8dilAeiSAgD2+30BAEKV4GKcAuDqB4TdYwBgPQByCgApUBoE4EJUGvxUjF3Q69/zLw3g/HA45ABKgdIQu+JPIyDnisCfAxAFNFM0EFNQ64gfS0EUoQP8ighrZSjn3oziZEQpauyKbfjbZchHUL/3AS/Dd30gAkxuRACgfO+EWQW8qwI1o+wseNuKcQiESjALvwNoMI0TcRzD4lFcPYwIM+JTF5x6HOs8yI7jeB5oKhpMRFH9UwaSCDB2Jmg4rc6E2TT0biIaG0rQhNqyhpHBcayTTSXH6vcDL7/sdqRK8LkwTsU499E8vRcAojHcZ4AxABdilgrp4lsXk8oVqgwh7+6H3phqd8J0Kk4vbx/+sZqCD/vNLya/5dT9fAH8g1WdNGgwbQAAAABJRU5ErkJggg==';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
