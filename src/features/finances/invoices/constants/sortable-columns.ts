/**
 * Sortable column IDs for invoices
 * Keep this in sync with the column definitions in invoice-columns.tsx
 */
export const SORTABLE_INVOICE_COLUMNS = [
  'invoiceNumber',
  'search', // maps to customerName
  'status',
  'amount',
  'issuedDate',
  'dueDate',
] as const;

export type SortableInvoiceColumn = (typeof SORTABLE_INVOICE_COLUMNS)[number];
