export const SORTABLE_TRANSACTION_COLUMNS = ['search', 'date', 'amount'] as const;

export type SortableTransactionColumn = (typeof SORTABLE_TRANSACTION_COLUMNS)[number];
