'use client';

import { useCallback, useMemo } from 'react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import {
  useMarkQuoteAsAccepted,
  useMarkQuoteAsSent,
  useDownloadQuotePdf,
  useSendQuoteEmail,
  useSendQuoteFollowUp,
  useCreateQuoteVersion,
  useDuplicateQuote,
  useBulkUpdateQuoteStatus,
  useBulkDeleteQuotes,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { QuoteTable } from '@/features/finances/quotes/components/quote-table';
import type { QuotePagination } from '@/features/finances/quotes/types';
import { createQuoteColumns } from '@/features/finances/quotes/components/quote-columns';
import { useQuoteActions } from '@/features/finances/quotes/context/quote-action-context';
import { QuoteStatus } from '@/prisma/client';

const DEFAULT_PAGE_SIZE = 20;

export function QuoteList({
  data,
  searchParams: serverSearchParams,
}: {
  data: QuotePagination;
  searchParams: SearchParams;
}) {
  const { openDelete, openReject, openOnHold, openCancel, openConvert } = useQuoteActions();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const markAsAcceptedMutation = useMarkQuoteAsAccepted();
  const markAsSentMutation = useMarkQuoteAsSent();
  const downloadPdfMutation = useDownloadQuotePdf();
  const sendEmailMutation = useSendQuoteEmail();
  const sendFollowUpMutation = useSendQuoteFollowUp();
  const createVersionMutation = useCreateQuoteVersion();
  const duplicateQuoteMutation = useDuplicateQuote();
  const bulkUpdateStatus = useBulkUpdateQuoteStatus();
  const bulkDelete = useBulkDeleteQuotes();

  const handleBulkUpdateStatus = (ids: string[], status: QuoteStatus) => {
    bulkUpdateStatus.mutate({ ids, status });
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDelete.mutate(ids);
  };

  const isBulkPending = bulkUpdateStatus.isPending || bulkDelete.isPending;

  const handleAccept = useCallback(
    (id: string) => {
      markAsAcceptedMutation.mutate({ id });
    },
    [markAsAcceptedMutation],
  );

  const handleSend = useCallback(
    (id: string) => {
      markAsSentMutation.mutate(id);
    },
    [markAsSentMutation],
  );

  const handleDownloadPdf = useCallback(
    (id: string) => {
      downloadPdfMutation.mutate(id);
    },
    [downloadPdfMutation],
  );

  const handleSendEmail = useCallback(
    (id: string) => {
      sendEmailMutation.mutate({ quoteId: id, type: 'sent' });
    },
    [sendEmailMutation],
  );

  const handleSendFollowUp = useCallback(
    (id: string) => {
      sendFollowUpMutation.mutate(id);
    },
    [sendFollowUpMutation],
  );

  const handleCreateVersion = useCallback(
    (id: string) => {
      createVersionMutation.mutate(id);
    },
    [createVersionMutation],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateQuoteMutation.mutate(id);
    },
    [duplicateQuoteMutation],
  );

  const columns = useMemo(
    () =>
      createQuoteColumns(
        openDelete,
        handleAccept,
        openReject,
        handleSend,
        openOnHold,
        openCancel,
        openConvert,
        handleDownloadPdf,
        handleSendEmail,
        handleSendFollowUp,
        handleCreateVersion,
        handleDuplicate,
      ),
    [
      openDelete,
      handleAccept,
      openReject,
      handleSend,
      openOnHold,
      openCancel,
      openConvert,
      handleDownloadPdf,
      handleSendEmail,
      handleSendFollowUp,
      handleCreateVersion,
      handleDuplicate,
    ],
  );

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
  });

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <QuoteTable
        table={table}
        items={data.items}
        totalItems={data.pagination.totalItems}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkDelete={handleBulkDelete}
        isBulkPending={isBulkPending}
      />
    </Box>
  );
}
