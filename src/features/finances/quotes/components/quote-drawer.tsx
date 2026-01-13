'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
  Files,
  ChevronLeft,
  ChevronRight,
  Pause,
  Ban,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

import { QuoteStatus } from '@/prisma/client';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useQuote,
  useQuoteHistory,
  useCreateQuote,
  useUpdateQuote,
  useMarkQuoteAsAccepted,
  useMarkQuoteAsSent,
  useCreateQuoteVersion,
  useQuoteVersions,
  useDownloadQuotePdf,
  useSendQuoteEmail,
  useSendQuoteFollowUp,
  useDuplicateQuote,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { getQuotePermissions } from '@/features/finances/quotes/utils/quote-helpers';
import { QuoteForm } from '@/features/finances/quotes/components/quote-form';
import { QuoteDrawerSkeleton } from '@/features/finances/quotes/components/quote-drawer-skeleton';
import { QuoteStatusBadge } from '@/features/finances/quotes/components/quote-status-badge';
import { QuoteVersions } from '@/features/finances/quotes/components/quote-versions';
import { QuoteStatusHistory } from '@/features/finances/quotes/components/quote-status-history';
import { useQuoteQueryString } from '@/features/finances/quotes/hooks/use-quote-query-string';
import { searchParams, quoteSearchParamsDefaults } from '@/filters/quotes/quotes-filters';
import { useQuoteActions } from '@/features/finances/quotes/context/quote-action-context';

