import { QuoteStatus, InvoiceStatus } from '@/prisma/client';
import { PaginatedResult, PaginationParams } from '@/types/pagination';

/**
 * Union type for all finance-related status types
 */
export type FinanceStatus = QuoteStatus | InvoiceStatus;

/**
 * Generic interface for status history entries
 * Used by both quotes and invoices to track status changes over time
 */
export interface FinanceStatusHistory<TStatus extends FinanceStatus = FinanceStatus> {
  id: string;
  status: TStatus;
  previousStatus: TStatus | null;
  changedAt: Date;
  changedBy: string | null;
  notes: string | null;
}

/**
 * Type alias for paginated finance results
 * Re-exports the global PaginatedResult type for convenience
 * Used for both quote and invoice listings
 */
export type FinancePagination<T> = PaginatedResult<T>;

/**
 * Generic interface for finance filters
 * Supports searching, status filtering, pagination, and sorting
 * Extends global PaginationParams for consistency
 */
export interface FinanceFilters<
  TStatus extends FinanceStatus = FinanceStatus,
> extends PaginationParams {
  search?: string;
  status?: TStatus;
  sort?: string;
}

/**
 * Base interface for finance line items (quote items, invoice items)
 * Contains common fields shared across all item types
 */
export interface FinanceItemBase {
  id: string;
  description: string;
  quantity: number;
  notes?: string | null;
  internalNotes?: string | null;
  colors?: string | null;
}
