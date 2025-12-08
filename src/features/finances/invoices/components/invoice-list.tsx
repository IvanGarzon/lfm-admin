'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  useInvoiceStatistics,
  useSendInvoiceReminder,
  useMarkInvoiceAsPending,
  useDownloadInvoicePdf,
  useBulkUpdateInvoiceStatus,
} from '@/features/finances/invoices/hooks/use-invoice-queries';
import dynamic from 'next/dynamic';
import { InvoiceStats } from '@/features/finances/invoices/components/invoice-stats';
import { InvoiceStatsFilters } from '@/features/finances/invoices/components/invoice-stats-filters';
import { InvoiceTable } from '@/features/finances/invoices/components/invoice-table';
import { BulkActionsBar } from '@/features/finances/invoices/components/bulk-actions-bar';
import type {
  InvoicePagination,
  StatsDateFilter,
  InvoiceListItem,
} from '@/features/finances/invoices/types';
import { createInvoiceColumns } from '@/features/finances/invoices/components/invoice-columns';
import { useInvoiceActions } from '@/features/finances/invoices/context/invoice-action-context';

const InvoiceDrawer = dynamic(
  () =>
    import('@/features/finances/invoices/components/invoice-drawer').then(
      (mod) => mod.InvoiceDrawer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

const DEFAULT_PAGE_SIZE = 20;

export function InvoiceList({
  data,
  searchParams: serverSearchParams,
  hideCreateDrawer = false,
}: {
  data: InvoicePagination;
  searchParams: SearchParams;
  hideCreateDrawer?: boolean;
}) {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [statsDateFilter, setStatsDateFilter] = useState<StatsDateFilter>({});

  const { openDelete, openRecordPayment, openCancel, openSendReceipt } = useInvoiceActions();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useInvoiceStatistics(statsDateFilter);

  const sendReminder = useSendInvoiceReminder();
  const markAsPending = useMarkInvoiceAsPending();
  const downloadPdf = useDownloadInvoicePdf();
  const bulkUpdateStatus = useBulkUpdateInvoiceStatus();

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  const columns = useMemo(
    () =>
      createInvoiceColumns(
        (id, number) => openDelete(id, number),
        (id) => sendReminder.mutate(id),
        (id) => markAsPending.mutate(id),
        (id, number, invoice) => openRecordPayment(id, number, invoice),
        (id, number) => openCancel(id, number),
        (id) => downloadPdf.mutate(id),
        (id) => openSendReceipt(id),
      ),
    [
      sendReminder,
      markAsPending,
      downloadPdf,
      openDelete,
      openRecordPayment,
      openCancel,
      openSendReceipt,
    ],
  );

  const { table } = useDataTable({
    data: data.items,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500,
  });

  const handleBulkUpdateStatus = (rows: InvoiceListItem[], status: string) => {
    bulkUpdateStatus.mutate(
      // @ts-expect-error Status enum mismatch
      { ids: rows.map((r) => r.id), status },
      {
        onSuccess: () => table.toggleAllPageRowsSelected(false),
      },
    );
  };

  return (
    <Box className="space-y-4 min-w-0 w-full">
      <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Box className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">Manage and track all your invoices</p>
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
            New Invoice
          </Button>
        </Box>
      </Box>

      {showStats ? (
        <Box className="space-y-3 min-w-0">
          <InvoiceStatsFilters onFilterChange={setStatsDateFilter} />
          <InvoiceStats stats={stats} isLoading={statsLoading} error={statsError} />
        </Box>
      ) : null}

      <BulkActionsBar
        table={table}
        onUpdateStatus={handleBulkUpdateStatus}
        isPending={bulkUpdateStatus.isPending}
      />

      <InvoiceTable table={table} items={data.items} totalItems={data.pagination.totalItems} />

      {showCreateModal ? (
        <InvoiceDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
