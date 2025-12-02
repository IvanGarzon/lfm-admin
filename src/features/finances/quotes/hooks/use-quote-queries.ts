import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQuotes,
  getQuoteById,
  getQuoteStatistics,
  createQuote,
  updateQuote,
  markQuoteAsAccepted,
  markQuoteAsRejected,
  markQuoteAsSent,
  markQuoteAsOnHold,
  markQuoteAsCancelled,
  convertQuoteToInvoice,
  checkAndExpireQuotes,
  deleteQuote,
  uploadQuoteAttachment,
  deleteQuoteAttachment,
  getQuoteAttachments,
  getAttachmentDownloadUrl,
  uploadQuoteItemAttachment,
  deleteQuoteItemAttachment,
  updateQuoteItemNotes,
  getQuoteItemAttachments,
  getItemAttachmentDownloadUrl,
  updateQuoteItemColors,
  createQuoteVersion,
  getQuoteVersions,
} from '@/actions/quotes';
import type {
  QuoteFilters,
  QuoteWithDetails,
  MarkQuoteAsAcceptedData,
  MarkQuoteAsRejectedData,
  MarkQuoteAsOnHoldData,
  MarkQuoteAsCancelledData,
  ConvertQuoteToInvoiceData,
} from '@/features/finances/quotes/types';

import type { CreateQuoteInput, UpdateQuoteInput } from '@/schemas/quotes';
import { toast } from 'sonner';

export const QUOTE_KEYS = {
  all: ['quotes'] as const,
  lists: () => [...QUOTE_KEYS.all, 'list'] as const,
  list: (filters: QuoteFilters) => [...QUOTE_KEYS.lists(), { filters }] as const,
  details: () => [...QUOTE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUOTE_KEYS.details(), id] as const,
  statistics: () => [...QUOTE_KEYS.all, 'statistics'] as const,
  attachments: (quoteId: string) => [...QUOTE_KEYS.detail(quoteId), 'attachments'] as const,
  itemAttachments: (quoteItemId: string) =>
    [...QUOTE_KEYS.all, 'item-attachments', quoteItemId] as const,
  versions: (quoteId: string) => [...QUOTE_KEYS.detail(quoteId), 'versions'] as const,
};

export function useQuotes(filters: QuoteFilters) {
  return useQuery({
    queryKey: QUOTE_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) {
        searchParams.search = filters.search;
      }

      if (filters.status && filters.status.length > 0) {
        searchParams.status = filters.status;
      }

      const result = await getQuotes(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: QUOTE_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Quote ID is required');
      }
      const result = await getQuoteById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
  });
}

