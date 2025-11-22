'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  Check,
  Eye,
  EyeOff,
  Download,
  MoreHorizontalIcon,
  Save,
  Send,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { QuoteStatusSchema } from '@/zod/inputTypeSchemas/QuoteStatusSchema';
import type { CreateQuoteInput, UpdateQuoteInput } from '@/schemas/quotes';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useQuote,
  useCreateQuote,
  useUpdateQuote,
  useMarkQuoteAsAccepted,
  useMarkQuoteAsRejected,
  useMarkQuoteAsSent,
  useConvertQuoteToInvoice,
  useDeleteQuote,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { downloadQuotePdf } from '@/features/finances/quotes/utils/quoteHelpers';
import { QuoteForm } from '@/features/finances/quotes/components/quote-form';
import { QuoteDrawerSkeleton } from '@/features/finances/quotes/components/quote-drawer-skeleton';
import { QuoteStatusBadge } from '@/features/finances/quotes/components/quote-status-badge';
import { QuotePreview } from '@/features/finances/quotes/components/quote-preview';
import { DeleteQuoteDialog } from '@/features/finances/quotes/components/delete-quote-dialog';
import { useQuoteQueryString } from '@/features/finances/quotes/hooks/use-quote-query-string';
import { searchParams, quoteSearchParamsDefaults } from '@/filters/quotes/quotes-filters';

type DrawerMode = 'edit' | 'create';

