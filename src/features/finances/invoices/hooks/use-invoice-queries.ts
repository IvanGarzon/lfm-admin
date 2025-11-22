import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    onSuccess: (data) => {
      // Invalidate the specific invoice, lists, and statistics
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
      toast.success('Invoice marked as paid');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark invoice as paid');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
      toast.success('Invoice marked as pending');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark invoice as pending');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
      toast.success('Invoice cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invoice');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      toast.success('Reminder sent');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reminder');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.statistics() });
      toast.success('Invoice deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete invoice');
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
        '@/features/finances/invoices/utils/invoiceHelpers'
      );

      return await downloadInvoicePdf(invoiceData);
    },
    onSuccess: () => {
      toast.success('PDF downloaded successfully');
    },
    onError: (error: Error) => {
      console.error('Error downloading invoice:', error);
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
        '@/features/finances/invoices/utils/invoiceHelpers'
      );

      return await downloadReceiptPdf(invoiceData);
    },
    onSuccess: () => {
      toast.success('Receipt downloaded successfully');
    },
    onError: (error: Error) => {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    },
  });
}
