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
  useDeleteQuote,
  useMarkQuoteAsAccepted,
  useMarkQuoteAsRejected,
  useMarkQuoteAsSent,
  useMarkQuoteAsOnHold,
  useMarkQuoteAsCancelled,
  useConvertQuoteToInvoice,
  useDownloadQuotePdf,
  useCreateQuoteVersion,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { QuoteStats } from '@/features/finances/quotes/components/quote-stats';
import { QuoteTable } from '@/features/finances/quotes/components/quote-table';
import { QuoteDrawer } from '@/features/finances/quotes/components/quote-drawer';
import { RejectQuoteDialog } from '@/features/finances/quotes/components/reject-quote-dialog';
import { OnHoldDialog } from '@/features/finances/quotes/components/on-hold-dialog';
import { CancelQuoteDialog } from '@/features/finances/quotes/components/cancel-quote-dialog';
import { ConvertToInvoiceDialog } from '@/features/finances/quotes/components/convert-to-invoice-dialog';
import { DeleteQuoteDialog } from '@/features/finances/quotes/components/delete-quote-dialog';
import type { QuotePagination, StatsDateFilter } from '@/features/finances/quotes/types';
import type { QuoteListItem } from '@/features/finances/quotes/types';
import { createQuoteColumns } from '@/features/finances/quotes/components/quote-columns';

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

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showOnHoldDialog, setShowOnHoldDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteListItem | null>(null);

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuoteStatistics(statsDateFilter);

  const deleteQuote = useDeleteQuote();
  const markAsAccepted = useMarkQuoteAsAccepted();
  const markAsRejected = useMarkQuoteAsRejected();
  const markAsSent = useMarkQuoteAsSent();
  const markAsOnHold = useMarkQuoteAsOnHold();
  const markAsCancelled = useMarkQuoteAsCancelled();
  const convertToInvoice = useConvertQuoteToInvoice();
  const downloadPdf = useDownloadQuotePdf();
  const createVersion = useCreateQuoteVersion();

  const handleDelete = useCallback(
    (id: string) => {
      const quote = data.items.find((q) => q.id === id);
      if (quote) {
        setSelectedQuote(quote);
        setShowDeleteDialog(true);
      }
    },
    [data.items],
  );

  const confirmDelete = useCallback(
    (id: string) => {
      deleteQuote.mutate(id, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setSelectedQuote(null);
        },
      });
    },
    [deleteQuote],
  );

  const handleAccept = useCallback(
    (id: string) => {
      markAsAccepted.mutate({ id });
    },
    [markAsAccepted],
  );

  const handleReject = useCallback(
    (id: string) => {
      const quote = data.items.find((q) => q.id === id);
      if (quote) {
        setSelectedQuote(quote);
        setShowRejectDialog(true);
      }
    },
    [data.items],
  );

  const confirmReject = useCallback(
    (data: { id: string; rejectReason: string }) => {
      markAsRejected.mutate(data, {
        onSuccess: () => {
          setShowRejectDialog(false);
          setSelectedQuote(null);
        },
      });
    },
    [markAsRejected],
  );

  const handleSend = useCallback(
    (id: string) => {
      markAsSent.mutate(id);
    },
    [markAsSent],
  );

  const handleOnHold = useCallback(
    (id: string) => {
      const quote = data.items.find((q) => q.id === id);
      if (quote) {
        setSelectedQuote(quote);
        setShowOnHoldDialog(true);
      }
    },
    [data.items],
  );

  const confirmOnHold = useCallback(
    (data: { id: string; reason?: string }) => {
      markAsOnHold.mutate(data, {
        onSuccess: () => {
          setShowOnHoldDialog(false);
          setSelectedQuote(null);
        },
      });
    },
    [markAsOnHold],
  );

  const handleCancel = useCallback(
    (id: string) => {
      const quote = data.items.find((q) => q.id === id);
      if (quote) {
        setSelectedQuote(quote);
        setShowCancelDialog(true);
      }
    },
    [data.items],
  );

  const confirmCancel = useCallback(
    (data: { id: string; reason?: string }) => {
      markAsCancelled.mutate(data, {
        onSuccess: () => {
          setShowCancelDialog(false);
          setSelectedQuote(null);
        },
      });
    },
    [markAsCancelled],
  );

  const handleConvert = useCallback(
    (id: string) => {
      const quote = data.items.find((q) => q.id === id);
      if (quote) {
        setSelectedQuote(quote);
        setShowConvertDialog(true);
      }
    },
    [data.items],
  );

  const confirmConvert = useCallback(
    (data: { id: string; dueDate: Date; gst: number; discount: number }) => {
      convertToInvoice.mutate(data, {
        onSuccess: () => {
          setShowConvertDialog(false);
          setSelectedQuote(null);
        },
      });
    },
    [convertToInvoice],
  );

  const handleDownloadPdf = useCallback(
    (id: string) => {
      downloadPdf.mutate(id);
    },
    [downloadPdf],
  );

  const handleCreateVersion = useCallback(
    (id: string) => {
      createVersion.mutate(id);
    },
    [createVersion],
  );

  const handleShowCreateModal = () => {
    setShowCreateModal((prev) => !prev);
  };

  const columns = useMemo(
    () =>
      createQuoteColumns(
        handleDelete,
        handleAccept,
        handleReject,
        handleSend,
        handleOnHold,
        handleCancel,
        handleConvert,
        handleDownloadPdf,
        handleCreateVersion,
      ),
    [
      handleDelete,
      handleAccept,
      handleReject,
      handleSend,
      handleOnHold,
      handleCancel,
      handleConvert,
      handleDownloadPdf,
      handleCreateVersion,
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

      {/* Reject Quote Dialog */}
      {showRejectDialog && selectedQuote ? (
        <RejectQuoteDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          onConfirm={confirmReject}
          quoteId={selectedQuote.id}
          quoteNumber={selectedQuote.quoteNumber}
          isPending={markAsRejected.isPending}
        />
      ) : null}

      {/* On Hold Dialog */}
      {showOnHoldDialog && selectedQuote ? (
        <OnHoldDialog
          open={showOnHoldDialog}
          onOpenChange={setShowOnHoldDialog}
          onConfirm={confirmOnHold}
          quoteId={selectedQuote.id}
          quoteNumber={selectedQuote.quoteNumber}
          isPending={markAsOnHold.isPending}
        />
      ) : null}

      {/* Cancel Quote Dialog */}
      {showCancelDialog && selectedQuote ? (
        <CancelQuoteDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          onConfirm={confirmCancel}
          quoteId={selectedQuote.id}
          quoteNumber={selectedQuote.quoteNumber}
          isPending={markAsCancelled.isPending}
        />
      ) : null}

      {/* Convert to Invoice Dialog */}
      {showConvertDialog && selectedQuote ? (
        <ConvertToInvoiceDialog
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
          onConfirm={confirmConvert}
          quoteId={selectedQuote.id}
          quoteNumber={selectedQuote.quoteNumber}
          quoteGst={selectedQuote.gst}
          quoteDiscount={selectedQuote.discount}
          isPending={convertToInvoice.isPending}
        />
      ) : null}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedQuote ? (
        <DeleteQuoteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
          quoteId={selectedQuote.id}
          quoteNumber={selectedQuote.quoteNumber}
          isPending={deleteQuote.isPending}
        />
      ) : null}
    </Box>
  );
}
