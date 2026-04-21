'use client';

import {
  PRICE_LIST_CATEGORY_LABELS,
  type PriceListCategory,
} from '@/features/inventory/price-list/constants/categories';
import { StatusBadge, type StatusBadgeConfig } from '@/components/shared/status-badge';

/**
 * Configuration for price list category badges
 * Maps each category to its visual representation using the standard 50/700/200 colour pattern
 */
const CATEGORY_CONFIG: Record<PriceListCategory, StatusBadgeConfig> = {
  FLORAL: {
    label: PRICE_LIST_CATEGORY_LABELS.FLORAL,
    variant: 'outline',
    className:
      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-800',
  },
  FOLIAGE: {
    label: PRICE_LIST_CATEGORY_LABELS.FOLIAGE,
    variant: 'outline',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  },
  SUNDRY: {
    label: PRICE_LIST_CATEGORY_LABELS.SUNDRY,
    variant: 'outline',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  },
  SUPPLY: {
    label: PRICE_LIST_CATEGORY_LABELS.SUPPLY,
    variant: 'outline',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  },
  OTHER: {
    label: PRICE_LIST_CATEGORY_LABELS.OTHER,
    variant: 'outline',
    className:
      'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
  },
};

interface PriceListCategoryBadgeProps {
  category: string;
}

/**
 * Price list category badge component
 *
 * Displays a visual badge for price list categories with appropriate colours.
 */
export function PriceListCategoryBadge({ category }: PriceListCategoryBadgeProps) {
  const validCategory =
    category in PRICE_LIST_CATEGORY_LABELS
      ? (category as PriceListCategory)
      : ('OTHER' as PriceListCategory);

  return <StatusBadge status={validCategory} config={CATEGORY_CONFIG} />;
}
