'use client';

import { useMemo } from 'react';
import { SearchParams } from 'nuqs/server';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
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
import type { InvoicePagination, InvoiceListItem } from '@/features/finances/invoices/types';
import { createInvoiceColumns } from '@/features/finances/invoices/components/invoice-columns';
import { useInvoiceActions } from '@/features/finances/invoices/context/invoice-action-context';

const DEFAULT_PAGE_SIZE = 20;

export function InvoiceList({
  data,
  searchParams: serverSearchParams,
}: {
  data: InvoicePagination;
  searchParams: SearchParams;
}) {
  const { openDelete, openRecordPayment, openCancel, openSendReceipt } = useInvoiceActions();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const sendReminder = useSendInvoiceReminder();
  const markAsPending = useMarkInvoiceAsPending();
  const downloadPdf = useDownloadInvoicePdf();
  const bulkUpdateStatus = useBulkUpdateInvoiceStatus();
  const duplicateInvoice = useDuplicateInvoice();
  const markAsDraft = useMarkInvoiceAsDraft();

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
      <BulkActionsBar
        table={table}
        onUpdateStatus={handleBulkUpdateStatus}
        isPending={bulkUpdateStatus.isPending}
      />

      <InvoiceTable table={table} items={data.items} totalItems={data.pagination.totalItems} />
    </Box>
  );
}
