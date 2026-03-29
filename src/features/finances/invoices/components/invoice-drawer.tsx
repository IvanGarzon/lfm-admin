'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  previewInvoiceEmail,
  type InvoiceEmailType,
} from '@/actions/finances/invoices/preview-email';
import { EmailPreviewDialog, type EmailPreviewData } from '@/components/email/email-preview-dialog';

import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useInvoiceMetadata,
  useInvoiceItems,
  useInvoiceHistory,
  useInvoicePayments,
  useCreateInvoice,
  useMarkInvoiceAsDraft,
  useUpdateInvoice,
  useSendInvoiceReminder,
  useDownloadInvoicePdf,
  useDuplicateInvoice,
} from '@/features/finances/invoices/hooks/use-invoice-queries';
import { InvoiceForm } from '@/features/finances/invoices/components/invoice-form';
import { InvoiceDrawerSkeleton } from '@/features/finances/invoices/components/invoice-drawer-skeleton';
import { InvoiceDrawerHeader } from '@/features/finances/invoices/components/invoice-drawer-header';
import { InvoiceStatusHistory } from '@/features/finances/invoices/components/invoice-status-history';
import { InvoicePayments } from '@/features/finances/invoices/components/invoice-payments';
import { InvoicePreviewPanel } from '@/features/finances/invoices/components/invoice-preview-panel';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, invoiceSearchParamsDefaults } from '@/filters/invoices/invoices-filters';
import { useInvoiceActions } from '@/features/finances/invoices/context/invoice-action-context';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning';

type DrawerMode = 'edit' | 'create';