export function QuoteDrawer({
  id,
  open,
  onClose,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: quote, isLoading, error, isError } = useQuote(id);

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const markAsAccepted = useMarkQuoteAsAccepted();
  const markAsRejected = useMarkQuoteAsRejected();
  const markAsSent = useMarkQuoteAsSent();
  const convertToInvoice = useConvertQuoteToInvoice();
  const deleteQuote = useDeleteQuote();

  const router = useRouter();
  const queryString = useQuoteQueryString(searchParams, quoteSearchParamsDefaults);

  const mode: DrawerMode = id ? 'edit' : 'create';
  const isOpen = id ? (pathname?.includes(`/quotes/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (id) {
          // Navigate back to list
          const basePath = '/finances/quotes';
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
    (data: CreateQuoteInput) => {
      createQuote.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [createQuote, onClose],
  );

  const handleUpdate = useCallback(
    (data: UpdateQuoteInput) => {
      updateQuote.mutate(data, {
        onSuccess: () => {
          setHasUnsavedChanges(false);
        },
      });
    },
    [updateQuote],
  );

  const handleAccept = useCallback(() => {
    if (!quote) return;
    markAsAccepted.mutate(
      { id: quote.id, acceptedDate: new Date() },
      {
        onSuccess: () => {
          setShowAcceptDialog(false);
          toast.success('Quote accepted');
        },
      },
    );
  }, [quote, markAsAccepted]);

  const handleReject = useCallback(() => {
    if (!quote) return;
    const rejectReason = prompt('Please provide a reason for rejection:');
    if (!rejectReason) return;

    markAsRejected.mutate(
      { id: quote.id, rejectedDate: new Date(), rejectReason },
      {
        onSuccess: () => {
          setShowRejectDialog(false);
          toast.success('Quote rejected');
        },
      },
    );
  }, [quote, markAsRejected]);

  const handleSend = useCallback(() => {
    if (!quote) return;
    markAsSent.mutate(quote.id, {
      onSuccess: () => {
        toast.success('Quote marked as sent');
      },
    });
  }, [quote, markAsSent]);

  const handleConvert = useCallback(() => {
    if (!quote) return;
    const dueDateStr = prompt('Enter invoice due date (YYYY-MM-DD):');
    if (!dueDateStr) return;

    const dueDate = new Date(dueDateStr);
    if (isNaN(dueDate.getTime())) {
      toast.error('Invalid date format');
      return;
    }

    convertToInvoice.mutate(
      { id: quote.id, dueDate },
      {
        onSuccess: (data) => {
          setShowConvertDialog(false);
          toast.success(`Quote converted to invoice ${data.invoiceNumber}`);
          router.push(`/finances/invoices/${data.invoiceId}`);
        },
      },
    );
  }, [quote, convertToInvoice, router]);

  const handleDelete = useCallback(() => {
    if (!quote) return;
    deleteQuote.mutate(quote.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        const basePath = '/finances/quotes';
        const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
        router.push(targetPath);
      },
    });
  }, [quote, deleteQuote, router, queryString]);

  const handleDownloadPdf = useCallback(async () => {
    if (!quote) {
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
            const form = document.getElementById('form-rhf-quote');
            if (form && form instanceof HTMLFormElement) {
              form.requestSubmit();
            }
          },
        },
      });

      return;
    }

    await downloadQuotePdf(quote);
  }, [quote, hasUnsavedChanges]);

  const canAccept = quote?.status === QuoteStatusSchema.enum.SENT;
  const canReject = quote?.status === QuoteStatusSchema.enum.SENT;
  const canSend = quote?.status === QuoteStatusSchema.enum.DRAFT;
  const canConvert = quote?.status === QuoteStatusSchema.enum.ACCEPTED;
  const canDelete =
    quote?.status === QuoteStatusSchema.enum.DRAFT ||
    quote?.status === QuoteStatusSchema.enum.REJECTED ||
    quote?.status === QuoteStatusSchema.enum.EXPIRED;

  const getDrawerHeader = () => {
    if (mode === 'create') {
      return {
        title: 'New Quote',
        status: null,
      };
    }

    return {
      title: 'Update Quote',
      status: quote?.status ?? null,
    };
  };

  const { title, status } = getDrawerHeader();

  return (
    <>
      <Drawer open={isOpen} modal={true} onOpenChange={handleOpenChange}>
        <DrawerContent
          className="overflow-x-hidden dark:bg-gray-925 pb-0!"
          style={{
            maxWidth: mode === 'edit' && showPreview ? '90vw' : '850px',
          }}
        >
          {isLoading ? <QuoteDrawerSkeleton /> : null}

          {isError ? (
            <Box className="p-6 text-destructive">
              <DrawerHeader>
                <DrawerTitle>Error</DrawerTitle>
              </DrawerHeader>
              <p className="mt-4">Could not load quote details: {error?.message}</p>
            </Box>
          ) : null}

          {(quote && !isLoading && !isError) || mode === 'create' ? (
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
                      <QuoteStatusBadge status={status} />
                    </DrawerDescription>
                  ) : null}
                </Box>

                {/* Preview Button and Actions */}
                <Box className="flex items-center gap-2">
                  {mode === 'edit' ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
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
                      form="form-rhf-quote"
                      size="sm"
                      disabled={createQuote.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save as Draft
                    </Button>
                  ) : null}

                  {mode === 'edit' && quote ? (
                    <>
                      {quote.status !== QuoteStatusSchema.enum.ACCEPTED &&
                      quote.status !== QuoteStatusSchema.enum.CONVERTED ? (
                        <Button
                          type="submit"
                          form="form-rhf-quote"
                          size="sm"
                          variant="outline"
                          disabled={updateQuote.isPending || !hasUnsavedChanges}
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
                            disabled={updateQuote.isPending}
                            className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10 cursor-pointer"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-52">
                          {canSend ? (
                            <DropdownMenuItem onClick={handleSend}>
                              <Send className="h-4 w-4" />
                              Mark as sent
                            </DropdownMenuItem>
                          ) : null}

                          {canAccept ? (
                            <DropdownMenuItem onClick={() => setShowAcceptDialog(true)}>
                              <Check className="h-4 w-4" />
                              Accept quote
                            </DropdownMenuItem>
                          ) : null}

                          {canReject ? (
                            <DropdownMenuItem onClick={handleReject}>
                              <X className="h-4 w-4" />
                              Reject quote
                            </DropdownMenuItem>
                          ) : null}

                          {canConvert ? (
                            <DropdownMenuItem onClick={handleConvert}>
                              <FileCheck className="h-4 w-4" />
                              Convert to invoice
                            </DropdownMenuItem>
                          ) : null}

                          <DropdownMenuItem onClick={handleDownloadPdf}>
                            <Download className="h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>

                          {canDelete ? (
                            <DropdownMenuItem
                              onClick={() => setShowDeleteDialog(true)}
                              className="text-destructive focus:text-destructive hover:text-destructive bg-red-50/50 hover:bg-red-100/50 dark:bg-red-900/20 hover:dark:bg-red-900/30"
                            >
                              <AlertCircle className="h-4 w-4" />
                              Delete quote
                            </DropdownMenuItem>
                          ) : null}
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
                      <QuoteForm
                        onCreate={handleCreate}
                        isCreating={createQuote.isPending}
                        onDirtyStateChange={setHasUnsavedChanges}
                      />
                    ) : (
                      <QuoteForm
                        quote={quote}
                        onUpdate={handleUpdate}
                        isUpdating={updateQuote.isPending}
                        onDirtyStateChange={setHasUnsavedChanges}
                      />
                    )}
                  </Box>
                  {mode === 'edit' && showPreview && quote ? (
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
                        <QuotePreview quote={quote} />
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              </DrawerBody>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && quote?.id ? (
        <DeleteQuoteDialog
          open={showDeleteDialog}
          isPending={deleteQuote.isPending}
          onOpenChange={setShowDeleteDialog}
          onDelete={handleDelete}
        />
      ) : null}

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept this quote? You can convert it to an invoice
              afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept}>Accept Quote</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