export function useQuoteVersions(quoteId: string | undefined) {
  return useQuery({
    queryKey: QUOTE_KEYS.versions(quoteId ?? ''),
    queryFn: async () => {
      if (!quoteId) {
        throw new Error('Quote ID is required');
      }
      const result = await getQuoteVersions(quoteId);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(quoteId),
  });
}

export function useQuoteStatistics(dateFilter?: { startDate?: Date; endDate?: Date }) {
  return useQuery({
    queryKey: [...QUOTE_KEYS.statistics(), dateFilter],
    queryFn: async () => {
      const result = await getQuoteStatistics(dateFilter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60_000, // 1 minute
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuoteInput) => {
      const result = await createQuote(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });
    },
    onSuccess: (data) => {
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success(`Quote ${data.quoteNumber} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quote');
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateQuoteInput) => {
      const result = await updateQuote(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(newData.id));

      // Optimistically update quote with new data
      queryClient.setQueryData(
        QUOTE_KEYS.detail(newData.id),
        (old: QuoteWithDetails | undefined) => {
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
            validUntil: newData.validUntil,
            notes: newData.notes,
            terms: newData.terms,
            // Update items - merge with existing item data
            items: newData.items.map((item, index) => ({
              id: item.id ?? old.items[index]?.id ?? '',
              quoteId: old.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
              productId: item.productId ?? null,
              notes: item.notes ?? old.items[index]?.notes ?? null,
              order: index,
              colors: item.colors ?? old.items[index]?.colors ?? [],
              createdAt: old.items[index]?.createdAt ?? new Date(),
              attachments: old.items[index]?.attachments ?? [],
            })),
          };
        },
      );

      return { previousQuote };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(newData.id), context.previousQuote);
      }
      toast.error(err.message || 'Failed to update quote');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Quote updated successfully');
    },
  });
}

export function useMarkQuoteAsAccepted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsAcceptedData) => {
      const result = await markQuoteAsAccepted(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(newData.id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        QUOTE_KEYS.detail(newData.id),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'ACCEPTED' as const,
          };
        },
      );

      return { previousQuote };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(newData.id), context.previousQuote);
      }
      toast.error(err.message || 'Failed to mark quote as accepted');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Quote marked as accepted');
    },
  });
}

export function useMarkQuoteAsRejected() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsRejectedData) => {
      const result = await markQuoteAsRejected(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(newData.id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        QUOTE_KEYS.detail(newData.id),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'REJECTED' as const,
          };
        },
      );

      return { previousQuote };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(newData.id), context.previousQuote);
      }
      toast.error(err.message || 'Failed to mark quote as rejected');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Quote marked as rejected');
    },
  });
}

export function useMarkQuoteAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markQuoteAsSent(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(QUOTE_KEYS.detail(id), (old: QuoteWithDetails | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: 'SENT' as const,
        };
      });

      return { previousQuote, id };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(id), context.previousQuote);
      }
      toast.error(err.message || 'Failed to mark quote as sent');
    },
    onSettled: (_data, _error, id) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Quote marked as sent');
    },
  });
}

export function useMarkQuoteAsOnHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsOnHoldData) => {
      const result = await markQuoteAsOnHold(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(newData.id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        QUOTE_KEYS.detail(newData.id),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'ON_HOLD' as const,
          };
        },
      );

      return { previousQuote };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(newData.id), context.previousQuote);
      }
      toast.error(err.message || 'Failed to put quote on hold');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Quote put on hold');
    },
  });
}

export function useMarkQuoteAsCancelled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkQuoteAsCancelledData) => {
      const result = await markQuoteAsCancelled(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(newData.id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        QUOTE_KEYS.detail(newData.id),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'CANCELLED' as const,
          };
        },
      );

      return { previousQuote };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(newData.id), context.previousQuote);
      }
      toast.error(err.message || 'Failed to cancel quote');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Quote cancelled');
    },
  });
}

export function useConvertQuoteToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ConvertQuoteToInvoiceData) => {
      const result = await convertQuoteToInvoice({
        ...data,
        gst: data.gst ?? 10,
        discount: data.discount ?? 0,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(newData.id));

      // Optimistically update to the new value
      queryClient.setQueryData(
        QUOTE_KEYS.detail(newData.id),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'CONVERTED' as const,
          };
        },
      );

      return { previousQuote };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(newData.id), context.previousQuote);
      }
      toast.error(err.message || 'Failed to convert quote to invoice');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onSuccess: (data) => {
      toast.success(`Quote converted to invoice ${data.invoiceNumber}`);
    },
  });
}

export function useExpireQuotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await checkAndExpireQuotes();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (data.count > 0) {
        queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
        queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
        toast.success(`${data.count} quote(s) expired`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to expire quotes');
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteQuote(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.lists() });

      // Snapshot the previous values
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: QUOTE_KEYS.lists() });

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: QUOTE_KEYS.detail(id) });

      // Return context for rollback
      return { previousQuote, previousLists, id };
    },
    onError: (error: Error, id, context) => {
      // Rollback optimistic update
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(id), context.previousQuote);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete quote');
    },
    onSettled: () => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Quote deleted');
    },
  });
}

export function useCreateQuoteVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const result = await createQuoteVersion({ quoteId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.details() });
      toast.success(
        `Version ${data.versionNumber} created successfully (${data.quoteNumber})`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quote version');
    },
  });
}

export function useDownloadQuotePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const quoteData = await queryClient.fetchQuery({
        queryKey: QUOTE_KEYS.detail(id),
        queryFn: async () => {
          const result = await getQuoteById(id);
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data;
        },
      });

      const { downloadQuotePdf } = await import('@/features/finances/quotes/utils/quote-helpers.tsx');

      return await downloadQuotePdf(quoteData);
    },
    onSuccess: () => {
      toast.success('PDF downloaded successfully');
    },
    onError: () => {
      // Error is thrown from downloadQuotePdf, which already shows toast
      toast.error('Failed to download quote');
    },
  });
}

export function useQuoteAttachments(quoteId: string | undefined) {
  return useQuery({
    queryKey: QUOTE_KEYS.attachments(quoteId ?? ''),
    queryFn: async () => {
      if (!quoteId) {
        throw new Error('Quote ID is required');
      }
      const result = await getQuoteAttachments(quoteId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(quoteId),
  });
}

export function useUploadQuoteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { quoteId: string; file: File }) => {
      const formData = new FormData();
      formData.append('quoteId', data.quoteId);
      formData.append('file', data.file);

      const result = await uploadQuoteAttachment(formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate attachments for this quote and the quote detail
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.attachments(data.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      toast.success(`${data.fileName} uploaded successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload attachment');
    },
  });
}

export function useDeleteQuoteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { attachmentId: string; quoteId: string }) => {
      const result = await deleteQuoteAttachment({ attachmentId: data.attachmentId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, quoteId: data.quoteId };
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.attachments(data.quoteId) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });

      // Snapshot the previous values
      const previousAttachments = queryClient.getQueryData(QUOTE_KEYS.attachments(data.quoteId));
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(data.quoteId));

      // Optimistically remove attachment from quote detail
      queryClient.setQueryData(
        QUOTE_KEYS.detail(data.quoteId),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            attachments: old.attachments.filter((att) => att.id !== data.attachmentId),
          };
        },
      );

      return { previousAttachments, previousQuote };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousAttachments) {
        queryClient.setQueryData(QUOTE_KEYS.attachments(data.quoteId), context.previousAttachments);
      }
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(data.quoteId), context.previousQuote);
      }
      toast.error(error.message || 'Failed to delete attachment');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.attachments(variables.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Attachment deleted successfully');
    },
  });
}

