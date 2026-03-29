'use client';

import { useMemo, useState, useCallback } from 'react';
import { SearchParams } from 'nuqs/server';
import { toast } from 'sonner';
import {
  previewInvoiceEmail,
  type InvoiceEmailType,
} from '@/actions/finances/invoices/preview-email';
import { EmailPreviewDialog, type EmailPreviewData } from '@/components/email/email-preview-dialog';

import { useDataTable } from '@/hooks/use-data-table';
import { Box } from '@/components/ui/box';
import { InvoiceTable } from '@/features/finances/invoices/components/invoice-table';
import { BulkActionsBar } from '@/features/finances/invoices/components/bulk-actions-bar';
import {
  useSendInvoiceReminder,
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
  const { openDelete, openRecordPayment, openCancel, openSendReceipt, openMarkAsPending } =
    useInvoiceActions();

  const perPage = Number(serverSearchParams.perPage) || DEFAULT_PAGE_SIZE;
  const pageCount = Math.ceil(data.pagination.totalItems / perPage);

  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData | null>(null);
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState(false);
  const [pendingEmailAction, setPendingEmailAction] = useState<{
    invoiceId: string;
    emailType: InvoiceEmailType;
  } | null>(null);

  const sendReminder = useSendInvoiceReminder();
  const downloadPdf = useDownloadInvoicePdf();
  const bulkUpdateStatus = useBulkUpdateInvoiceStatus();
  const duplicateInvoice = useDuplicateInvoice();
  const markAsDraft = useMarkInvoiceAsDraft();

  const handleLoadEmailPreview = useCallback(
    async (invoiceId: string, emailType: InvoiceEmailType) => {
      setIsLoadingEmailPreview(true);
      setShowEmailPreview(true);
      setPendingEmailAction({ invoiceId, emailType });

      try {
        const result = await previewInvoiceEmail(invoiceId, emailType);

        if (!result.success) {
          toast.error('Failed to load email preview', {
            description: result.error,
          });
          setShowEmailPreview(false);
          setPendingEmailAction(null);
          return;
        }

        setEmailPreviewData(result.data);
      } catch (error) {
        toast.error('Failed to load email preview', {
          description: error instanceof Error ? error.message : 'An error occurred',
        });
        setShowEmailPreview(false);
        setPendingEmailAction(null);
      } finally {
        setIsLoadingEmailPreview(false);
      }
    },
    [],
  );

  const handleSendReminder = useCallback(
    (id: string) => {
      handleLoadEmailPreview(id, 'reminder');
    },
    [handleLoadEmailPreview],
  );

  const handleMarkAsPending = useCallback(
    (id: string, _invoiceNumber: string) => {
      // Show email preview before marking as pending
      handleLoadEmailPreview(id, 'sent');
    },
    [handleLoadEmailPreview],
  );

  const handleConfirmSendEmail = useCallback(() => {
    if (!pendingEmailAction) {
      return;
    }

    const onSuccessCallback = () => {
      setShowEmailPreview(false);
      setEmailPreviewData(null);
      setPendingEmailAction(null);
    };

    // Handle different email types
    if (pendingEmailAction.emailType === 'reminder') {
      sendReminder.mutate(pendingEmailAction.invoiceId, { onSuccess: onSuccessCallback });
    } else if (pendingEmailAction.emailType === 'sent') {
      // Mark as pending AND send email
      openMarkAsPending(pendingEmailAction.invoiceId, '', onSuccessCallback);
    }
  }, [pendingEmailAction, sendReminder, openMarkAsPending]);

  const handleMarkAsPendingWithoutEmail = useCallback(() => {
    if (!pendingEmailAction) {
      return;
    }

    // Mark as pending but skip email
    setShowEmailPreview(false);
    setEmailPreviewData(null);
    setPendingEmailAction(null);

    openMarkAsPending(pendingEmailAction.invoiceId, '', undefined, false);
  }, [pendingEmailAction, openMarkAsPending]);

  const handleCancelEmailPreview = useCallback(() => {
    setShowEmailPreview(false);
    setEmailPreviewData(null);
    setPendingEmailAction(null);
  }, []);

  const columns = useMemo(
    () =>
      createInvoiceColumns(
        (id, number) => openDelete(id, number),
        (id) => handleSendReminder(id),
        (id, number) => handleMarkAsPending(id, number),
        (id, number) => openRecordPayment(id, number),
        (id, number) => openCancel(id, number),
        (id) => downloadPdf.mutate(id),
        (id) => markAsDraft.mutate(id),
        (id) => openSendReceipt(id),
        (id) => duplicateInvoice.mutate(id),
      ),
    [
      handleSendReminder,
      handleMarkAsPending,
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

      <EmailPreviewDialog
        open={showEmailPreview}
        onOpenChange={setShowEmailPreview}
        emailData={emailPreviewData}
        isLoading={isLoadingEmailPreview}
        onConfirm={handleConfirmSendEmail}
        onConfirmWithoutEmail={handleMarkAsPendingWithoutEmail}
        onCancel={handleCancelEmailPreview}
        isSending={sendReminder.isPending}
        isMarkingAsSent={false}
        showMarkAsSentOption={pendingEmailAction?.emailType === 'sent'}
        statusLabel="Pending"
      />
    </Box>
  );
}
