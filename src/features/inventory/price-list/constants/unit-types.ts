export const PRICE_LIST_UNIT_TYPES = ['stem', 'bunch', 'box', 'pack', 'kg'] as const;

export type PriceListUnitType = (typeof PRICE_LIST_UNIT_TYPES)[number];

export const PRICE_LIST_UNIT_TYPE_LABELS: Record<PriceListUnitType, string> = {
  stem: 'Stem',
  bunch: 'Bunch',
  box: 'Box',
  pack: 'Pack',
  kg: 'Kilogram',
};