export function useGetAttachmentDownloadUrl() {
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await getAttachmentDownloadUrl(attachmentId);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Open in new tab
      window.open(data.url, '_blank', 'noopener,noreferrer');
      toast.success('Opening attachment');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download attachment');
    },
  });
}

export function useQuoteItemAttachments(quoteItemId: string | undefined) {
  return useQuery({
    queryKey: QUOTE_KEYS.itemAttachments(quoteItemId ?? ''),
    queryFn: async () => {
      if (!quoteItemId) {
        throw new Error('Quote item ID is required');
      }
      const result = await getQuoteItemAttachments(quoteItemId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(quoteItemId),
  });
}

export function useUploadQuoteItemAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { quoteItemId: string; quoteId: string; file: File }) => {
      const formData = new FormData();
      formData.append('quoteItemId', data.quoteItemId);
      formData.append('quoteId', data.quoteId);
      formData.append('file', data.file);

      const result = await uploadQuoteItemAttachment(formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, quoteId: data.quoteId };
    },
    onSuccess: (data) => {
      // Invalidate item attachments, quote detail, and lists
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.itemAttachments(data.quoteItemId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      toast.success(`${data.fileName} uploaded successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
}

export function useDeleteQuoteItemAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { attachmentId: string; quoteItemId: string; quoteId: string }) => {
      const result = await deleteQuoteItemAttachment({
        attachmentId: data.attachmentId,
        quoteId: data.quoteId,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, quoteItemId: data.quoteItemId, quoteId: data.quoteId };
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.itemAttachments(data.quoteItemId) });
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });

      // Snapshot the previous values
      const previousItemAttachments = queryClient.getQueryData(
        QUOTE_KEYS.itemAttachments(data.quoteItemId),
      );
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(data.quoteId));

      // Optimistically remove attachment from quote detail
      queryClient.setQueryData(
        QUOTE_KEYS.detail(data.quoteId),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id === data.quoteItemId) {
                return {
                  ...item,
                  attachments: item.attachments.filter((att) => att.id !== data.attachmentId),
                };
              }
              return item;
            }),
          };
        },
      );

      return { previousItemAttachments, previousQuote };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousItemAttachments) {
        queryClient.setQueryData(
          QUOTE_KEYS.itemAttachments(data.quoteItemId),
          context.previousItemAttachments,
        );
      }
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(data.quoteId), context.previousQuote);
      }
      toast.error(error.message || 'Failed to delete image');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.itemAttachments(variables.quoteItemId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Image deleted successfully');
    },
  });
}

export function useGetItemAttachmentDownloadUrl() {
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await getItemAttachmentDownloadUrl(attachmentId);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download image');
    },
  });
}

export function useUpdateQuoteItemNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { quoteItemId: string; quoteId: string; notes: string }) => {
      const result = await updateQuoteItemNotes({
        quoteItemId: data.quoteItemId,
        quoteId: data.quoteId,
        notes: data.notes,
      });

      if (!result.success) {
        throw new Error(result.error);
      }
      return { ...result.data, quoteId: data.quoteId };
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(data.quoteId));

      // Optimistically update notes in quote detail
      queryClient.setQueryData(
        QUOTE_KEYS.detail(data.quoteId),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id === data.quoteItemId) {
                return {
                  ...item,
                  notes: data.notes,
                };
              }
              return item;
            }),
          };
        },
      );

      return { previousQuote };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(data.quoteId), context.previousQuote);
      }
      toast.error(error.message || 'Failed to update notes');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.quoteId) });
    },
    onSuccess: () => {
      toast.success('Notes updated successfully');
    },
  });
}

export function useUploadQuoteItemColorPalette() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { quoteItemId: string; quoteId: string; colors: string[] }) => {
      const result = await updateQuoteItemColors({
        quoteItemId: data.quoteItemId,
        quoteId: data.quoteId,
        colors: data.colors
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return { ...result.data, quoteId: data.quoteId };
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });

      // Snapshot the previous value
      const previousQuote = queryClient.getQueryData(QUOTE_KEYS.detail(data.quoteId));

      // Optimistically update colors in quote detail
      queryClient.setQueryData(
        QUOTE_KEYS.detail(data.quoteId),
        (old: QuoteWithDetails | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.id === data.quoteItemId) {
                return {
                  ...item,
                  colors: data.colors,
                };
              }
              return item;
            }),
          };
        },
      );

      return { previousQuote };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousQuote) {
        queryClient.setQueryData(QUOTE_KEYS.detail(data.quoteId), context.previousQuote);
      }
      toast.error(error.message || 'Failed to update color palette');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.quoteId) });
    },
    onSuccess: () => {
      toast.success('Color palette updated successfully');
    },
  });
}