export function InvoiceDrawer({
  id,
  open,
  onClose,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);
  const [emailPreviewData, setEmailPreviewData] = useState<EmailPreviewData | null>(null);
  const [isLoadingEmailPreview, setIsLoadingEmailPreview] = useState<boolean>(false);
  const [pendingEmailType, setPendingEmailType] = useState<InvoiceEmailType | null>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState<boolean>(false);

  const mode: DrawerMode = id ? 'edit' : 'create';

  const { data: invoice, isLoading: isLoadingInvoice, error, isError } = useInvoiceMetadata(id);

  const needsItems = activeTab === 'details' || showPreview;
  const { data: items, isLoading: isLoadingItems } = useInvoiceItems(id, {
    enabled: needsItems,
  });

  const isLoading = isLoadingInvoice || (needsItems && isLoadingItems);

  const { data: history, isLoading: isLoadingHistory } = useInvoiceHistory(id, {
    enabled: mode === 'edit' && activeTab === 'history',
  });

  const { data: payments, isLoading: isLoadingPayments } = useInvoicePayments(id, {
    enabled: mode === 'edit' && (activeTab === 'payments' || showPreview),
  });

  const { openDelete, openRecordPayment, openCancel, openSendReceipt, openMarkAsPending } =
    useInvoiceActions();

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const sendReminder = useSendInvoiceReminder();
  const downloadPdf = useDownloadInvoicePdf();
  const duplicateInvoice = useDuplicateInvoice();
  const markAsDraft = useMarkInvoiceAsDraft();

  const router = useRouter();
  const queryString = useQueryString(searchParams, invoiceSearchParamsDefaults);

  const checkUnsavedChanges = useUnsavedChangesWarning(hasUnsavedChanges, {
    formId: 'form-rhf-invoice',
  });

  const isOpen = id ? (pathname?.includes(`/invoices/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        // Check for unsaved changes before closing
        if (hasUnsavedChanges) {
          setShowUnsavedChangesDialog(true);
          return;
        }

        if (id) {
          // Navigate back to list
          const basePath = '/finances/invoices';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        } else {
          onClose?.();
        }
      }
    },
    [id, onClose, router, queryString, hasUnsavedChanges],
  );

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    setHasUnsavedChanges(false);

    if (id) {
      const basePath = '/finances/invoices';
      const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
      router.push(targetPath);
    } else {
      onClose?.();
    }
  }, [id, onClose, router, queryString]);

  const handleSaveChanges = useCallback(() => {
    setShowUnsavedChangesDialog(false);
    const form = document.getElementById('form-rhf-invoice');
    if (form && form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  }, []);

  const handleCreate = useCallback(
    (data: CreateInvoiceInput) => {
      createInvoice.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [createInvoice, onClose],
  );

  const handleUpdate = useCallback(
    (data: UpdateInvoiceInput) => {
      updateInvoice.mutate(data, {
        onSuccess: () => {
          setHasUnsavedChanges(false);
        },
      });
    },
    [updateInvoice],
  );

  const handleDownloadPdf = useCallback(() => {
    if (!invoice) {
      return;
    }

    checkUnsavedChanges(
      () => downloadPdf.mutate(invoice.id),
      'Please save your changes before downloading the PDF to ensure it reflects the latest data.',
    );
  }, [invoice, checkUnsavedChanges, downloadPdf]);

  const handleLoadEmailPreview = useCallback(
    async (emailType: InvoiceEmailType) => {
      if (!invoice) {
        return;
      }

      setIsLoadingEmailPreview(true);
      setShowEmailPreview(true);
      setPendingEmailType(emailType);

      try {
        const result = await previewInvoiceEmail(invoice.id, emailType);

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
    },
    [invoice],
  );

  const handleSendReminder = useCallback(() => {
    if (!invoice) {
      return;
    }

    checkUnsavedChanges(
      () => handleLoadEmailPreview('reminder'),
      'Please save your changes before sending the reminder to ensure it reflects the latest data.',
    );
  }, [invoice, checkUnsavedChanges, handleLoadEmailPreview]);

  const handleMarkAsPendingDialog = useCallback(() => {
    if (!invoice) {
      return;
    }

    checkUnsavedChanges(
      () => handleLoadEmailPreview('sent'),
      'Please save your changes before marking as pending to ensure the invoice reflects the latest data.',
    );
  }, [invoice, checkUnsavedChanges, handleLoadEmailPreview]);

  const handleMarkAsDraft = useCallback(() => {
    if (!invoice) {
      return;
    }

    markAsDraft.mutate(invoice.id);
  }, [invoice, markAsDraft]);

  const handleTogglePreview = useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  const handleRecordPaymentDialog = useCallback(() => {
    if (!invoice) return;
    openRecordPayment(invoice.id, invoice.invoiceNumber, invoice, () => {
      // Optional success callback (e.g., could open receipt dialog if fully paid)
    });
  }, [invoice, openRecordPayment]);

  const handleCancelDialog = useCallback(() => {
    if (!invoice) return;
    openCancel(invoice.id, invoice.invoiceNumber);
  }, [invoice, openCancel]);

  const handleDeleteDialog = useCallback(() => {
    if (!invoice) return;
    openDelete(invoice.id, invoice.invoiceNumber, () => {
      const basePath = '/finances/invoices';
      const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
      router.push(targetPath);
    });
  }, [invoice, openDelete, router, queryString]);

  const handleOpenReceiptDialog = useCallback(() => {
    if (!invoice) return;
    openSendReceipt(invoice.id, invoice);
  }, [invoice, openSendReceipt]);

  const handleConfirmSendEmail = useCallback(() => {
    if (!invoice || !pendingEmailType) {
      return;
    }

    const onSuccessCallback = () => {
      setShowEmailPreview(false);
      setEmailPreviewData(null);
      setPendingEmailType(null);
    };

    // Handle different email types
    if (pendingEmailType === 'reminder') {
      sendReminder.mutate(invoice.id, { onSuccess: onSuccessCallback });
    } else if (pendingEmailType === 'sent') {
      // Mark as pending AND send email
      openMarkAsPending(invoice.id, invoice.invoiceNumber, onSuccessCallback);
    }
  }, [invoice, pendingEmailType, sendReminder, openMarkAsPending]);

  const handleMarkAsPendingWithoutEmail = useCallback(() => {
    if (!invoice) {
      return;
    }

    // Mark as pending but skip email
    setShowEmailPreview(false);
    setEmailPreviewData(null);
    setPendingEmailType(null);

    openMarkAsPending(invoice.id, invoice.invoiceNumber, undefined, false);
  }, [invoice, openMarkAsPending]);

  const handleCancelEmailPreview = useCallback(() => {
    setShowEmailPreview(false);
    setEmailPreviewData(null);
    setPendingEmailType(null);
  }, []);

  const handleUnsavedChanges = useCallback((isDirty: boolean) => {
    setHasUnsavedChanges(isDirty);
  }, []);

  const handleDuplicate = useCallback(() => {
    if (!invoice) {
      return;
    }

    duplicateInvoice.mutate(invoice.id, {
      onSuccess: (data) => {
        // Navigate to the new duplicated invoice
        const basePath = `/finances/invoices/${data.id}`;
        const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
        router.push(targetPath);
      },
    });
  }, [invoice, duplicateInvoice, router, queryString]);

  const { title, status } = useMemo(() => {
    if (mode === 'create') {
      return {
        title: 'New Invoice',
        status: null,
      };
    }

    return {
      title: invoice?.invoiceNumber || 'Update Invoice',
      status: invoice?.status ?? null,
    };
  }, [mode, invoice?.invoiceNumber, invoice?.status]);

  const actionsMenuHandlers = useMemo(
    () => ({
      onDuplicate: handleDuplicate,
      onMarkAsPending: handleMarkAsPendingDialog,
      onMarkAsDraft: handleMarkAsDraft,
      onRecordPayment: handleRecordPaymentDialog,
      onSendReminder: handleSendReminder,
      onCancel: handleCancelDialog,
      onDownloadPdf: handleDownloadPdf,
      onSendReceipt: handleOpenReceiptDialog,
      onDelete: handleDeleteDialog,
    }),
    [
      handleDuplicate,
      handleMarkAsPendingDialog,
      handleMarkAsDraft,
      handleRecordPaymentDialog,
      handleSendReminder,
      handleCancelDialog,
      handleDownloadPdf,
      handleOpenReceiptDialog,
      handleDeleteDialog,
    ],
  );

  return (
    <>
      <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
        <DrawerContent
          className="overflow-x-hidden dark:bg-gray-925 pb-0!"
          style={{
            maxWidth: mode === 'edit' && showPreview ? '90vw' : '850px',
          }}
        >
          {isLoading ? <InvoiceDrawerSkeleton /> : null}

          {isError ? (
            <Box className="p-6 text-destructive">
              <DrawerHeader>
                <DrawerTitle>Error</DrawerTitle>
              </DrawerHeader>
              <p className="mt-4">Could not load invoice details: {error?.message}</p>
            </Box>
          ) : null}

          {(invoice && !isLoading && !isError) || mode === 'create' ? (
            <>
              <InvoiceDrawerHeader
                mode={mode}
                title={title}
                status={status}
                hasUnsavedChanges={hasUnsavedChanges}
                showPreview={showPreview}
                isCreating={createInvoice.isPending}
                isUpdating={updateInvoice.isPending}
                onTogglePreview={handleTogglePreview}
                onClose={() => handleOpenChange(false)}
                invoice={invoice}
                actionsMenuHandlers={mode === 'edit' && invoice ? actionsMenuHandlers : undefined}
              />

              <DrawerBody className="py-0! -mx-6 h-full overflow-y-auto">
                <Box className="flex h-full">
                  <Box
                    className="h-full"
                    style={{
                      width: mode === 'edit' && showPreview ? '50%' : '100%',
                    }}
                  >
                    {mode === 'create' ? (
                      <InvoiceForm
                        onCreate={handleCreate}
                        isCreating={createInvoice.isPending}
                        onDirtyStateChange={handleUnsavedChanges}
                      />
                    ) : (
                      <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full h-full flex flex-col"
                      >
                        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent px-6">
                          <TabsTrigger value="details" className="relative">
                            Invoice Details
                          </TabsTrigger>
                          <TabsTrigger value="payments" className="relative">
                            Payments
                            {invoice && invoice._count && invoice._count.payments > 0 ? (
                              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                                {invoice._count.payments}
                              </Badge>
                            ) : null}
                          </TabsTrigger>
                          <TabsTrigger value="history" className="relative">
                            History
                            {invoice && invoice._count && invoice._count.statusHistory > 0 ? (
                              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                                {invoice._count.statusHistory}
                              </Badge>
                            ) : null}
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-0 h-full flex flex-col">
                          <InvoiceForm
                            invoice={invoice}
                            items={items}
                            onUpdate={handleUpdate}
                            isUpdating={updateInvoice.isPending}
                            isLoadingItems={isLoadingItems}
                            onDirtyStateChange={handleUnsavedChanges}
                          />
                        </TabsContent>

                        <TabsContent value="payments" className="mt-0 p-6">
                          {isLoadingPayments ? (
                            <Box className="text-center py-12 text-muted-foreground">
                              Loading payments...
                            </Box>
                          ) : payments && payments.length > 0 && invoice ? (
                            <InvoicePayments payments={payments} invoiceAmount={invoice.amount} />
                          ) : (
                            <Box className="text-center py-12 text-muted-foreground">
                              No payments recorded yet
                            </Box>
                          )}
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 p-6">
                          {isLoadingHistory ? (
                            <Box className="text-center py-12 text-muted-foreground">
                              Loading history...
                            </Box>
                          ) : history && history.length > 0 ? (
                            <InvoiceStatusHistory history={history} />
                          ) : (
                            <Box className="text-center py-12 text-muted-foreground">
                              No history available
                            </Box>
                          )}
                        </TabsContent>
                      </Tabs>
                    )}
                  </Box>

                  {mode === 'edit' && showPreview && invoice ? (
                    <InvoicePreviewPanel
                      invoice={invoice}
                      items={items}
                      payments={payments}
                      isLoadingItems={isLoadingItems}
                      isLoadingPayments={isLoadingPayments}
                      onDownloadPdf={handleDownloadPdf}
                    />
                  ) : null}
                </Box>
              </DrawerBody>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>

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
        showMarkAsSentOption={pendingEmailType === 'sent'}
        statusLabel="Pending"
      />

      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={handleDiscardChanges}>
              Discard changes
            </Button>
            <AlertDialogAction onClick={handleSaveChanges}>Save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