const QuotePreview = dynamic(
  () =>
    import('@/features/finances/quotes/components/quote-preview').then((mod) => mod.QuotePreview),
  {
    ssr: false,
    loading: () => (
      <Box className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading preview...</p>
      </Box>
    ),
  },
);

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
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { data: quote, isLoading, error, isError } = useQuote(id);
  const { data: versions, isLoading: isLoadingVersions } = useQuoteVersions(id, {
    enabled: activeTab === 'versions',
  });
  const { data: history, isLoading: isLoadingHistory } = useQuoteHistory(id, {
    enabled: activeTab === 'history',
  });

  const { openDelete, openReject, openOnHold, openCancel, openConvert } = useQuoteActions();

  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const markAsAccepted = useMarkQuoteAsAccepted();
  const markAsSent = useMarkQuoteAsSent();
  const createVersion = useCreateQuoteVersion();
  const downloadPdf = useDownloadQuotePdf();
  const sendEmail = useSendQuoteEmail();
  const sendFollowUp = useSendQuoteFollowUp();
  const duplicateQuote = useDuplicateQuote();

  const router = useRouter();
  const queryString = useQuoteQueryString(searchParams, quoteSearchParamsDefaults);

  // Version navigation
  const currentVersionIndex = versions?.findIndex((v) => v.id === id) ?? -1;
  const hasPreviousVersion = currentVersionIndex > 0;
  const hasNextVersion =
    currentVersionIndex >= 0 && currentVersionIndex < (versions?.length ?? 0) - 1;
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
    if (!quote) return;
    openReject(quote.id, quote.quoteNumber);
  }, [quote, openReject]);

  const handleSend = useCallback(() => {
    if (!quote) {
      return;
    }

    markAsSent.mutate(quote.id);
  }, [quote, markAsSent]);

  const handleOnHold = useCallback(() => {
    if (!quote) return;
    openOnHold(quote.id, quote.quoteNumber);
  }, [quote, openOnHold]);

  const handleCancel = useCallback(() => {
    if (!quote) return;
    openCancel(quote.id, quote.quoteNumber);
  }, [quote, openCancel]);

  const handleConvert = useCallback(() => {
    if (!quote) return;
    openConvert(quote.id, quote.quoteNumber, Number(quote.gst), Number(quote.discount));
  }, [quote, openConvert]);

  const handleDelete = useCallback(() => {
    if (!quote) return;
    openDelete(quote.id, quote.quoteNumber, () => {
      const basePath = '/finances/quotes';
      const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
      router.push(targetPath);
    });
  }, [quote, openDelete, router, queryString]);

  const handleCreateVersion = useCallback(() => {
    if (!quote) {
      return;
    }

    createVersion.mutate(quote.id, {
      onSuccess: (data) => {
        // Navigate to the newly created version
        const basePath = `/finances/quotes/${data.id}`;
        const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
        router.push(targetPath);
      },
    });
  }, [quote, createVersion, router, queryString]);

  const handleDuplicate = useCallback(() => {
    if (!quote) {
      return;
    }

    if (hasUnsavedChanges) {
      toast.warning('You have unsaved changes', {
        description:
          'Please save your changes before duplicating to ensure the copy reflects the latest data.',
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

    duplicateQuote.mutate(quote.id, {
      onSuccess: (data) => {
        // Navigate to the newly created duplicate
        const basePath = `/finances/quotes/${data.id}`;
        const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
        router.push(targetPath);
      },
    });
  }, [quote, duplicateQuote, router, hasUnsavedChanges, queryString]);

  const handleNavigateToVersion = useCallback(
    (versionId: string) => {
      if (hasUnsavedChanges) {
        toast.warning('You have unsaved changes', {
          description: 'Please save or discard your changes before navigating to another version.',
          duration: 5000,
        });
        return;
      }
      const basePath = `/finances/quotes/${versionId}`;
      const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
      router.push(targetPath);
    },
    [router, hasUnsavedChanges, queryString],
  );

  const handleDownloadPdf = useCallback(() => {
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

    downloadPdf.mutate(quote.id);
  }, [quote, hasUnsavedChanges, downloadPdf]);

  const handleSendEmail = useCallback(() => {
    if (!quote) {
      return;
    }

    if (hasUnsavedChanges) {
      toast.warning('You have unsaved changes', {
        description:
          'Please save your changes before sending the email to ensure it reflects the latest data.',
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

    // Determine email type based on quote status
    const emailType = quote.status === QuoteStatus.SENT ? 'sent' : 'sent';
    sendEmail.mutate({ quoteId: quote.id, type: emailType });
  }, [quote, hasUnsavedChanges, sendEmail]);

  const handleSendFollowUp = useCallback(() => {
    if (!quote) {
      return;
    }

    if (hasUnsavedChanges) {
      toast.warning('You have unsaved changes', {
        description:
          'Please save your changes before sending the follow-up to ensure it reflects the latest data.',
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

    sendFollowUp.mutate(quote.id);
  }, [quote, hasUnsavedChanges, sendFollowUp]);

  // Get permissions based on quote status
  const {
    canAccept,
    canReject,
    canSend,
    canSendQuote,
    canPutOnHold,
    canCancel,
    canConvert,
    canDelete,
    canCreateVersion,
  } = getQuotePermissions(quote?.status);

  // Check if follow-up should be available
  // Only show when status is SENT and within 3 days of validUntil
  const showFollowUp = (() => {
    if (!quote || quote.status !== QuoteStatus.SENT) return false;

    const now = new Date();
    const validUntil = new Date(quote.validUntil);
    const daysUntilExpiry = Math.ceil(
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  })();

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
                          onClick={() =>
                            previousVersionId && handleNavigateToVersion(previousVersionId)
                          }
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
                              Send Quote
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

                          <DropdownMenuItem onClick={handleDuplicate}>
                            <Files className="h-4 w-4" />
                            Duplicate Quote
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={handleDownloadPdf}>
                            <Download className="h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>

                          {canSendQuote ? (
                            <DropdownMenuItem onClick={handleSendEmail}>
                              <Mail className="h-4 w-4" />
                              Resend Quote
                            </DropdownMenuItem>
                          ) : null}

                          {showFollowUp ? (
                            <DropdownMenuItem onClick={handleSendFollowUp}>
                              <Send className="h-4 w-4" />
                              Send Follow-up
                            </DropdownMenuItem>
                          ) : null}

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
                    className="h-full"
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
                      <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full h-full flex flex-col"
                      >
                        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent px-6">
                          <TabsTrigger value="details" className="relative">
                            Quote Details
                          </TabsTrigger>
                          <TabsTrigger value="versions" className="relative">
                            Versions
                            {quote && quote.versionsCount > 1 && (
                              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                                {quote.versionsCount}
                              </Badge>
                            )}
                          </TabsTrigger>
                          <TabsTrigger value="history" className="relative">
                            History
                            {quote &&
                              quote._count?.statusHistory &&
                              quote._count.statusHistory > 0 && (
                                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                                  {quote._count.statusHistory}
                                </Badge>
                              )}
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-0 h-full flex flex-col">
                          <QuoteForm
                            quote={quote}
                            onUpdate={handleUpdate}
                            isUpdating={updateQuote.isPending}
                            onDirtyStateChange={setHasUnsavedChanges}
                          />
                        </TabsContent>

                        <TabsContent value="versions" className="mt-0 p-6">
                          {versions && versions.length > 1 && quote ? (
                            <QuoteVersions
                              currentVersionId={quote.id}
                              versions={versions}
                              isLoading={isLoadingVersions}
                            />
                          ) : (
                            <Box className="text-center py-12 text-muted-foreground">
                              No versions available
                            </Box>
                          )}
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 p-6">
                          {isLoadingHistory ? (
                            <Box className="text-center py-12 text-muted-foreground">
                              Loading history...
                            </Box>
                          ) : history && history.length > 0 ? (
                            <QuoteStatusHistory history={history} />
                          ) : (
                            <Box className="text-center py-12 text-muted-foreground">
                              No history available
                            </Box>
                          )}
                        </TabsContent>
                      </Tabs>
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
    </>
  );
}
