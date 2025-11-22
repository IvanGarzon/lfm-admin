'use client';

import { useCallback, useState, useMemo } from 'react';
import Image from 'next/image';
import { Trash2, Download, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { RichTextEditor } from '@/components/rich-text-editor/rich-text-editor';
import {
  useQuote,
  useUpdateQuoteItemNotes,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { formatFileSize } from '@/lib/s3';
import { DeleteItemImageDialog } from './delete-item-image-dialog';
import { ImagePreviewDialog } from './image-preview-dialog';

interface QuoteItemImagesProps {
  quoteId: string;
  readOnly?: boolean;
  onDownloadImage: (attachmentId: string) => void;
  onDeleteImage: (attachmentId: string, quoteItemId: string, onSuccess: () => void) => void;
  isDeleting?: boolean;
}

export function QuoteItemImages({
  quoteId,
  readOnly = false,
  onDownloadImage,
  onDeleteImage,
  isDeleting = false,
}: QuoteItemImagesProps) {
  const [deleteItemAttachment, setDeleteItemAttachment] = useState<{
    attachmentId: string;
    quoteItemId: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    fileName: string;
    itemDescription: string;
  } | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const { data: quote, isLoading } = useQuote(quoteId);
  const updateNotesMutation = useUpdateQuoteItemNotes();

  // Memoize items with attachments to prevent reordering on updates
  const itemsWithAttachments = useMemo(() => {
    if (!quote?.items) {
      return [];
    }

    return quote.items
      .filter((item) => item.attachments && item.attachments.length > 0)
      .sort((a, b) => a.order - b.order);
  }, [quote?.items]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteItemAttachment) {
      onDeleteImage(deleteItemAttachment.attachmentId, deleteItemAttachment.quoteItemId, () => {
        // Close the modal after successful deletion
        setDeleteItemAttachment(null);
      });
    }
  }, [deleteItemAttachment, onDeleteImage]);

  const handleNotesChange = useCallback((quoteItemId: string, notes: string) => {
    setEditingNotes((prev) => ({ ...prev, [quoteItemId]: notes }));
  }, []);

  const handleNotesBlur = useCallback(
    (quoteItemId: string, originalNotes: string | null) => {
      const newNotes = editingNotes[quoteItemId];
      if (newNotes !== undefined && newNotes !== (originalNotes ?? '')) {
        updateNotesMutation.mutate({
          quoteItemId,
          quoteId,
          notes: newNotes,
        });
      }
      // Clear editing state
      setEditingNotes((prev) => {
        const updated = { ...prev };
        delete updated[quoteItemId];
        return updated;
      });
    },
    [editingNotes, quoteId, updateNotesMutation],
  );

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  // Check if there are any item attachments
  if (itemsWithAttachments.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-6">
        <Box className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">Item Images</h3>

          {itemsWithAttachments.map((item) => {
            return (
              <Box key={item.id} className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{item.description}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                    ({item.attachments.length} {item.attachments.length === 1 ? 'image' : 'images'})
                  </span>
                </p>

                <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {item.attachments.map((attachment) => (
                    <Box
                      key={attachment.id}
                      className="relative group rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                      {/* Image Preview */}
                      <Box className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                        <Image
                          src={attachment.s3Url}
                          alt={attachment.fileName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />

                        {/* Hover Overlay */}
                        <Box className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setPreviewImage({
                                url: attachment.s3Url,
                                fileName: attachment.fileName,
                                itemDescription: item.description,
                              })
                            }
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="size-4" />
                            <span className="sr-only">View</span>
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onDownloadImage(attachment.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="size-4" />
                            <span className="sr-only">Download</span>
                          </Button>

                          {!readOnly ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                setDeleteItemAttachment({
                                  attachmentId: attachment.id,
                                  quoteItemId: item.id,
                                })
                              }
                              disabled={isDeleting}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          ) : null}
                        </Box>
                      </Box>

                      {/* Image Info */}
                      <Box className="p-2 bg-white dark:bg-gray-900">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-50 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Notes Editor */}
                {!readOnly ? (
                  <Box>
                    <RichTextEditor
                      key={`editor-${item.id}`}
                      placeholder="Add notes about these images..."
                      value={editingNotes[item.id] ?? item.notes ?? ''}
                      onChange={(value) => handleNotesChange(item.id, value)}
                      onBlur={() => handleNotesBlur(item.id, item.notes)}
                      editable={true}
                    />
                  </Box>
                ) : (
                  item.notes && (
                    <Box className="border border-gray-200 dark:border-gray-800 rounded-md p-3">
                      <RichTextEditor
                        key={`editor-readonly-${item.id}`}
                        value={item.notes}
                        editable={false}
                      />
                    </Box>
                  )
                )}
              </Box>
            );
          })}
        </Box>
      </Card>

      {/* Delete Item Image Dialog */}
      <DeleteItemImageDialog
        open={deleteItemAttachment !== null}
        onOpenChange={(open) => !open && setDeleteItemAttachment(null)}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />

      {/* Image Preview Dialog */}
      <ImagePreviewDialog
        open={previewImage !== null}
        onOpenChange={(open) => !open && setPreviewImage(null)}
        imageUrl={previewImage?.url ?? null}
        fileName={previewImage?.fileName ?? null}
        itemDescription={previewImage?.itemDescription ?? null}
      />
    </>
  );
}
