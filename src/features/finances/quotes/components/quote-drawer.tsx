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
  Copy,
  ChevronLeft,
  ChevronRight,
  Pause,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';

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
  useMarkQuoteAsOnHold,
  useMarkQuoteAsCancelled,
  useConvertQuoteToInvoice,
  useDeleteQuote,
  useCreateQuoteVersion,
  useQuoteVersions,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { downloadQuotePdf, getQuotePermissions, QuoteStatus } from '@/features/finances/quotes/utils/quote-helpers';
import { QuoteForm } from '@/features/finances/quotes/components/quote-form';
import { QuoteDrawerSkeleton } from '@/features/finances/quotes/components/quote-drawer-skeleton';
import { QuoteStatusBadge } from '@/features/finances/quotes/components/quote-status-badge';
import { QuotePreview } from '@/features/finances/quotes/components/quote-preview';
import { RejectQuoteDialog } from '@/features/finances/quotes/components/reject-quote-dialog';
import { DeleteQuoteDialog } from '@/features/finances/quotes/components/delete-quote-dialog';
import { OnHoldDialog } from '@/features/finances/quotes/components/on-hold-dialog';
import { CancelQuoteDialog } from '@/features/finances/quotes/components/cancel-quote-dialog';
import { ConvertToInvoiceDialog } from '@/features/finances/quotes/components/convert-to-invoice-dialog';
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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showOnHoldDialog, setShowOnHoldDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: quote, isLoading, error, isError } = useQuote(id);
  const { data: versions } = useQuoteVersions(id);

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const markAsAccepted = useMarkQuoteAsAccepted();
  const markAsRejected = useMarkQuoteAsRejected();
  const markAsSent = useMarkQuoteAsSent();
  const markAsOnHold = useMarkQuoteAsOnHold();
  const markAsCancelled = useMarkQuoteAsCancelled();
  const convertToInvoice = useConvertQuoteToInvoice();
  const deleteQuote = useDeleteQuote();
  const createVersion = useCreateQuoteVersion();

  const router = useRouter();
  const queryString = useQuoteQueryString(searchParams, quoteSearchParamsDefaults);

  // Version navigation
  const currentVersionIndex = versions?.findIndex((v) => v.id === id) ?? -1;
  const hasPreviousVersion = currentVersionIndex > 0;
  const hasNextVersion = currentVersionIndex >= 0 && currentVersionIndex < (versions?.length ?? 0) - 1;
  const previousVersionId = hasPreviousVersion ? versions?.[currentVersionIndex - 1]?.id : null;
  const nextVersionId = hasNextVersion ? versions?.[currentVersionIndex + 1]?.id : null;

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
    if (!quote) {
      return;
    }

    markAsAccepted.mutate({ id: quote.id });
  }, [quote, markAsAccepted]);

  const handleReject = useCallback(() => {
    if (!quote) {
      return;
    }

    setShowRejectDialog(true);
  }, [quote]);

  const confirmReject = useCallback(
    (data: { id: string; rejectReason: string }) => {
      markAsRejected.mutate(data, {
        onSuccess: () => {
          setShowRejectDialog(false);
        },
      });
    },
    [markAsRejected],
  );

  const handleSend = useCallback(() => {
    if (!quote) {
      return;
    }

    markAsSent.mutate(quote.id);
  }, [quote, markAsSent]);

  const handleOnHold = useCallback(() => {
    if (!quote) {
      return;
    }

    setShowOnHoldDialog(true);
  }, [quote]);

  const confirmOnHold = useCallback(
    (data: { id: string; reason?: string }) => {
      markAsOnHold.mutate(data, {
        onSuccess: () => {
          setShowOnHoldDialog(false);
          toast.success('Quote put on hold');
        },
      });
    },
    [markAsOnHold],
  );

  const handleCancel = useCallback(() => {
    if (!quote) {
      return;
    }

    setShowCancelDialog(true);
  }, [quote]);

  const confirmCancel = useCallback(
    (data: { id: string; reason?: string }) => {
      markAsCancelled.mutate(data, {
        onSuccess: () => {
          setShowCancelDialog(false);
        },
      });
    },
    [markAsCancelled],
  );

  const handleConvert = useCallback(() => {
    if (!quote) {
      return;
    }

    setShowConvertDialog(true);
  }, [quote]);

  const confirmConvert = useCallback(
    (data: { id: string; dueDate: Date; gst: number; discount: number }) => {
      convertToInvoice.mutate(data, {
        onSuccess: () => {
          setShowConvertDialog(false);
        },
      });
    },
    [convertToInvoice],
  );

  const handleDelete = useCallback(() => {
    if (!quote) {
      return;
    }

    setShowDeleteDialog(true);
  }, [quote]);

  const confirmDelete = useCallback(
    (quoteId: string) => {
      deleteQuote.mutate(quoteId, {
        onSuccess: () => {
          setShowDeleteDialog(false);
          const basePath = '/finances/quotes';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        },
      });
    },
    [deleteQuote, router, queryString],
  );

  const handleCreateVersion = useCallback(() => {
    if (!quote) {
      return;
    }
    
    createVersion.mutate(quote.id, {
      onSuccess: (data) => {
        // Navigate to the newly created version
        const targetPath = `/finances/quotes/${data.id}`;
        router.push(targetPath);
      },
    });
  }, [quote, createVersion, router]);

  const handleNavigateToVersion = useCallback(
    (versionId: string) => {
      if (hasUnsavedChanges) {
        toast.warning('You have unsaved changes', {
          description: 'Please save or discard your changes before navigating to another version.',
          duration: 5000,
        });
        return;
      }
      router.push(`/finances/quotes/${versionId}`);
    },
    [router, hasUnsavedChanges],
  );

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

  // Get permissions based on quote status
  const { canAccept, canReject, canSend, canPutOnHold, canCancel, canConvert, canDelete, canCreateVersion } =
    getQuotePermissions(quote?.status);

  const getDrawerHeader = () => {
    if (mode === 'create') {
      return {
        title: 'New Quote',
        status: null,
      };
    }

    const versionIndicator =
      quote?.versionNumber && quote.versionNumber > 1 ? ` (v${quote.versionNumber})` : '';

    return {
      title: `${quote?.quoteNumber || 'Update Quote'}${versionIndicator}`,
      status: quote?.status ?? null,
    };
  };

  const { title, status} = getDrawerHeader();

  return (
    <>
      <Drawer key={id} open={isOpen} modal={true} onOpenChange={handleOpenChange}>
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
                  <Box className="flex items-center gap-2">
                    {status ? (
                      <DrawerDescription>
                        <QuoteStatusBadge status={status} />
                      </DrawerDescription>
                    ) : null}

                    {/* Version Navigation */}
                    {mode === 'edit' && versions && versions.length > 1 ? (
                      <Box className="flex items-center gap-1 ml-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => previousVersionId && handleNavigateToVersion(previousVersionId)}
                          disabled={!hasPreviousVersion || hasUnsavedChanges}
                          title="Previous version"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground px-1">
                          {currentVersionIndex + 1} / {versions.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => nextVersionId && handleNavigateToVersion(nextVersionId)}
                          disabled={!hasNextVersion || hasUnsavedChanges}
                          title="Next version"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Box>
                    ) : null}
                  </Box>
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
                      {quote.status !== QuoteStatus.ACCEPTED &&
                      quote.status !== QuoteStatus.CONVERTED &&
                      quote.status !== QuoteStatus.ON_HOLD ? (
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

                          {canPutOnHold ? (
                            <DropdownMenuItem onClick={handleOnHold}>
                              <Pause className="h-4 w-4" />
                              Put on hold
                            </DropdownMenuItem>
                          ) : null}

                          {canAccept ? (
                            <DropdownMenuItem onClick={handleAccept}>
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

                          {canCancel ? (
                            <DropdownMenuItem onClick={handleCancel}>
                              <Ban className="h-4 w-4" />
                              Cancel quote
                            </DropdownMenuItem>
                          ) : null}

                          {canConvert ? (
                            <DropdownMenuItem onClick={handleConvert}>
                              <FileCheck className="h-4 w-4" />
                              Convert to invoice
                            </DropdownMenuItem>
                          ) : null}

                          {canCreateVersion ? (
                            <DropdownMenuItem onClick={handleCreateVersion}>
                              <Copy className="h-4 w-4" />
                              Create new version
                            </DropdownMenuItem>
                          ) : null}

                          <DropdownMenuItem onClick={handleDownloadPdf}>
                            <Download className="h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>

                          {canDelete ? (
                            <DropdownMenuItem
                              onClick={handleDelete}
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

      {/* Reject Quote Dialog */}
      {showRejectDialog && quote?.id ? (
        <RejectQuoteDialog
          open={showRejectDialog}
          onOpenChange={setShowRejectDialog}
          onConfirm={confirmReject}
          quoteId={quote.id}
          quoteNumber={quote.quoteNumber}
          isPending={markAsRejected.isPending}
        />
      ) : null}

      {/* On Hold Dialog */}
      {showOnHoldDialog && quote?.id ? (
        <OnHoldDialog
          open={showOnHoldDialog}
          onOpenChange={setShowOnHoldDialog}
          onConfirm={confirmOnHold}
          quoteId={quote.id}
          quoteNumber={quote.quoteNumber}
          isPending={markAsOnHold.isPending}
        />
      ) : null}

      {/* Cancel Quote Dialog */}
      {showCancelDialog && quote?.id ? (
        <CancelQuoteDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          onConfirm={confirmCancel}
          quoteId={quote.id}
          quoteNumber={quote.quoteNumber}
          isPending={markAsCancelled.isPending}
        />
      ) : null}

      {/* Convert to Invoice Dialog */}
      {showConvertDialog && quote?.id ? (
        <ConvertToInvoiceDialog
          open={showConvertDialog}
          onOpenChange={setShowConvertDialog}
          onConfirm={confirmConvert}
          quoteId={quote.id}
          quoteNumber={quote.quoteNumber}
          quoteGst={Number(quote.gst)}
          quoteDiscount={Number(quote.discount)}
          isPending={convertToInvoice.isPending}
        />
      ) : null}

       {/* Delete Confirmation Dialog */}
       {showDeleteDialog && quote?.id ? (
        <DeleteQuoteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={confirmDelete}
          quoteId={quote.id}
          quoteNumber={quote.quoteNumber}
          isPending={deleteQuote.isPending}
        />
      ) : null}
    </>
  );
}
