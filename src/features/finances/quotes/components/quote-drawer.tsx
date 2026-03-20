'use client';

import { useState, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { QuoteStatus } from '@/prisma/client';
import type { CreateQuoteInput, UpdateQuoteInput } from '@/schemas/quotes';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  useQuoteMetadata,
  useQuoteItems,
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
import { QuoteForm } from '@/features/finances/quotes/components/quote-form';
import { QuoteDrawerSkeleton } from '@/features/finances/quotes/components/quote-drawer-skeleton';
import { QuoteVersions } from '@/features/finances/quotes/components/quote-versions';
import { QuoteStatusHistory } from '@/features/finances/quotes/components/quote-status-history';
import { QuoteDrawerHeader } from '@/features/finances/quotes/components/quote-drawer-header';
import { QuotePreviewPanel } from '@/features/finances/quotes/components/quote-preview-panel';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, quoteSearchParamsDefaults } from '@/filters/quotes/quotes-filters';
import { useQuoteActions } from '@/features/finances/quotes/context/quote-action-context';
import { needsAttention } from '@/features/finances/quotes/utils/quote-helpers';

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
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('details');

  const mode: DrawerMode = id ? 'edit' : 'create';

  const { data: quote, isLoading: isLoadingQuote, error, isError } = useQuoteMetadata(id);

  const needsItems = activeTab === 'details' || showPreview;
  const { data: items, isLoading: isLoadingItems } = useQuoteItems(id, {
    enabled: needsItems,
  });

  const isLoading = isLoadingQuote || (needsItems && isLoadingItems);

  const { data: versions, isLoading: isLoadingVersions } = useQuoteVersions(id, {
    enabled: mode === 'edit',
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
  const queryString = useQueryString(searchParams, quoteSearchParamsDefaults);

  const currentVersionIndex = versions?.findIndex((v) => v.id === id) ?? -1;
  const isOpen = id ? (pathname?.includes(`/quotes/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (id) {
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
    openDelete(quote.id, quote.quoteNumber);
  }, [quote, openDelete]);

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

  const showFollowUp = useMemo(() => {
    if (!quote) {
      return false;
    }

    return needsAttention({
      status: quote.status,
      validUntil: quote.validUntil,
    });
  }, [quote?.status, quote?.validUntil]);

  const { title, status } = useMemo(() => {
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
  }, [mode, quote?.quoteNumber, quote?.versionNumber, quote?.status]);

  const actionsMenuHandlers = useMemo(
    () => ({
      onSend: handleSend,
      onOnHold: handleOnHold,
      onAccept: handleAccept,
      onReject: handleReject,
      onCancel: handleCancel,
      onConvert: handleConvert,
      onCreateVersion: handleCreateVersion,
      onDuplicate: handleDuplicate,
      onDownloadPdf: handleDownloadPdf,
      onSendEmail: handleSendEmail,
      onSendFollowUp: handleSendFollowUp,
      onDelete: handleDelete,
    }),
    [
      handleSend,
      handleOnHold,
      handleAccept,
      handleReject,
      handleCancel,
      handleConvert,
      handleCreateVersion,
      handleDuplicate,
      handleDownloadPdf,
      handleSendEmail,
      handleSendFollowUp,
      handleDelete,
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
            <QuoteDrawerHeader
              mode={mode}
              title={title}
              status={status}
              hasUnsavedChanges={hasUnsavedChanges}
              showPreview={showPreview}
              onPreviewToggle={() => setShowPreview(!showPreview)}
              versions={versions}
              currentVersionIndex={currentVersionIndex}
              onNavigateToVersion={handleNavigateToVersion}
              quote={quote}
              isCreating={createQuote.isPending}
              isUpdating={updateQuote.isPending}
              actionsMenuHandlers={actionsMenuHandlers}
              showFollowUp={showFollowUp}
              onClose={() => handleOpenChange(false)}
            />

            <DrawerBody className="py-0! -mx-6 h-full overflow-y-auto bg-gray-50/30 dark:bg-transparent">
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
                          {quote && quote.versionsCount > 1 ? (
                            <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                              {quote.versionsCount}
                            </Badge>
                          ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="relative">
                          History
                          {quote &&
                          quote._count?.statusHistory &&
                          quote._count.statusHistory > 0 ? (
                            <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5">
                              {quote._count.statusHistory}
                            </Badge>
                          ) : null}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="mt-0 h-full flex flex-col">
                        {quote && items ? (
                          <QuoteForm
                            quote={quote}
                            items={items}
                            onUpdate={handleUpdate}
                            isUpdating={updateQuote.isPending}
                            onDirtyStateChange={setHasUnsavedChanges}
                          />
                        ) : (
                          <Box className="text-center py-12 text-muted-foreground">
                            Loading quote details...
                          </Box>
                        )}
                      </TabsContent>

                      <TabsContent value="versions" className="mt-0 p-6">
                        {isLoadingVersions ? (
                          <Box className="text-center py-12 text-muted-foreground">
                            Loading versions...
                          </Box>
                        ) : versions && versions.length > 1 && quote ? (
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

                {mode === 'edit' && showPreview && quote && items ? (
                  <QuotePreviewPanel
                    quote={quote}
                    items={items}
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
