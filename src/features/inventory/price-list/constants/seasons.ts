export const PRICE_LIST_SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all-year'] as const;

export type PriceListSeason = (typeof PRICE_LIST_SEASONS)[number];

export const PRICE_LIST_SEASON_LABELS: Record<PriceListSeason, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
  'all-year': 'All Year',
};
