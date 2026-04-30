'use client';

import { useCallback, useMemo, useState } from 'react';
import { SearchParams } from 'nuqs/server';
import { toast } from 'sonner';

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
  useToggleQuoteFavourite,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { QuoteTable } from '@/features/finances/quotes/components/quote-table';
import type { QuotePagination } from '@/features/finances/quotes/types';
import { createQuoteColumns } from '@/features/finances/quotes/components/quote-columns';
import { useQuoteActions } from '@/features/finances/quotes/context/quote-action-context';
import { previewQuoteEmail, type QuoteEmailType } from '@/actions/finances/quotes/preview-email';
import { EmailPreviewDialog, type EmailPreviewData } from '@/components/email/email-preview-dialog';
import type { QuoteStatus } from '@/zod/schemas/enums/QuoteStatus.schema';

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
  const toggleFavouriteMutation = useToggleQuoteFavourite();

  // Email preview state
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData | null>(null);
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState(false);
  const [pendingEmailAction, setPendingEmailAction] = useState<{
    quoteId: string;
    emailType: QuoteEmailType;
  } | null>(null);

  const handleBulkUpdateStatus = (ids: string[], status: QuoteStatus) => {
    bulkUpdateStatus.mutate({ ids, status });
  };

  const handleBulkDelete = (ids: string[]) => {
    bulkDelete.mutate(ids);
  };

  const isBulkPending = bulkUpdateStatus.isPending || bulkDelete.isPending;

  const handleLoadEmailPreview = useCallback(async (quoteId: string, emailType: QuoteEmailType) => {
    setIsLoadingEmailPreview(true);
    setShowEmailPreview(true);
    setPendingEmailAction({ quoteId, emailType });

    try {
      const result = await previewQuoteEmail(quoteId, emailType);

      if (!result.success) {
        toast.error('Failed to load email preview', {
          description: result.error,
        });
        setShowEmailPreview(false);
        return;
      }

      setEmailPreviewData(result.data);
    } catch (error) {
      toast.error('Failed to load email preview', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
      setShowEmailPreview(false);
    } finally {
      setIsLoadingEmailPreview(false);
    }
  }, []);

  const handleAccept = useCallback(
    (id: string) => {
      markAsAcceptedMutation.mutate({ id });
    },
    [markAsAcceptedMutation],
  );

  const handleSend = useCallback(
    (id: string) => {
      handleLoadEmailPreview(id, 'sent');
    },
    [handleLoadEmailPreview],
  );

  const handleDownloadPdf = useCallback(
    (id: string) => {
      downloadPdfMutation.mutate(id);
    },
    [downloadPdfMutation],
  );

  const handleSendEmail = useCallback(
    (id: string) => {
      handleLoadEmailPreview(id, 'sent');
    },
    [handleLoadEmailPreview],
  );

  const handleSendFollowUp = useCallback(
    (id: string) => {
      handleLoadEmailPreview(id, 'followup');
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

    const { quoteId, emailType } = pendingEmailAction;

    // Handle different email types
    if (emailType === 'followup') {
      sendFollowUpMutation.mutate(quoteId, { onSuccess: onSuccessCallback });
    } else if (emailType === 'sent') {
      // Mark as sent AND send email via Inngest
      markAsSentMutation.mutate(quoteId, { onSuccess: onSuccessCallback });
    } else if (emailType === 'reminder' || emailType === 'accepted' || emailType === 'rejected') {
      sendEmailMutation.mutate({ quoteId, type: emailType }, { onSuccess: onSuccessCallback });
    }
  }, [pendingEmailAction, sendEmailMutation, sendFollowUpMutation, markAsSentMutation]);

  const handleMarkAsSentWithoutEmail = useCallback(() => {
    if (!pendingEmailAction) {
      return;
    }

    // Mark as sent but skip email
    setShowEmailPreview(false);
    setEmailPreviewData(null);
    setPendingEmailAction(null);

    markAsSentMutation.mutate({ id: pendingEmailAction.quoteId, sendEmail: false });
  }, [pendingEmailAction, markAsSentMutation]);

  const handleCancelEmailPreview = useCallback(() => {
    setShowEmailPreview(false);
    setEmailPreviewData(null);
    setPendingEmailAction(null);
  }, []);

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

  const handleToggleFavourite = useCallback(
    (id: string) => {
      toggleFavouriteMutation.mutate(id);
    },
    [toggleFavouriteMutation],
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
        handleToggleFavourite,
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
      handleToggleFavourite,
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
    <>
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

      <EmailPreviewDialog
        open={showEmailPreview}
        onOpenChange={setShowEmailPreview}
        emailData={emailPreviewData}
        isLoading={isLoadingEmailPreview}
        onConfirm={handleConfirmSendEmail}
        onConfirmWithoutEmail={handleMarkAsSentWithoutEmail}
        onCancel={handleCancelEmailPreview}
        isSending={sendEmailMutation.isPending || sendFollowUpMutation.isPending}
        isMarkingAsSent={markAsSentMutation.isPending}
        showMarkAsSentOption={pendingEmailAction?.emailType === 'sent'}
      />
    </>
  );
}
