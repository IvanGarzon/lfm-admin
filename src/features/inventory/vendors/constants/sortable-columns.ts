/**
 * List of sortable column IDs for vendors table
 * Used for validation in URL state parsers
 */
export const SORTABLE_VENDOR_COLUMNS = [
  'vendorCode',
  'name',
  'email',
  'status',
  'paymentTerms',
  'createdAt',
] as const;

export type SortableVendorColumn = (typeof SORTABLE_VENDOR_COLUMNS)[number];
