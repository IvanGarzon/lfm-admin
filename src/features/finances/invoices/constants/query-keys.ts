import type { SearchParams } from 'nuqs/server';

export const INVOICE_KEYS = {
  all: ['invoices'] as const,
  lists: () => [...INVOICE_KEYS.all, 'list'] as const,
  list: (filters: SearchParams) => [...INVOICE_KEYS.lists(), { filters }] as const,
  details: () => [...INVOICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVOICE_KEYS.details(), id] as const,
  metadata: (id: string) => [...INVOICE_KEYS.all, 'metadata', id] as const,
  items: (id: string) => [...INVOICE_KEYS.detail(id), 'items'] as const,
  payments: (id: string) => [...INVOICE_KEYS.detail(id), 'payments'] as const,
  history: (id: string) => [...INVOICE_KEYS.detail(id), 'history'] as const,
  statistics: () => [...INVOICE_KEYS.all, 'statistics'] as const
};
