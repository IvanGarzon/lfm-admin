'use client';

import { useCallback, useRef, useState } from 'react';
import { FileText, Image, Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useDeleteTransactionAttachment,
  useUploadTransactionAttachment,
} from '../hooks/use-transaction-queries';
import { formatFileSize, isImageFile } from '@/lib/file-constants';
import type { TransactionAttachment } from '../types';
import { toast } from 'sonner';

interface TransactionAttachmentsProps {
  transactionId?: string;
  attachments: TransactionAttachment[];
  onAttachmentsChange?: (attachments: TransactionAttachment[]) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit';
}

export function TransactionAttachments({
  transactionId,
  attachments = [],
  onAttachmentsChange,
  disabled = false,
  mode = 'edit',
}: TransactionAttachmentsProps) {
  const uploadMutation = useUploadTransactionAttachment();
  const deleteMutation = useDeleteTransactionAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !transactionId) return;

      const formData = new FormData();
      formData.append('file', file);

      uploadMutation.mutate(
        { transactionId, formData },
        {
          onSuccess: () => {
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          },
        },
      );
    },
    [transactionId, uploadMutation],
  );

  const handleDelete = useCallback(
    async (attachmentId: string) => {
      if (!confirm('Are you sure you want to delete this attachment?')) return;
      if (!transactionId) return;

      deleteMutation.mutate({ attachmentId, transactionId });
    },
    [deleteMutation, transactionId],
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Don't show upload button in create mode (transaction doesn't exist yet)
  const canUpload = mode === 'edit' && transactionId;

  return (
    <Box className="space-y-3">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Attachments</span>
          {attachments.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {attachments.length}
            </Badge>
          )}
        </Box>

        {canUpload && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
        disabled={disabled || uploadMutation.isPending || !canUpload}
      />

      {!canUpload && (
        <Box className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 border border-dashed">
          Save the transaction first to add attachments
        </Box>
      )}

      {attachments.length > 0 && (
        <Box className="space-y-2">
          {attachments.map((attachment) => {
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables?.attachmentId === attachment.id;
            const icon = isImageFile(attachment.mimeType) ? (
              <Image className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            );

            return (
              <Box
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-md border"
              >
                <Box className="flex items-center gap-3 flex-1 min-w-0">
                  <Box className="text-muted-foreground">{icon}</Box>
                  <Box className="flex-1 min-w-0">
                    <Box className="font-medium text-sm truncate">{attachment.fileName}</Box>
                    <Box className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)}
                    </Box>
                  </Box>
                </Box>

                <Box className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.s3Url, '_blank')}
                    disabled={isDeleting}
                    className="h-8 px-2"
                  >
                    View
                  </Button>

                  {canUpload && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={disabled || isDeleting}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
