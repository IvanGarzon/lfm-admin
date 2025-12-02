import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceStatus } from '@/prisma/client'
import {
  getInvoices,
  getInvoiceById,
  getInvoiceStatistics,
  createInvoice,
  updateInvoice,
  markInvoiceAsPaid,
  markInvoiceAsPending,
  cancelInvoice,
  sendInvoiceReminder,
  deleteInvoice,
} from '@/actions/invoices';
import type {
  InvoiceFilters,
  InvoiceWithDetails,
  MarkInvoiceAsPaidData,
  CancelInvoiceData,
} from '@/features/finances/invoices/types';

import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';
import { toast } from 'sonner';

export const INVOICE_KEYS = {
  all: ['invoices'] as const,
  lists: () => [...INVOICE_KEYS.all, 'list'] as const,
  list: (filters: InvoiceFilters) => [...INVOICE_KEYS.lists(), { filters }] as const,
  details: () => [...INVOICE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...INVOICE_KEYS.details(), id] as const,
  statistics: () => [...INVOICE_KEYS.all, 'statistics'] as const,
};

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

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: INVOICE_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Invoice ID is required');
      }
      const result = await getInvoiceById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
  });
}

export function useInvoiceStatistics(dateFilter?: { startDate?: Date; endDate?: Date }) {
  return useQuery({
    queryKey: [...INVOICE_KEYS.statistics(), dateFilter],
    queryFn: async () => {
      const result = await getInvoiceStatistics(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60_000, // 1 minute
  });
}

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
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
      toast.success(`Invoice ${data.invoiceNumber} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
}

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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData(INVOICE_KEYS.detail(newData.id));

      // Optimistically update invoice with new data
      queryClient.setQueryData(
        INVOICE_KEYS.detail(newData.id),
        (old: InvoiceWithDetails | undefined) => {
          if (!old) return old;

          // Calculate new total amount from items
          const totalAmount = newData.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
          );

          return {
            ...old,
            status: newData.status,
            amount: totalAmount,
            gst: newData.gst,
            discount: newData.discount,
            currency: newData.currency,
            issuedDate: newData.issuedDate,
            dueDate: newData.dueDate,
            notes: newData.notes,
            // Update items - merge with existing item data
            items: newData.items.map((item, index) => ({
              id: item.id ?? old.items[index]?.id ?? '',
              invoiceId: old.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              productId: item.productId ?? null,
            })),
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousInvoice };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInvoice) {
        queryClient.setQueryData(INVOICE_KEYS.detail(newData.id), context.previousInvoice);
      }
      toast.error(err.message || 'Failed to update invoice');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Invoice updated successfully');
    },
  });
}

export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkInvoiceAsPaidData) => {
      const result = await markInvoiceAsPaid(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData(INVOICE_KEYS.detail(newData.id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        INVOICE_KEYS.detail(newData.id),
        (old: InvoiceWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: InvoiceStatus.PAID,
            paidDate: newData.paidDate,
            paymentMethod: newData.paymentMethod,
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousInvoice };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInvoice) {
        queryClient.setQueryData(INVOICE_KEYS.detail(newData.id), context.previousInvoice);
      }
      toast.error(err.message || 'Failed to mark invoice as paid');
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Invoice marked as paid');
    },
  });
}

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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData(INVOICE_KEYS.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(INVOICE_KEYS.detail(id), (old: InvoiceWithDetails | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: InvoiceStatus.PENDING,
          paidDate: null,
          paymentMethod: null,
        };
      });

      // Return a context object with the snapshotted value
      return { previousInvoice, id };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInvoice) {
        queryClient.setQueryData(INVOICE_KEYS.detail(id), context.previousInvoice);
      }
      toast.error(err.message || 'Failed to mark invoice as pending');
    },
    onSettled: (_data, _error, id) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Invoice marked as pending');
    },
  });
}

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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData(INVOICE_KEYS.detail(newData.id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        INVOICE_KEYS.detail(newData.id),
        (old: InvoiceWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: InvoiceStatus.CANCELLED,
            cancelledDate: newData.cancelledDate,
            cancelReason: newData.cancelReason,
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousInvoice };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInvoice) {
        queryClient.setQueryData(INVOICE_KEYS.detail(newData.id), context.previousInvoice);
      }
      toast.error(err.message || 'Failed to cancel invoice');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Invoice cancelled');
    },
  });
}

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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: INVOICE_KEYS.lists() });

      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData(INVOICE_KEYS.detail(id));

      // Optimistically update to increment remindersSent
      queryClient.setQueryData(
        INVOICE_KEYS.detail(id),
        (old: InvoiceWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            remindersSent: (old.remindersSent ?? 0) + 1,
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousInvoice, id };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInvoice) {
        queryClient.setQueryData(INVOICE_KEYS.detail(id), context.previousInvoice);
      }
      toast.error(err.message || 'Failed to send reminder');
    },
    onSettled: (_data, _error, id) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Reminder sent');
    },
  });
}

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
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Invoice deleted');
    },
  });
}

export function useDownloadInvoicePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const invoiceData = await queryClient.fetchQuery({
        queryKey: INVOICE_KEYS.detail(id),
        queryFn: async () => {
          const result = await getInvoiceById(id);
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data;
        },
      });

      const { downloadInvoicePdf } = await import(
        '@/features/finances/invoices/utils/invoice-pdf-helpers'
      );

      return await downloadInvoicePdf(invoiceData);
    },
    onSuccess: () => {
      toast.success('PDF downloaded successfully');
    },
    onError: () => {
      // Error is thrown from downloadInvoicePdf, which already shows toast
      toast.error('Failed to download invoice');
    },
  });
}

export function useDownloadReceiptPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const invoiceData = await queryClient.fetchQuery({
        queryKey: INVOICE_KEYS.detail(id),
        queryFn: async () => {
          const result = await getInvoiceById(id);
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data;
        },
      });

      const { downloadReceiptPdf } = await import(
        '@/features/finances/invoices/utils/invoice-pdf-helpers'
      );

      return await downloadReceiptPdf(invoiceData);
    },
    onSuccess: () => {
      toast.success('Receipt downloaded successfully');
    },
    onError: () => {
      // Error is thrown from downloadReceiptPdf, which already shows toast
      toast.error('Failed to download receipt');
    },
  });
}
