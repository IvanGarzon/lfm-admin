/**
 * Sortable column IDs for customers
 * Keep this in sync with the column definitions in invoice-columns.tsx
 */
export const SORTABLE_CUSTOMER_COLUMNS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'organizationName',
] as const;

export type SortableCustomerColumn = (typeof SORTABLE_CUSTOMER_COLUMNS)[number];
