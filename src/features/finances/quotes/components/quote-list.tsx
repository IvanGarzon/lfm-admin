'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  useQuoteStatistics,
  useMarkQuoteAsAccepted,
  useMarkQuoteAsSent,
  useDownloadQuotePdf,
  useCreateQuoteVersion,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { QuoteStats } from '@/features/finances/quotes/components/quote-stats';
import { QuoteTable } from '@/features/finances/quotes/components/quote-table';
import { QuoteDrawer } from '@/features/finances/quotes/components/quote-drawer';
import type { QuotePagination, StatsDateFilter } from '@/features/finances/quotes/types';
import { createQuoteColumns } from '@/features/finances/quotes/components/quote-columns';
import { useQuoteActions } from '@/features/finances/quotes/context/quote-action-context';

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
  const [showStats, setShowStats] = useState<boolean>(true);
  const [statsDateFilter, setStatsDateFilter] = useState<StatsDateFilter>({});

  const { openDelete, openReject, openOnHold, openCancel, openConvert } = useQuoteActions();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuoteStatistics(statsDateFilter);

  const markAsAccepted = useMarkQuoteAsAccepted();
  const markAsSent = useMarkQuoteAsSent();
  const downloadPdf = useDownloadQuotePdf();
  const createVersion = useCreateQuoteVersion();

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

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
        (id) => createVersion.mutate(id),
      ),
    [
      markAsAccepted,
      markAsSent,
      downloadPdf,
      createVersion,
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
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground text-sm">Manage and track all your quotes</p>
        </Box>
        <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
          <Box className="flex items-center gap-2">
            <Switch id="show-stats" checked={showStats} onCheckedChange={setShowStats} />
            <Label htmlFor="show-stats" className="cursor-pointer text-sm whitespace-nowrap">
              Show Statistics
            </Label>
          </Box>
          <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Quote
          </Button>
        </Box>
      </Box>

      {showStats ? (
        <Box className="space-y-3 min-w-0">
          <QuoteStats stats={stats} isLoading={statsLoading} error={statsError} />
        </Box>
      ) : null}

      <QuoteTable table={table} items={data.items} totalItems={data.pagination.totalItems} />

      {showCreateModal && <QuoteDrawer open={showCreateModal} onClose={handleShowCreateModal} />}
    </Box>
  );
}
