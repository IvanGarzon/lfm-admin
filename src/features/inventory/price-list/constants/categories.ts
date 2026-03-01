export const PRICE_LIST_CATEGORIES = ['FLORAL', 'FOLIAGE', 'SUNDRY', 'SUPPLY', 'OTHER'] as const;

export type PriceListCategory = (typeof PRICE_LIST_CATEGORIES)[number];

export const PRICE_LIST_CATEGORY_LABELS: Record<PriceListCategory, string> = {
  FLORAL: 'Floral',
  FOLIAGE: 'Foliage',
  SUNDRY: 'Sundry',
  SUPPLY: 'Supply',
  OTHER: 'Other',
};
