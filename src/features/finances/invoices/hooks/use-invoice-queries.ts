'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  skipToken,
  type QueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { InvoiceStatus } from '@/prisma/client';
import {
  getInvoices,
  getInvoiceById,
  getInvoiceMetadata,
  getInvoiceItems,
  getInvoicePayments,
  getInvoiceStatusHistory,
  getInvoiceStatistics,
  getInvoicePdfUrl,
  getReceiptPdfUrl,
} from '@/actions/finances/invoices/queries';
import {
  createInvoice,
  updateInvoice,
  markInvoiceAsPending,
  cancelInvoice,
  sendInvoiceReminder,
  deleteInvoice,
  bulkUpdateInvoiceStatus,
  duplicateInvoice,
  markInvoiceAsDraft,
} from '@/actions/finances/invoices/mutations';
import type {
  InvoiceFilters,
  InvoiceMetadata,
  InvoiceItemDetail,
  InvoicePaymentItem,
  CancelInvoiceData,
} from '@/features/finances/invoices/types';
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  RecordPaymentInput,
} from '@/schemas/invoices';
import { formatDateNormalizer } from '@/lib/utils';

// -- Invoice Query Keys: Split Cache Architecture --------------------------
//
// We use a split cache architecture to optimise performance and prevent unnecessary data fetching:
//
// - metadata: Core invoice fields (status, amount, dates, client info)
// - items: Line items (products, descriptions, quantities, prices)
// - payments: Payment records for the invoice
// - history: Status change history
//
// Benefits:
// 1. Metadata queries are lightweight and fast (used in lists, status updates)
// 2. Items are only fetched when needed (e.g., opening invoice drawer)
// 3. Payments are only fetched when viewing payment details
// 4. History is only fetched when viewing audit trail
// 5. Optimistic updates can target specific cache segments
// 6. Reduces over-fetching and improves perceived performance
//
// Most mutations optimistically update the relevant cache segments and invalidate
// after server response to ensure consistency.

export const INVOICE_KEYS = {
  all: ['invoices'] as const,
  lists: () => [...INVOICE_KEYS.all, 'list'] as const,
  list: (filters: InvoiceFilters) => [...INVOICE_KEYS.lists(), { filters }] as const,
  details: () => [...INVOICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVOICE_KEYS.details(), id] as const,
  metadata: (id: string) => [...INVOICE_KEYS.all, 'metadata', id] as const,
  items: (id: string) => [...INVOICE_KEYS.detail(id), 'items'] as const,
  payments: (id: string) => [...INVOICE_KEYS.detail(id), 'payments'] as const,
  history: (id: string) => [...INVOICE_KEYS.detail(id), 'history'] as const,
  statistics: () => [...INVOICE_KEYS.all, 'statistics'] as const,
};

/**
 * Invalidates invoice-related queries after mutations.
 * Ensures cache consistency across invoice lists, details, metadata, items, payments, history, and statistics.
 */
function invalidateInvoiceQueries(
  queryClient: QueryClient,
  options?: {
    invoiceId?: string;
    invalidateAllDetails?: boolean;
    includeQuotes?: boolean;
  },
) {
  if (options?.invoiceId) {
    queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(options.invoiceId) });
    queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.metadata(options.invoiceId) });
    queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.items(options.invoiceId) });
    queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.payments(options.invoiceId) });
    queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.history(options.invoiceId) });
  }

  if (options?.invalidateAllDetails) {
    queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.details() });
  }

  queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
  queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });

  if (options?.includeQuotes) {
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
  }
}

/**
 * Fetches a paginated list of invoices with optional filtering.
 * Use this hook for invoice list views and tables.
 *
 * @param filters - Filtering options for the invoice list
 * @returns Query result containing the filtered invoice list
 *
 * Cache behaviour:
 * - Data is cached for 30 seconds to prevent excessive refetching
 * - Query automatically refetches when filters change
 * - Cache is invalidated when invoices are created, updated, or deleted
 */
