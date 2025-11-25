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
    onSuccess: (data) => {
      // Invalidate the specific quote, lists, and statistics
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success('Quote updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update quote');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success('Quote marked as accepted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark quote as accepted');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success('Quote marked as rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark quote as rejected');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success('Quote marked as sent');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark quote as sent');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success('Quote put on hold');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to put quote on hold');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success('Quote cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel quote');
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
    onSuccess: (data, variables) => {
      // Invalidate the specific quote detail to update the drawer
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success(`Quote converted to invoice ${data.invoiceNumber}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to convert quote to invoice');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.statistics() });
      toast.success('Quote deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete quote');
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
    onError: (error: Error) => {
      console.error('Error downloading quote:', error);
      toast.error('Failed to download quote');
    },
  });
}

/**
 * Get attachments for a quote
 */
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

/**
 * Upload an attachment to a quote
 */
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

/**
 * Delete an attachment from a quote
 */
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
    onSuccess: (data) => {
      // Invalidate attachments for this quote and the quote detail
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.attachments(data.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      toast.success('Attachment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete attachment');
    },
  });
}

/**
 * Get a signed download URL for an attachment
 */
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

/**
 * Get attachments for a quote item
 */
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

/**
 * Upload an image attachment to a quote item
 */
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

/**
 * Delete an attachment from a quote item
 */
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
    onSuccess: (data) => {
      // Invalidate item attachments, quote detail, and lists
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.itemAttachments(data.quoteItemId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.lists() });
      toast.success('Image deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete image');
    },
  });
}

/**
 * Get a signed download URL for an item attachment
 */
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

/**
 * Update notes for a quote item attachment
 */
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });
      toast.success('Notes updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update notes');
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUOTE_KEYS.detail(data.quoteId) });
      toast.success('Color palette updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update color palette');
    },
  });
}
