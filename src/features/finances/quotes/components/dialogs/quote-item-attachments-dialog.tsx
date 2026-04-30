'use client';

import { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Trash2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useQuoteItemAttachments,
  useUploadQuoteItemAttachment,
  useDeleteQuoteItemAttachment,
  useGetItemAttachmentDownloadUrl,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { formatFileSize } from '@/lib/file-constants';
import { format } from 'date-fns';
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

interface QuoteItemAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  quoteItemId: string;
  itemDescription: string;
  /**
   * Accepted file types (MIME types) for upload
   * @default ['image/jpeg', 'image/jpg', 'image/png']
   * @example ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
   */
  acceptedFileTypes?: string[];
  /**
   * Display text for accepted file types
   * @default 'JPG, JPEG, PNG'
   * @example 'JPG, JPEG, PNG, WebP'
   */
  acceptedFileTypesLabel?: string;
}

export function QuoteItemAttachmentsDialog({
  open,
  onOpenChange,
  quoteId,
  quoteItemId,
  itemDescription,
  acceptedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'],
  acceptedFileTypesLabel = 'JPG, JPEG, PNG',
}: QuoteItemAttachmentsDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);

  const { data: attachments, isLoading } = useQuoteItemAttachments(quoteItemId);
  const uploadMutation = useUploadQuoteItemAttachment();
  const deleteMutation = useDeleteQuoteItemAttachment();
  const downloadMutation = useGetItemAttachmentDownloadUrl();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadMutation.mutate({ quoteItemId, quoteId, file: files[0] });
      }
    },
    [quoteItemId, quoteId, uploadMutation],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadMutation.mutate({ quoteItemId, quoteId, file: files[0] });
      }
      // Reset input
      e.target.value = '';
    },
    [quoteItemId, quoteId, uploadMutation],
  );

  const handleDelete = useCallback(() => {
    if (deleteAttachmentId) {
      deleteMutation.mutate(
        { attachmentId: deleteAttachmentId, quoteItemId, quoteId },
        {
          onSuccess: () => {
            setDeleteAttachmentId(null);
          },
        },
      );
    }
  }, [deleteAttachmentId, deleteMutation, quoteItemId, quoteId]);

  const handleDownload = useCallback(
    (attachmentId: string) => {
      downloadMutation.mutate(attachmentId);
    },
    [downloadMutation],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Item Images</DialogTitle>
            <DialogDescription>
              Upload images for: <span className="font-medium">{itemDescription}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Upload Images</h3>
                <label htmlFor="item-file-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadMutation.isPending}
                    onClick={() => document.getElementById('item-file-upload')?.click()}
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload aria-hidden="true" className="mr-2 size-4" />
                        Upload Image
                      </>
                    )}
                  </Button>
                  <input
                    id="item-file-upload"
                    type="file"
                    className="sr-only"
                    accept={acceptedFileTypes.join(',')}
                    onChange={handleFileSelect}
                    disabled={uploadMutation.isPending}
                  />
                </label>
              </div>

              <div
                className={`
                  rounded-lg border-2 border-dashed p-8 text-center transition-colors
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
                  ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload
                  aria-hidden="true"
                  className={`mx-auto size-8 ${
                    isDragging ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag and drop an image here, or click Upload Image
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supported: {acceptedFileTypesLabel} (Max 5MB)
                </p>
              </div>
            </div>

            {/* Images List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 aria-hidden="true" className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : attachments && attachments.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">
                  Uploaded Images ({attachments.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="relative group rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          <ImageIcon aria-hidden="true" className="size-5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.fileSize)} •{' '}
                            {format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(attachment.id)}
                          disabled={downloadMutation.isPending}
                          className="flex-1"
                        >
                          <Download aria-hidden="true" className="mr-1 size-3" />
                          <span className="text-xs">Download</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteAttachmentId(attachment.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 aria-hidden="true" className="size-3" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No images uploaded yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteAttachmentId !== null}
        onOpenChange={(open) => !open && setDeleteAttachmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
