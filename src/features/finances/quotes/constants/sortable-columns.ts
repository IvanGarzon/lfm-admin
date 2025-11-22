/**
 * Sortable column IDs for quotes
 * Keep this in sync with the column definitions in quote-columns.tsx
 */
export const SORTABLE_QUOTE_COLUMNS = [
  'quoteNumber',
  'search', // maps to customerName
  'status',
  'amount',
  'issuedDate',
  'validUntil',
] as const;

export type SortableQuoteColumn = (typeof SORTABLE_QUOTE_COLUMNS)[number];
