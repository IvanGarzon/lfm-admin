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
  useDeleteInvoice,
  useSendInvoiceReminder,
  useMarkInvoiceAsPending,
  useMarkInvoiceAsPaid,
  useCancelInvoice,
  useDownloadInvoicePdf,
  useDownloadReceiptPdf,
  useInvoice,
} from '@/features/finances/invoices/hooks/use-invoice-queries';
import { InvoiceStats } from '@/features/finances/invoices/components/invoice-stats';
import { InvoiceStatsFilters } from '@/features/finances/invoices/components/invoice-stats-filters';
import { InvoiceDrawer } from '@/features/finances/invoices/components/invoice-drawer';
import { InvoiceTable } from '@/features/finances/invoices/components/invoice-table';
import { MarkAsPaidDialog } from '@/features/finances/invoices/components/mark-as-paid-dialog';
import { CancelInvoiceDialog } from '@/features/finances/invoices/components/cancel-invoice-dialog';
import { DeleteInvoiceDialog } from '@/features/finances/invoices/components/delete-invoice-dialog';
import { SendReceiptDialog } from '@/features/finances/invoices/components/send-receipt-dialog';
import type {
  InvoicePagination,
  MarkInvoiceAsPaidData,
  CancelInvoiceData,
  StatsDateFilter,
} from '@/features/finances/invoices/types';
import { createInvoiceColumns } from '@/features/finances/invoices/components/invoice-columns';

enum ModalType {
  Delete = 'delete',
  MarkPaid = 'markPaid',
  Cancel = 'cancel',
  SendReceipt = 'sendReceipt',
}

type ModalState = { type: ModalType; id: string } | null;

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
  const [modalState, setModalState] = useState<ModalState>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [statsDateFilter, setStatsDateFilter] = useState<StatsDateFilter>({});

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useInvoiceStatistics(statsDateFilter);

  const deleteInvoice = useDeleteInvoice();
  const sendReminder = useSendInvoiceReminder();
  const markAsPending = useMarkInvoiceAsPending();
  const markAsPaid = useMarkInvoiceAsPaid();
  const cancelInvoice = useCancelInvoice();
  const downloadPdf = useDownloadInvoicePdf();
  const downloadReceiptPdf = useDownloadReceiptPdf();

  const handleAction = (type: ModalType, id: string) => {
    setModalState({ type, id });
  };

  const confirmDelete = () => {
    if (modalState?.type === ModalType.Delete) {
      deleteInvoice.mutate(modalState.id);
      setModalState(null);
    }
  };

  const confirmMarkAsPaid = (input: MarkInvoiceAsPaidData) => {
    markAsPaid.mutate(input);
    setModalState(null);
  };

  const confirmCancel = (input: CancelInvoiceData) => {
    cancelInvoice.mutate(input);
    setModalState(null);
  };

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  const handleMarkAsPending = (id: string) => {
    markAsPending.mutate(id);
  };

  const handleDownloadPdf = (id: string) => {
    downloadPdf.mutate(id);
  };

  const handleSendReceipt = (id: string) => {
    handleAction(ModalType.SendReceipt, id);
  };

  const handleDownloadReceiptPdf = async () => {
    if (!fullInvoice) {
      return;
    }

    downloadReceiptPdf.mutate(fullInvoice.id);
  };

  const selectedInvoice = useMemo(() => {
    if (!modalState?.id) {
      return null;
    }

    return data.items.find((i) => i.id === modalState.id) ?? null;
  }, [modalState?.id, data.items]);

  const { data: fullInvoice } = useInvoice(
    modalState?.type === ModalType.SendReceipt ? modalState.id : undefined,
  );

  const columns = useMemo(
    () =>
      createInvoiceColumns(
        (id) => handleAction(ModalType.Delete, id),
        (id) => sendReminder.mutate(id),
        (id) => handleMarkAsPending(id),
        (id) => handleAction(ModalType.MarkPaid, id),
        (id) => handleAction(ModalType.Cancel, id),
        (id) => handleDownloadPdf(id),
        (id) => handleSendReceipt(id),
      ),
    [sendReminder, markAsPending, handleAction, data.items],
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

      <InvoiceTable table={table} items={data.items} totalItems={data.pagination.totalItems} />

      <DeleteInvoiceDialog
        open={modalState?.type === ModalType.Delete}
        onOpenChange={(open) => !open && setModalState(null)}
        onConfirm={confirmDelete}
        isPending={deleteInvoice.isPending}
      />

      {modalState?.type === ModalType.MarkPaid && selectedInvoice && (
        <MarkAsPaidDialog
          open
          onOpenChange={(open) => !open && setModalState(null)}
          onConfirm={confirmMarkAsPaid}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoiceNumber}
          isPending={markAsPaid.isPending}
        />
      )}

      {modalState?.type === ModalType.Cancel && selectedInvoice && (
        <CancelInvoiceDialog
          open
          onOpenChange={(open) => !open && setModalState(null)}
          onConfirm={confirmCancel}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoiceNumber}
          isPending={cancelInvoice.isPending}
        />
      )}

      {modalState?.type === ModalType.SendReceipt && fullInvoice && (
        <SendReceiptDialog
          open
          onOpenChange={(open) => !open && setModalState(null)}
          invoice={fullInvoice}
          onDownload={handleDownloadReceiptPdf}
          onSendEmail={async () => {
            // TODO: Implement email sending functionality
          }}
        />
      )}

      {/* {!hideCreateDrawer && showCreateModal ? (
        <InvoiceDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null} */}

      {showCreateModal ? (
        <InvoiceDrawer open={showCreateModal} onClose={handleShowCreateModal} />
      ) : null}
    </Box>
  );
}
