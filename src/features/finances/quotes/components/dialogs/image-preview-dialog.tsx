'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  fileName: string | null;
  itemDescription?: string | null;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  imageUrl,
  fileName,
  itemDescription,
}: ImagePreviewDialogProps) {
  if (!imageUrl || !fileName) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0" showClose={false}>
        <Box className="relative">
          <DialogHeader>
            <Box className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <Box className="flex-1 min-w-0 pr-4">
                <DialogTitle className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">
                  {itemDescription}
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{fileName}</p>
              </Box>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </Box>
          </DialogHeader>

          {/* Image */}
          <Box
            className="relative w-full bg-gray-100 dark:bg-gray-900"
            style={{ minHeight: '400px' }}
          >
            <Image
              src={imageUrl}
              alt={fileName}
              width={1200}
              height={800}
              className="w-full h-auto object-contain"
              style={{ maxHeight: '80vh' }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
