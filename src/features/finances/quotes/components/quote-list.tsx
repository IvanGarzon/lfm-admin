'use client';

import { useMemo } from 'react';
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

  const markAsAccepted = useMarkQuoteAsAccepted();
  const markAsSent = useMarkQuoteAsSent();
  const downloadPdf = useDownloadQuotePdf();
  const sendEmail = useSendQuoteEmail();
  const sendFollowUp = useSendQuoteFollowUp();
  const createVersion = useCreateQuoteVersion();
  const duplicateQuote = useDuplicateQuote();
  const bulkUpdateStatus = useBulkUpdateQuoteStatus();
  const bulkDelete = useBulkDeleteQuotes();

  const handleBulkUpdateStatus = (ids: string[], status: QuoteStatus) => {
    bulkUpdateStatus.mutate({ ids, status });
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDelete.mutate(ids);
  };

  const isBulkPending = bulkUpdateStatus.isPending || bulkDelete.isPending;

  const columns = useMemo(
    () =>
      createQuoteColumns(
        (id, number) => openDelete(id, number),
        (id) => markAsAccepted.mutate({ id }),
        (id, number) => openReject(id, number),
        (id) => markAsSent.mutate(id),
        (id, number) => openOnHold(id, number),
        (id, number) => openCancel(id, number),
        (id, number, gst, discount) => openConvert(id, number, gst, discount),
        (id) => downloadPdf.mutate(id),
        (id) => sendEmail.mutate({ quoteId: id, type: 'sent' }),
        (id) => sendFollowUp.mutate(id),
        (id) => createVersion.mutate(id),
        (id) => duplicateQuote.mutate(id),
      ),
    [
      markAsAccepted,
      markAsSent,
      downloadPdf,
      sendEmail,
      sendFollowUp,
      createVersion,
      duplicateQuote,
      openDelete,
      openReject,
      openOnHold,
      openCancel,
      openConvert,
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
