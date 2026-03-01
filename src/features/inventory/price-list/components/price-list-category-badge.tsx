'use client';

import { Badge } from '@/components/ui/badge';
import {
  PRICE_LIST_CATEGORY_LABELS,
  type PriceListCategory,
} from '@/features/inventory/price-list/constants/categories';

const categoryColorMap: Record<PriceListCategory, string> = {
  FLORAL: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  FOLIAGE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SUNDRY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  SUPPLY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

interface PriceListCategoryBadgeProps {
  category: string;
}

export function PriceListCategoryBadge({ category }: PriceListCategoryBadgeProps) {
  const validCategory =
    category in PRICE_LIST_CATEGORY_LABELS
      ? (category as PriceListCategory)
      : ('OTHER' as PriceListCategory);

  return (
    <Badge variant="outline" className={categoryColorMap[validCategory]}>
      {PRICE_LIST_CATEGORY_LABELS[validCategory]}
    </Badge>
  );
}
