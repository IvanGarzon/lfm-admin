'use client';

import { useCallback, useState } from 'react';
import { Upload, FileIcon as FileIcon2, Trash2, Download, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import {
  useQuoteAttachments,
  useUploadQuoteAttachment,
  useDeleteQuoteAttachment,
  useGetAttachmentDownloadUrl,
} from '@/features/finances/quotes/hooks/use-quote-queries';
import { formatFileSize, isImageFile } from '@/lib/s3';
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

interface QuoteAttachmentsProps {
  quoteId: string;
  readOnly?: boolean;
}

export function QuoteAttachments({ quoteId, readOnly = false }: QuoteAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null);

  const { data: attachments, isLoading } = useQuoteAttachments(quoteId);
  const uploadMutation = useUploadQuoteAttachment();
  const deleteMutation = useDeleteQuoteAttachment();
  const downloadMutation = useGetAttachmentDownloadUrl();

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

      if (readOnly) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadMutation.mutate({ quoteId, file: files[0] });
      }
    },
    [quoteId, uploadMutation, readOnly],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadMutation.mutate({ quoteId, file: files[0] });
      }
      // Reset input
      e.target.value = '';
    },
    [quoteId, uploadMutation],
  );

  const handleDelete = useCallback(() => {
    if (deleteAttachmentId) {
      deleteMutation.mutate(
        { attachmentId: deleteAttachmentId, quoteId },
        {
          onSuccess: () => {
            setDeleteAttachmentId(null);
          },
        },
      );
    }
  }, [deleteAttachmentId, deleteMutation, quoteId]);

  const handleDownload = useCallback(
    (attachmentId: string) => {
      downloadMutation.mutate(attachmentId);
    },
    [downloadMutation],
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

  return (
    <>
      <Card className="p-6">
        <Box className="space-y-4">
          <Box className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-50">Attachments</h3>
            {!readOnly && (
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadMutation.isPending}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      Upload File
                    </>
                  )}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  disabled={uploadMutation.isPending}
                />
              </label>
            )}
          </Box>

          {!readOnly && (
            <Box
              className={`
                rounded-lg border-2 border-dashed p-8 text-center transition-colors
                ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-300 dark:border-gray-700'
                }
                ${uploadMutation.isPending ? 'pointer-events-none opacity-50' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload
                className={`mx-auto size-8 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-600'
                }`}
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Drag and drop a file here, or click Upload File
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Supported: Images, PDF, DOC, DOCX, XLS, XLSX (Max 5MB)
              </p>
            </Box>
          )}

          {attachments && attachments.length > 0 ? (
            <Box className="space-y-2">
              {attachments.map((attachment) => (
                <Box
                  key={attachment.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <Box className="shrink-0">
                    {isImageFile(attachment.mimeType) ? (
                      <Image className="size-5 text-blue-500" />
                    ) : (
                      <FileIcon2 className="size-5 text-gray-400" />
                    )}
                  </Box>

                  <Box className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatFileSize(attachment.fileSize)} •{' '}
                      {format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}
                    </p>
                  </Box>

                  <Box className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment.id)}
                      disabled={downloadMutation.isPending}
                    >
                      <Download className="size-4" />
                      <span className="sr-only">Download</span>
                    </Button>

                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteAttachmentId(attachment.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-4 text-red-500" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box className="py-8 text-center text-sm text-gray-500 dark:text-gray-500">
              No attachments yet
            </Box>
          )}
        </Box>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteAttachmentId !== null}
        onOpenChange={(open) => !open && setDeleteAttachmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
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
