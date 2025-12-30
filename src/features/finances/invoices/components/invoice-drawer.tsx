'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Ban,
  Receipt,
  CreditCard,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  MoreHorizontalIcon,
  Save,
  Hourglass,
  BellRing,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import { InvoiceStatus } from '@/prisma/client';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/schemas/invoices';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useInvoiceBasic,
  useInvoiceItems,
  useInvoiceHistory,
  useInvoicePayments,
  useCreateInvoice,
  useMarkInvoiceAsPending,
  useMarkInvoiceAsDraft,
  useUpdateInvoice,
  useSendInvoiceReminder,
  useDownloadInvoicePdf,
  useDuplicateInvoice,
} from '@/features/finances/invoices/hooks/use-invoice-queries';
import { InvoiceForm } from '@/features/finances/invoices/components/invoice-form';
import { InvoiceDrawerSkeleton } from '@/features/finances/invoices/components/invoice-drawer-skeleton';
import { InvoicePreview } from '@/features/finances/invoices/components/invoice-preview';
import { InvoiceStatusBadge } from '@/features/finances/invoices/components/invoice-status-badge';
import { useInvoiceQueryString } from '@/features/finances/invoices/hooks/use-invoice-query-string';
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
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: invoice, isLoading, error, isError } = useInvoiceBasic(id);
  const { data: items, isLoading: isLoadingItems } = useInvoiceItems(id);
  const { data: history, isLoading: isLoadingHistory } = useInvoiceHistory(id);
  const { data: payments, isLoading: isLoadingPayments } = useInvoicePayments(id);
  const { openDelete, openRecordPayment, openCancel, openSendReceipt } = useInvoiceActions();

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const markAsPending = useMarkInvoiceAsPending();
  const sendReminder = useSendInvoiceReminder();
  const downloadPdf = useDownloadInvoicePdf();
  const duplicateInvoice = useDuplicateInvoice();
  const markAsDraft = useMarkInvoiceAsDraft();

  const router = useRouter();
  const queryString = useInvoiceQueryString(searchParams, invoiceSearchParamsDefaults);

  const mode: DrawerMode = id ? 'edit' : 'create';
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

  const handleMarkAsPending = useCallback(() => {
    if (!invoice) {
      return;
    }

    markAsPending.mutate(invoice.id);
  }, [invoice, markAsPending]);

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

  const getDrawerHeader = () => {
    if (mode === 'create') {
      return {
        title: 'New Invoice',
        status: null,
      };
    }

    return {
      title: 'Update Invoice',
      status: invoice?.status ?? null,
    };
  };

  const { title, status } = getDrawerHeader();

  return (
    <>
      <Drawer key={id} open={isOpen} modal={true} onOpenChange={handleOpenChange}>
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
              {/* Custom Header with Toggle */}
              <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
                <Box className="mt-1 flex flex-col flex-1">
                  <Box className="flex items-center gap-2">
                    <DrawerTitle>{title}</DrawerTitle>
                    {mode === 'edit' && hasUnsavedChanges ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                        <AlertCircle className="h-3 w-3" />
                        Unsaved changes
                      </span>
                    ) : null}
                  </Box>
                  {status ? (
                    <DrawerDescription>
                      <InvoiceStatusBadge status={status} />
                    </DrawerDescription>
                  ) : null}
                </Box>

                {/* Preview Button and Actions */}
                <Box className="flex items-center gap-2">
                  {mode === 'edit' ? (
                    <Button type="button" variant="outline" size="sm" onClick={handleTogglePreview}>
                      {showPreview ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Show Preview
                        </>
                      )}
                    </Button>
                  ) : null}

                  {mode === 'create' ? (
                    <Button
                      type="submit"
                      form="form-rhf-invoice"
                      size="sm"
                      disabled={createInvoice.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save as Draft
                    </Button>
                  ) : null}

                  {mode === 'edit' && invoice ? (
                    <>
                      {invoice.status !== InvoiceStatus.PAID ? (
                        <Button
                          type="submit"
                          form="form-rhf-invoice"
                          size="sm"
                          variant="outline"
                          disabled={updateInvoice.isPending || !hasUnsavedChanges}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      ) : null}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="More Options"
                            disabled={updateInvoice.isPending}
                            className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10 cursor-pointer"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={handleDuplicate}>
                            <Copy className="h-4 w-4" />
                            Duplicate invoice
                          </DropdownMenuItem>
                          {invoice.status === InvoiceStatus.DRAFT && (
                            <DropdownMenuItem onClick={handleMarkAsPending}>
                              <Hourglass className="h-4 w-4" />
                              Mark as pending
                            </DropdownMenuItem>
                          )}
                          {invoice.status === InvoiceStatus.PENDING && (
                            <DropdownMenuItem onClick={handleMarkAsDraft}>
                              <RotateCcw className="h-4 w-4" />
                              Revert to draft
                            </DropdownMenuItem>
                          )}
                          {invoice.status === InvoiceStatus.PENDING ||
                          invoice.status === InvoiceStatus.OVERDUE ||
                          invoice.status === InvoiceStatus.PARTIALLY_PAID ? (
                            <>
                              <DropdownMenuItem onClick={handleRecordPaymentDialog}>
                                <CreditCard className="h-4 w-4" />
                                Record payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleSendReminder}>
                                <BellRing className="h-4 w-4" />
                                Send reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={handleCancelDialog}
                                className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
                              >
                                <Ban className="h-4 w-4" />
                                Cancel invoice
                              </DropdownMenuItem>
                            </>
                          ) : null}

                          {invoice.status === InvoiceStatus.PAID ? (
                            <>
                              <DropdownMenuItem onClick={handleDownloadPdf}>
                                <Download className="h-4 w-4" />
                                Download invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleOpenReceiptDialog}>
                                <Receipt className="h-4 w-4" />
                                Send receipt
                              </DropdownMenuItem>
                            </>
                          ) : null}

                          {invoice.status === InvoiceStatus.DRAFT && (
                            <DropdownMenuItem
                              onClick={handleDeleteDialog}
                              className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
                            >
                              <AlertCircle className="h-4 w-4" />
                              Delete invoice
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  ) : null}

                  <Button
                    variant="ghost"
                    className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
                    onClick={() => handleOpenChange(false)}
                  >
                    <X className="size-5" aria-hidden="true" />
                    <span className="sr-only">Close</span>
                  </Button>
                </Box>
              </Box>

              <DrawerBody className="py-0! -mx-6 h-full overflow-y-auto">
                <Box className="flex h-full">
                  <Box
                    className="overflow-y-auto"
                    style={{
                      width: mode === 'edit' && showPreview ? '50%' : '100%',
                    }}
                  >
                    {mode === 'create' ? (
                      <InvoiceForm onCreate={handleCreate} isCreating={createInvoice.isPending} />
                    ) : (
                      <InvoiceForm
                        invoice={invoice}
                        items={items}
                        statusHistory={history}
                        onUpdate={handleUpdate}
                        isUpdating={updateInvoice.isPending}
                        isLoadingItems={isLoadingItems}
                        isLoadingHistory={isLoadingHistory}
                        onDirtyStateChange={handleUnsavedChanges}
                      />
                    )}
                  </Box>

                  {mode === 'edit' && showPreview && invoice ? (
                    <Box
                      className="border-l dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col"
                      style={{ width: '50%' }}
                    >
                      {/* Preview Header */}
                      <Box className="px-8 py-4 border-b dark:border-gray-800 bg-white dark:bg-gray-925 flex items-center justify-between">
                        <p className="text-lg font-semibold">Preview</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleDownloadPdf}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download PDF</span>
                        </Button>
                      </Box>

                      {/* HTML Preview Content */}
                      <Box className="flex-1 overflow-hidden">
                        <InvoicePreview
                          invoice={invoice}
                          items={items}
                          payments={payments}
                          isLoadingItems={isLoadingItems}
                          isLoadingPayments={isLoadingPayments}
                        />
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              </DrawerBody>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </>
  );
}
