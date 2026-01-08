/**
 * Global pagination types
 * Used across all paginated features (finances, customers, products, etc.)
 */

/**
 * Pagination metadata
 * Contains information about current page, items per page, and total counts
 */
export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

/**
 * Generic paginated result interface
 * Wraps any item type with pagination metadata
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 20,
} as const;

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}