export function useInvoices(filters: InvoiceFilters) {
  return useQuery({
    queryKey: INVOICE_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) {
        searchParams.search = filters.search;
      }

      if (filters.status && filters.status.length > 0) {
        searchParams.status = filters.status;
      }

      const result = await getInvoices(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Fetches complete invoice details including metadata and items.
 * Use this when you need the full invoice record.
 *
 * @param id - The invoice ID (undefined disables the query)
 *
 * @returns Query result containing the complete invoice details
 *
 * Cache behaviour:
 * - Automatically disabled when id is undefined (safe for conditional rendering)
 * - Data is cached for 30 seconds
 * - For better performance, prefer using `useInvoiceMetadata` and `useInvoiceItems` separately to leverage the split cache architecture
 * - Cache is invalidated when the invoice is updated or deleted
 */
export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: INVOICE_KEYS.detail(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getInvoiceById(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetches invoice metadata (core fields without line items or payments).
 * Preferred over `useInvoice` for most use cases due to split cache optimisation.
 *
 * @param id - The invoice ID (undefined disables the query)
 *
 * @returns Query result containing invoice metadata (status, amount, dates, client, etc.)
 *
 * @example
 * // Use in invoice cards, status badges, and overview components
 * const { data: invoice } = useInvoiceMetadata(invoiceId);
 * if (invoice) {
 *   return <InvoiceStatusBadge status={invoice.status} />;
 * }
 *
 * Cache behaviour:
 * - Part of the split cache architecture for optimal performance
 * - Much lighter than fetching full invoice details
 * - Data is cached for 30 seconds
 * - Automatically disabled when id is undefined
 * - Optimistically updated by mutations like `useUpdateInvoice`, `useRecordPayment`, and status changes
 * - Cache is invalidated when the invoice is updated, payments are recorded, or status changes
 */
export function useInvoiceMetadata(id: string | undefined) {
  return useQuery({
    queryKey: INVOICE_KEYS.metadata(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getInvoiceMetadata(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetches invoice line items separately from metadata.
 * Part of the split cache architecture to avoid loading items until needed.
 *
 * @param id - The invoice ID (undefined disables the query)
 * @param options - Query options
 * @param options.enabled - Enable/disable the query (useful for lazy loading)
 *
 * @returns Query result containing the invoice line items
 *
 * @example
 * // Lazy load items only when drawer is open
 * const { data: items } = useInvoiceItems(invoiceId, { enabled: isDrawerOpen });
 *
 * Cache behaviour:
 * - Part of the split cache architecture for optimal performance
 * - Only fetch items when displaying invoice details (e.g., drawer, edit form)
 * - Data is cached for 30 seconds
 * - Automatically disabled when id is undefined
 * - Optimistically updated by `useUpdateInvoice` mutation
 * - Cache is invalidated when the invoice is updated or deleted
 */
export function useInvoiceItems(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: INVOICE_KEYS.items(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getInvoiceItems(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    enabled: options?.enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetches payment records for an invoice.
 * Part of the split cache architecture to avoid loading payments until needed.
 *
 * @param id - The invoice ID (undefined disables the query)
 * @param options - Query options
 * @param options.enabled - Enable/disable the query (useful for lazy loading)
 *
 * @returns Query result containing the invoice payment records
 *
 * @example
 * // Lazy load payments only when payments tab is active
 * const { data: payments } = useInvoicePayments(invoiceId, { enabled: activeTab === 'payments' });
 *
 * Cache behaviour:
 * - Part of the split cache architecture for optimal performance
 * - Only fetch payments when displaying payment history (e.g., payments tab)
 * - Data is cached for 30 seconds
 * - Automatically disabled when id is undefined
 * - Optimistically updated by `useRecordPayment` mutation (new payment added to top)
 * - Cache is invalidated when payments are recorded or invoice is updated
 */
export function useInvoicePayments(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: INVOICE_KEYS.payments(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getInvoicePayments(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    enabled: options?.enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetches status change history for an invoice.
 * Part of the split cache architecture to avoid loading history until needed.
 *
 * @param id - The invoice ID (undefined disables the query)
 * @param options - Query options
 * @param options.enabled - Enable/disable the query (useful for lazy loading)
 *
 * @returns Query result containing the invoice status change history
 *
 * @example
 * // Lazy load history only when history tab is active
 * const { data: history } = useInvoiceHistory(invoiceId, { enabled: activeTab === 'history' });
 *
 * Cache behaviour:
 * - Part of the split cache architecture for optimal performance
 * - Only fetch history when displaying audit trail (e.g., history tab)
 * - Data is cached for 30 seconds
 * - Automatically disabled when id is undefined
 * - Cache is invalidated when invoice status changes or invoice is updated
 */
export function useInvoiceHistory(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: INVOICE_KEYS.history(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getInvoiceStatusHistory(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    enabled: options?.enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetches invoice statistics and metrics for a given date range.
 * Use this hook for dashboard analytics and reporting.
 *
 * @param dateFilter - Optional date range filter
 * @param dateFilter.startDate - Start date for the statistics period
 * @param dateFilter.endDate - End date for the statistics period
 * @param options - Query options
 * @param options.enabled - Enable/disable the query
 *
 * @returns Query result containing invoice statistics (totals, counts, trends)
 *
 * @example
 * // Get statistics for current month
 * const { data: stats } = useInvoiceStatistics({
 *   startDate: startOfMonth(new Date()),
 *   endDate: endOfMonth(new Date())
 * });
 *
 * Cache behaviour:
 * - Data is cached for 60 seconds (longer than other queries due to computational cost)
 * - Uses `keepPreviousData` to prevent loading states when date filter changes
 * - Date filters are normalised to ISO strings for stable query keys
 * - Cache is invalidated when invoices are created, updated, deleted, or status changes
 */
export function useInvoiceStatistics(
  dateFilter?: { startDate?: Date; endDate?: Date },
  options?: { enabled?: boolean },
) {
  // Normalize date filter to ISO date strings for stable query keys
  // This prevents cache misses when component remounts with logically identical dates
  const normalizedDateFilter = dateFilter
    ? {
        startDate: dateFilter.startDate ? formatDateNormalizer(dateFilter.startDate) : null,
        endDate: dateFilter.endDate ? formatDateNormalizer(dateFilter.endDate) : null,
      }
    : undefined;

  return useQuery({
    queryKey: [...INVOICE_KEYS.statistics(), normalizedDateFilter],
    queryFn: async () => {
      const result = await getInvoiceStatistics(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

/**
 * Creates a new invoice.
 * Use this mutation to create invoices from the create invoice form.
 *
 * @returns Mutation object for creating an invoice
 *
 * @example
 * const createInvoice = useCreateInvoice();
 * await createInvoice.mutateAsync({
 *   clientId: '123',
 *   items: [...],
 *   status: 'DRAFT'
 * });
 *
 * Cache behaviour:
 * - Cancels outgoing list refetches to prevent race conditions
 * - Invalidates all invoice-related caches on success (lists, statistics)
 *
 * Toast notifications:
 * - Success: "Invoice {invoiceNumber} created successfully"
 * - Error: "Failed to create invoice"
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceInput) => {
      const result = await createInvoice(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });
    },
    onSuccess: (data) => {
      invalidateInvoiceQueries(queryClient);
      toast.success(`Invoice ${data.invoiceNumber} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
}

/**
 * Updates an existing invoice with optimistic updates to the split caches.
 * Use this mutation to save changes from the edit invoice form.
 *
 * @returns Mutation object for updating an invoice
 *
 * @example
 * const updateInvoice = useUpdateInvoice();
 * await updateInvoice.mutateAsync({
 *   id: '123',
 *   status: 'PENDING',
 *   items: [...]
 * });
 *
 * Cache behaviour:
 * - Uses split cache optimistic updates for instant UI feedback
 * - Optimistically updates both metadata cache (status, amount, dates) and items cache
 * - Recalculates total amount from items for consistency
 * - Cancels outgoing refetches to prevent race conditions
 * - Rolls back optimistic updates if mutation fails
 * - Invalidates affected caches on completion (settled)
 *
 * Toast notifications:
 * - Success: "Invoice updated successfully"
 * - Error: "Failed to update invoice"
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateInvoiceInput) => {
      const result = await updateInvoice(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = INVOICE_KEYS.metadata(newData.id);
      const itemsKey = INVOICE_KEYS.items(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: itemsKey });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous values
      const previousMetadata = queryClient.getQueryData<InvoiceMetadata>(metadataKey);
      const previousItems = queryClient.getQueryData<InvoiceItemDetail[]>(itemsKey);

      // Calculate new total amount from items
      const totalAmount = newData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      // Optimistically update metadata
      if (previousMetadata) {
        queryClient.setQueryData<InvoiceMetadata>(metadataKey, {
          ...previousMetadata,
          status: newData.status,
          amount: totalAmount,
          gst: newData.gst,
          discount: newData.discount,
          currency: newData.currency,
          issuedDate: newData.issuedDate,
          dueDate: newData.dueDate,
          notes: newData.notes,
        });
      }

      // Optimistically update items
      if (previousItems) {
        queryClient.setQueryData<InvoiceItemDetail[]>(
          itemsKey,
          newData.items.map((item, index) => ({
            id: item.id ?? previousItems[index]?.id ?? '',
            invoiceId: newData.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            productId: item.productId ?? null,
          })),
        );
      }

      // Return context for rollback
      return { previousMetadata, previousItems };
    },
    onError: (err, newData, context) => {
      const metadataKey = INVOICE_KEYS.metadata(newData.id);
      const itemsKey = INVOICE_KEYS.items(newData.id);

      // Roll back optimistic updates
      if (context?.previousMetadata) {
        queryClient.setQueryData(metadataKey, context.previousMetadata);
      }
      if (context?.previousItems) {
        queryClient.setQueryData(itemsKey, context.previousItems);
      }
      toast.error(err.message || 'Failed to update invoice');
    },
    onSettled: (_data, _error, variables) => {
      invalidateInvoiceQueries(queryClient, { invoiceId: variables.id });
    },
    onSuccess: () => {
      toast.success('Invoice updated successfully');
    },
  });
}

/**
 * Records a payment against an invoice with optimistic updates to metadata and payments caches.
 * Use this mutation to record partial or full payments.
 *
 * @returns Mutation object for recording a payment
 *
 * @example
 * const recordPayment = useRecordPayment();
 * await recordPayment.mutateAsync({
 *   id: invoiceId,
 *   amount: 500,
 *   paidDate: new Date(),
 *   paymentMethod: 'BANK_TRANSFER'
 * });
 *
 * Cache behaviour:
 * - Uses split cache optimistic updates for instant UI feedback
 * - Optimistically updates metadata cache (status, amountPaid, amountDue)
 * - Optimistically adds payment to payments cache (at the top)
 * - Automatically transitions status to PARTIALLY_PAID or PAID based on amount
 * - Cancels outgoing refetches to prevent race conditions
 * - Rolls back optimistic updates if mutation fails
 * - Invalidates affected caches on completion
 *
 * Toast notifications:
 * - Success: "Payment recorded successfully"
 * - Error: "Failed to record payment"
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordPaymentInput) => {
      // Dynamically import to separate server actions if needed, or import at top
      const { recordPayment } = await import('@/actions/finances/invoices/mutations');
      const result = await recordPayment(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = INVOICE_KEYS.metadata(newData.id);
      const paymentsKey = INVOICE_KEYS.payments(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: paymentsKey });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous values
      const previousMetadata = queryClient.getQueryData<InvoiceMetadata>(metadataKey);
      const previousPayments = queryClient.getQueryData<InvoicePaymentItem[]>(paymentsKey);

      if (previousMetadata) {
        const newAmountPaid = Number(previousMetadata.amountPaid) + newData.amount;
        const newAmountDue = Number(previousMetadata.amount) - newAmountPaid;

        let newStatus = previousMetadata.status;
        if (newAmountDue <= 0.01) {
          newStatus = InvoiceStatus.PAID;
        } else if (newAmountDue > 0 && newAmountPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }

        // Optimistically update metadata
        queryClient.setQueryData<InvoiceMetadata>(metadataKey, {
          ...previousMetadata,
          status: newStatus,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          // If fully paid, set these for compatibility
          ...(newStatus === InvoiceStatus.PAID
            ? {
                paidDate: newData.paidDate,
                paymentMethod: newData.paymentMethod,
              }
            : {}),
        });
      }

      // Optimistically add payment to payments cache
      if (previousPayments) {
        queryClient.setQueryData<InvoicePaymentItem[]>(paymentsKey, [
          {
            id: 'temp-' + Date.now(),
            amount: newData.amount,
            date: newData.paidDate,
            method: newData.paymentMethod,
            reference: null,
            notes: newData.notes ?? null,
          },
          ...previousPayments,
        ]);
      }

      // Return context for rollback
      return { previousMetadata, previousPayments };
    },
    onError: (err, newData, context) => {
      const metadataKey = INVOICE_KEYS.metadata(newData.id);
      const paymentsKey = INVOICE_KEYS.payments(newData.id);

      // Roll back optimistic updates
      if (context?.previousMetadata) {
        queryClient.setQueryData(metadataKey, context.previousMetadata);
      }
      if (context?.previousPayments) {
        queryClient.setQueryData(paymentsKey, context.previousPayments);
      }
      toast.error(err.message || 'Failed to record payment');
    },
    onSettled: (_data, _error, variables) => {
      invalidateInvoiceQueries(queryClient, { invoiceId: variables.id });
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
    },
  });
}

/**
 * Marks an invoice as pending with optimistic metadata cache update.
 * Use this to transition a draft invoice to pending (ready to send).
 *
 * @returns Mutation object for marking an invoice as pending
 *
 * @example
 * const markAsPending = useMarkInvoiceAsPending();
 * await markAsPending.mutateAsync(invoiceId);
 *
 * Cache behaviour:
 * - Uses metadata cache optimistic update for instant UI feedback
 * - Clears paidDate and paymentMethod when reverting from PAID status
 * - Cancels outgoing refetches to prevent race conditions
 * - Rolls back optimistic update if mutation fails
 * - Invalidates affected caches on completion
 *
 * Toast notifications:
 * - Success: "Invoice marked as pending"
 * - Error: "Failed to mark invoice as pending"
 */
export function useMarkInvoiceAsPending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markInvoiceAsPending({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      const metadataKey = INVOICE_KEYS.metadata(id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<InvoiceMetadata>(metadataKey);

      // Optimistically update metadata
      if (previousMetadata) {
        queryClient.setQueryData<InvoiceMetadata>(metadataKey, {
          ...previousMetadata,
          status: InvoiceStatus.PENDING,
          paidDate: null,
          paymentMethod: null,
        });
      }

      // Return context for rollback
      return { previousMetadata, id };
    },
    onError: (err, id, context) => {
      const metadataKey = INVOICE_KEYS.metadata(id);

      // Roll back optimistic update
      if (context?.previousMetadata) {
        queryClient.setQueryData(metadataKey, context.previousMetadata);
      }
      toast.error(err.message || 'Failed to mark invoice as pending');
    },
    onSettled: (_data, _error, id) => {
      invalidateInvoiceQueries(queryClient, { invoiceId: id });
    },
    onSuccess: () => {
      toast.success('Invoice marked as pending');
    },
  });
}

/**
 * Reverts an invoice to draft status with optimistic metadata cache update.
 * Use this to revert a pending invoice back to draft for further editing.
 *
 * @returns Mutation object for marking an invoice as draft
 *
 * @example
 * const markAsDraft = useMarkInvoiceAsDraft();
 * await markAsDraft.mutateAsync(invoiceId);
 *
 * Cache behaviour:
 * - Uses metadata cache optimistic update for instant UI feedback
 * - Cancels outgoing refetches to prevent race conditions
 * - Rolls back optimistic update if mutation fails
 * - Invalidates affected caches on completion
 *
 * Toast notifications:
 * - Success: "Invoice reverted to draft"
 * - Error: "Failed to revert invoice to draft"
 */
export function useMarkInvoiceAsDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markInvoiceAsDraft(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      const metadataKey = INVOICE_KEYS.metadata(id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<InvoiceMetadata>(metadataKey);

      // Optimistically update metadata
      if (previousMetadata) {
        queryClient.setQueryData<InvoiceMetadata>(metadataKey, {
          ...previousMetadata,
          status: InvoiceStatus.DRAFT,
        });
      }

      // Return context for rollback
      return { previousMetadata, id };
    },
    onError: (err, id, context) => {
      const metadataKey = INVOICE_KEYS.metadata(id);

      // Roll back optimistic update
      if (context?.previousMetadata) {
        queryClient.setQueryData(metadataKey, context.previousMetadata);
      }
      toast.error(err.message || 'Failed to revert invoice to draft');
    },
    onSettled: (_data, _error, id) => {
      invalidateInvoiceQueries(queryClient, { invoiceId: id });
    },
    onSuccess: () => {
      toast.success('Invoice reverted to draft');
    },
  });
}

/**
 * Cancels an invoice with reason and date, using optimistic metadata cache update.
 * Use this to cancel an invoice that will not be paid.
 *
 * @returns Mutation object for cancelling an invoice
 *
 * @example
 * const cancelInvoice = useCancelInvoice();
 * await cancelInvoice.mutateAsync({
 *   id: invoiceId,
 *   cancelledDate: new Date(),
 *   cancelReason: 'Client requested cancellation'
 * });
 *
 * Cache behaviour:
 * - Uses metadata cache optimistic update for instant UI feedback
 * - Sets status to CANCELLED with cancellation date and reason
 * - Cancels outgoing refetches to prevent race conditions
 * - Rolls back optimistic update if mutation fails
 * - Invalidates affected caches on completion
 *
 * Toast notifications:
 * - Success: "Invoice cancelled"
 * - Error: "Failed to cancel invoice"
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CancelInvoiceData) => {
      const result = await cancelInvoice(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      const metadataKey = INVOICE_KEYS.metadata(newData.id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<InvoiceMetadata>(metadataKey);

      // Optimistically update metadata
      if (previousMetadata) {
        queryClient.setQueryData<InvoiceMetadata>(metadataKey, {
          ...previousMetadata,
          status: InvoiceStatus.CANCELLED,
          cancelReason: newData.cancelReason,
        });
      }

      // Return context for rollback
      return { previousMetadata };
    },
    onError: (err, newData, context) => {
      const metadataKey = INVOICE_KEYS.metadata(newData.id);

      // Roll back optimistic update
      if (context?.previousMetadata) {
        queryClient.setQueryData(metadataKey, context.previousMetadata);
      }
      toast.error(err.message || 'Failed to cancel invoice');
    },
    onSettled: (_data, _error, variables) => {
      invalidateInvoiceQueries(queryClient, { invoiceId: variables.id });
    },
    onSuccess: () => {
      toast.success('Invoice cancelled');
    },
  });
}

/**
 * Sends a payment reminder email for an invoice with optimistic metadata cache update.
 * Use this to remind clients about overdue or pending invoices.
 *
 * @returns Mutation object for sending an invoice reminder
 *
 * @example
 * const sendReminder = useSendInvoiceReminder();
 * await sendReminder.mutateAsync(invoiceId);
 *
 * Cache behaviour:
 * - Uses metadata cache optimistic update to increment remindersSent count
 * - Cancels outgoing refetches to prevent race conditions
 * - Rolls back optimistic update if mutation fails
 * - Invalidates affected caches on completion
 *
 * Toast notifications:
 * - Success: "Reminder sent"
 * - Error: "Failed to send reminder"
 */
export function useSendInvoiceReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await sendInvoiceReminder(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      const metadataKey = INVOICE_KEYS.metadata(id);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: metadataKey });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousMetadata = queryClient.getQueryData<InvoiceMetadata>(metadataKey);

      // Optimistically update metadata to increment remindersSent
      if (previousMetadata) {
        queryClient.setQueryData<InvoiceMetadata>(metadataKey, {
          ...previousMetadata,
          remindersSent: (previousMetadata.remindersSent ?? 0) + 1,
        });
      }

      // Return context for rollback
      return { previousMetadata, id };
    },
    onError: (err, id, context) => {
      const metadataKey = INVOICE_KEYS.metadata(id);

      // Roll back optimistic update
      if (context?.previousMetadata) {
        queryClient.setQueryData(metadataKey, context.previousMetadata);
      }
      toast.error(err.message || 'Failed to send reminder');
    },
    onSettled: (_data, _error, id) => {
      invalidateInvoiceQueries(queryClient, { invoiceId: id });
    },
    onSuccess: () => {
      toast.success('Reminder sent');
    },
  });
}

/**
 * Deletes an invoice with optimistic cache removal.
 * Use this to permanently remove an invoice (typically only allowed for drafts).
 *
 * @returns Mutation object for deleting an invoice
 *
 * @example
 * const deleteInvoice = useDeleteInvoice();
 * await deleteInvoice.mutateAsync(invoiceId);
 *
 * Cache behaviour:
 * - Optimistically removes invoice from detail cache and list caches
 * - Cancels outgoing refetches to prevent race conditions
 * - Rolls back optimistic updates if mutation fails
 * - Invalidates all invoice caches on completion
 *
 * Toast notifications:
 * - Success: "Invoice deleted"
 * - Error: "Failed to delete invoice"
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteInvoice(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous values
      const previousInvoice = queryClient.getQueryData(INVOICE_KEYS.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: INVOICE_KEYS.lists() });

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: INVOICE_KEYS.detail(id) });

      // Return context for rollback
      return { previousInvoice, previousLists, id };
    },
    onError: (error: Error, id, context) => {
      // Rollback optimistic update
      if (context?.previousInvoice) {
        queryClient.setQueryData(INVOICE_KEYS.detail(id), context.previousInvoice);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete invoice');
    },
    onSettled: () => {
      invalidateInvoiceQueries(queryClient);
    },
    onSuccess: () => {
      toast.success('Invoice deleted');
    },
  });
}

/**
 * Generates and downloads the invoice PDF.
 * Use this to provide clients with a PDF copy of the invoice.
 *
 * @returns Mutation object for downloading invoice PDF
 *
 * @example
 * const downloadPdf = useDownloadInvoicePdf();
 * await downloadPdf.mutateAsync(invoiceId);
 *
 * Cache behaviour:
 * - Opens PDF in a new browser tab
 * - Does not modify cache (read-only operation)
 *
 * Toast notifications:
 * - Success: "PDF downloaded successfully"
 * - Error: "Failed to download invoice"
 */
export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await getInvoicePdfUrl(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Open in new tab
      window.open(result.data.url, '_blank');
      return result.data.url;
    },
    onSuccess: () => {
      toast.success('PDF downloaded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to download invoice');
    },
  });
}

/**
 * Generates and downloads the payment receipt PDF.
 * Use this to provide clients with a receipt for paid invoices.
 *
 * @returns Mutation object for downloading receipt PDF
 *
 * @example
 * const downloadReceipt = useDownloadReceiptPdf();
 * await downloadReceipt.mutateAsync(invoiceId);
 *
 * Cache behaviour:
 * - Opens receipt PDF in a new browser tab
 * - Typically used for fully paid or partially paid invoices
 * - Does not modify cache (read-only operation)
 *
 * Toast notifications:
 * - Success: "Receipt downloaded successfully"
 */
export function useDownloadReceiptPdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await getReceiptPdfUrl(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Open in new tab
      window.open(result.data.url, '_blank');
      return result.data.url;
    },
    onSuccess: () => {
      toast.success('Receipt downloaded successfully');
    },
  });
}

/**
 * Updates the status of multiple invoices in a single operation.
 * Use this for bulk status changes from the invoice list.
 *
 * @returns Mutation object for bulk updating invoice statuses
 *
 * @example
 * const bulkUpdate = useBulkUpdateInvoiceStatus();
 * await bulkUpdate.mutateAsync({
 *   ids: ['inv1', 'inv2', 'inv3'],
 *   status: 'PENDING'
 * });
 *
 * Cache behaviour:
 * - No optimistic updates (too complex for bulk operations)
 * - Invalidates all invoice caches on success
 *
 * Toast notifications:
 * - Success: "{count} invoices updated" or "Invoice updated"
 * - Error: "Failed to update invoices"
 */
export function useBulkUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: InvoiceStatus }) => {
      const result = await bulkUpdateInvoiceStatus(ids, status);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      invalidateInvoiceQueries(queryClient);
      toast.success(
        data.successCount > 1 ? `${data.successCount} invoices updated` : 'Invoice updated',
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update invoices');
    },
  });
}

/**
 * Creates a duplicate of an existing invoice with a new invoice number.
 * Use this to quickly create a new invoice based on an existing one.
 *
 * @returns Mutation object for duplicating an invoice
 *
 * @example
 * const duplicateInvoice = useDuplicateInvoice();
 * const newInvoice = await duplicateInvoice.mutateAsync(existingInvoiceId);
 *
 * Cache behaviour:
 * - Creates a new invoice with copied items and details
 * - Generates a new invoice number automatically
 * - New invoice is created with DRAFT status
 * - Invalidates all invoice caches on success
 *
 * Toast notifications:
 * - Success: "Invoice duplicated as {invoiceNumber}"
 * - Error: "Failed to duplicate invoice"
 */
export function useDuplicateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await duplicateInvoice(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      invalidateInvoiceQueries(queryClient);
      toast.success(`Invoice duplicated as ${data.invoiceNumber}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate invoice');
    },
  });
}

/**
 * Prefetches invoice metadata for improved perceived performance.
 * Use this on hover or focus to warm the cache before navigation.
 *
 * @returns Function to prefetch invoice metadata by ID
 *
 * @example
 * const prefetchInvoice = usePrefetchInvoice();
 *
 * <Link
 *   href={`/invoices/${invoice.id}`}
 *   onMouseEnter={() => prefetchInvoice(invoice.id)}
 * >
 *   View Invoice
 * </Link>
 *
 * Cache behaviour:
 * - Only prefetches metadata (lightweight query)
 * - Data is cached for 30 seconds
 * - Prevents loading states when user navigates to invoice
 * - Call on mouse enter, focus, or other pre-navigation events
 */
export function usePrefetchInvoice() {
  const queryClient = useQueryClient();

  return (invoiceId: string) => {
    queryClient.prefetchQuery({
      queryKey: INVOICE_KEYS.metadata(invoiceId),
      queryFn: async () => {
        const result = await getInvoiceMetadata(invoiceId);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}
