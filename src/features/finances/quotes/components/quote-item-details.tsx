'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Trash2, Download, Loader2, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { RichTextEditor } from '@/components/rich-text-editor/rich-text-editor';
import {
  useUpdateQuoteItemNotes,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';
import { formatFileSize } from '@/lib/s3';
import { DeleteItemImageDialog } from './delete-item-image-dialog';
import { ImagePreviewDialog } from './image-preview-dialog';
import { QuoteItemColorPaletteDialog } from './quote-item-color-palette-dialog';

interface QuoteItemDetailsProps {
  quoteId: string;
  items: QuoteWithDetails['items'];
  readOnly?: boolean;
  onDownloadImage: (attachmentId: string) => void;
  onDeleteImage: (attachmentId: string, quoteItemId: string, onSuccess: () => void) => void;
  isDeleting?: boolean;
}

export function QuoteItemDetails({
  quoteId,
  items,
  readOnly = false,
  onDownloadImage,
  onDeleteImage,
  isDeleting = false,
}: QuoteItemDetailsProps) {
  const [deleteItemAttachment, setDeleteItemAttachment] = useState<{
    attachmentId: string;
    quoteItemId: string;
  } | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    fileName: string;
    itemDescription: string;
  } | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingColors, setEditingColors] = useState<{
    quoteItemId: string;
    itemDescription: string;
    colors: string[];
  } | null>(null);

  const updateNotesMutation = useUpdateQuoteItemNotes();

  // Memoize items with attachments, colors, or notes to prevent reordering on updates
  const itemsWithContent = useMemo(() => {
    if (!items) {
      return [];
    }

    return items
      .filter((item) =>
        (item.attachments && item.attachments.length > 0) ||
        (item.colors && item.colors.length > 0) ||
        item.notes
      )
      .sort((a, b) => a.order - b.order);
  }, [items]);

  // Initialize loading state for all images
  useEffect(() => {
    if (!items) return;

    const allImageIds = new Set<string>();
    items.forEach((item) => {
      item.attachments?.forEach((attachment) => {
        allImageIds.add(attachment.id);
      });
    });

    setLoadingImages(allImageIds);
  }, [items]);

  const handleImageLoadComplete = useCallback((attachmentId: string) => {
    setLoadingImages((prev) => {
      const next = new Set(prev);
      next.delete(attachmentId);
      return next;
    });
  }, []);

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

  // Check if there are any item attachments or colors
  if (itemsWithContent.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-6 my-6">
        <Box className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">Item Colors & Images</h3>

          {itemsWithContent.map((item) => {
            const hasColors = item.colors && item.colors.length > 0;
            const hasImages = item.attachments && item.attachments.length > 0;
            
            return (
              <Box key={item.id} className="space-y-3">
                {/* Item Title */}
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{item.description}</span>
                  {hasColors ? (
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                      ({item.colors.length} {item.colors.length === 1 ? 'color' : 'colors'})
                    </span>
                  ): null}

                  {hasImages ? (
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                      ({item.attachments.length} {item.attachments.length === 1 ? 'image' : 'images'})
                    </span>
                  ): null}
                </p>

                {/* Color Palette */}
                {hasColors ? (
                  <Box className="flex flex-wrap gap-1 items-center">
                    {item.colors.map((color, colorIndex) => (
                      <Box
                        key={`${item.id}-color-${colorIndex}`}
                        className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {!readOnly ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingColors({
                          quoteItemId: item.id,
                          itemDescription: item.description,
                          colors: item.colors,
                        })}
                        className="w-16 h-16 px-4"
                      >
                        <Edit className="h-4 w-4" />                        
                      </Button>
                    ): null}
                  </Box>
                ): null}

                {/* Images Grid */}
                {hasImages ? (
                  <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {item.attachments.map((attachment) => (
                    <Box
                      key={attachment.id}
                      className="relative group rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                      {/* Image Preview */}
                      <Box className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                        {/* Loading Spinner */}
                        {loadingImages.has(attachment.id) && (
                          <Box className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100 dark:bg-gray-800">
                            <Loader2 className="size-8 animate-spin text-gray-400" />
                          </Box>
                        )}

                        <Image
                          src={attachment.s3Url}
                          alt={attachment.fileName}
                          fill
                          className={`object-cover transition-opacity duration-300 ${
                            loadingImages.has(attachment.id) ? 'opacity-0' : 'opacity-100'
                          }`}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          onLoadingComplete={() => handleImageLoadComplete(attachment.id)}
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
                ): null}

                {/* Notes Editor - Only show if there are colors OR images OR notes */}
                {hasColors || hasImages || item.notes ? (
                  !readOnly ? (
                  <Box>
                    <RichTextEditor
                      key={`editor-${item.id}`}
                      placeholder="Add notes about these colors and images..."
                      value={editingNotes[item.id] ?? item.notes ?? ''}
                      onChange={(value) => handleNotesChange(item.id, value)}
                      onBlur={() => handleNotesBlur(item.id, item.notes)}
                      editable={true}
                    />
                  </Box>
                ) : (
                  <Box className="border border-gray-200 dark:border-gray-800 rounded-md p-3">
                    <RichTextEditor
                      key={`editor-readonly-${item.id}`}
                      value={item.notes ?? ''}
                      editable={false}
                    />
                  </Box>
                )
                ): null}
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

      {/* Color Palette Edit Dialog */}
      <QuoteItemColorPaletteDialog
        open={editingColors !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingColors(null);
          }
        }}
        quoteId={quoteId}
        quoteItemId={editingColors?.quoteItemId ?? ''}
        itemDescription={editingColors?.itemDescription ?? ''}
        initialColors={editingColors?.colors ?? []}
      />
    </>
  );
}
