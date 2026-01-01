'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';
import dynamic from 'next/dynamic';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const QuoteDrawer = dynamic(
  () => import('@/features/finances/quotes/components/quote-drawer').then((mod) => mod.QuoteDrawer),
  {
    ssr: false,
    loading: () => null,
  },
);

const QuoteAnalytics = dynamic(
  () =>
    import('@/features/finances/quotes/components/quote-analytics').then(
      (mod) => mod.QuoteAnalytics,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    ),
  },
);

const DEFAULT_PAGE_SIZE = 20;

export function QuoteList({
  data,
  searchParams: serverSearchParams,
  hideCreateDrawer = false,
}: {
  data: QuotePagination;
  searchParams: SearchParams;
  hideCreateDrawer?: boolean;
}) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('list');

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

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Box className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground text-sm">Manage and track all your quotes</p>
          </Box>
          <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
            <TabsList className="grid w-full grid-cols-2 sm:w-[200px]">
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </Box>
        </Box>

        <TabsContent
          value="list"
          className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0"
        >
          <QuoteTable
            table={table}
            items={data.items}
            totalItems={data.pagination.totalItems}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onBulkDelete={handleBulkDelete}
            isBulkPending={isBulkPending}
          />
        </TabsContent>

        <TabsContent
          value="analytics"
          className="pt-2 border-none p-0 outline-none focus-visible:ring-0"
        >
          {activeTab === 'analytics' && <QuoteAnalytics />}
        </TabsContent>
      </Tabs>

      {showCreateModal ? (
        <QuoteDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
