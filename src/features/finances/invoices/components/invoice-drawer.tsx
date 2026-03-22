'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const isOpen = id ? (pathname?.includes(`/invoices/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
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
    [id, onClose, router, queryString],
  );

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

    if (hasUnsavedChanges) {
      toast.warning('You have unsaved changes', {
        description:
          'Please save your changes before downloading the PDF to ensure it reflects the latest data.',
        duration: 5000,
        action: {
          label: 'Save Now',
          onClick: () => {
            const form = document.getElementById('form-rhf-invoice');
            if (form && form instanceof HTMLFormElement) {
              form.requestSubmit();
            }
          },
        },
      });

      return;
    }

    downloadPdf.mutate(invoice.id);
  }, [invoice, hasUnsavedChanges, downloadPdf]);

  const handleSendReminder = useCallback(() => {
    if (!invoice) {
      return;
    }

    sendReminder.mutate(invoice.id);
  }, [invoice, sendReminder]);

  const handleMarkAsPendingDialog = useCallback(() => {
    if (!invoice) {
      return;
    }

    openMarkAsPending(invoice.id, invoice.invoiceNumber);
  }, [invoice, openMarkAsPending]);

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

  const handleUnsavedChanges = useCallback((isDirty: boolean) => {
    setHasUnsavedChanges(isDirty);
  }, []);

  const handleDuplicate = useCallback(() => {
    if (!invoice) return;
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
  );
}
