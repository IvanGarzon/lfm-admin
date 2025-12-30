'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceAnalytics } from '@/features/finances/invoices/components/invoice-analytics';
import { InvoiceTable } from '@/features/finances/invoices/components/invoice-table';
import { BulkActionsBar } from '@/features/finances/invoices/components/bulk-actions-bar';
import {
  useSendInvoiceReminder,
  useMarkInvoiceAsPending,
  useDownloadInvoicePdf,
  useBulkUpdateInvoiceStatus,
  useDuplicateInvoice,
  useMarkInvoiceAsDraft,
} from '@/features/finances/invoices/hooks/use-invoice-queries';
import dynamic from 'next/dynamic';
import type { InvoicePagination, InvoiceListItem } from '@/features/finances/invoices/types';
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
  const [activeTab, setActiveTab] = useState<string>('list');

  const { openDelete, openRecordPayment, openCancel, openSendReceipt } = useInvoiceActions();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const sendReminder = useSendInvoiceReminder();
  const markAsPending = useMarkInvoiceAsPending();
  const downloadPdf = useDownloadInvoicePdf();
  const bulkUpdateStatus = useBulkUpdateInvoiceStatus();
  const duplicateInvoice = useDuplicateInvoice();
  const markAsDraft = useMarkInvoiceAsDraft();

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  const columns = useMemo(
    () =>
      createInvoiceColumns(
        (id, number) => openDelete(id, number),
        (id) => sendReminder.mutate(id),
        (id) => markAsPending.mutate(id),
        (id, number) => openRecordPayment(id, number),
        (id, number) => openCancel(id, number),
        (id) => downloadPdf.mutate(id),
        (id) => markAsDraft.mutate(id),
        (id) => openSendReceipt(id),
        (id) => duplicateInvoice.mutate(id),
      ),
    [
      sendReminder,
      markAsPending,
      downloadPdf,
      openDelete,
      openRecordPayment,
      openCancel,
      openSendReceipt,
      duplicateInvoice,
      markAsDraft,
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Box className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Box className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground text-sm">Manage and track all your invoices</p>
          </Box>
          <Box className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center shrink-0">
            <TabsList className="grid w-full grid-cols-2 sm:w-[200px]">
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <Button onClick={handleShowCreateModal} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Box>
        </Box>

        <TabsContent
          value="list"
          className="space-y-4 pt-2 border-none p-0 outline-none focus-visible:ring-0"
        >
          <BulkActionsBar
            table={table}
            onUpdateStatus={handleBulkUpdateStatus}
            isPending={bulkUpdateStatus.isPending}
          />

          <InvoiceTable table={table} items={data.items} totalItems={data.pagination.totalItems} />
        </TabsContent>

        <TabsContent
          value="analytics"
          className="pt-2 border-none p-0 outline-none focus-visible:ring-0"
        >
          {activeTab === 'analytics' && <InvoiceAnalytics />}
        </TabsContent>
      </Tabs>

      {showCreateModal ? (
        <InvoiceDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
