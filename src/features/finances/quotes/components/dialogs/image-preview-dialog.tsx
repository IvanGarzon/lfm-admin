'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

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
        <VisuallyHidden>
          <DialogDescription>Image preview for {itemDescription ?? fileName}</DialogDescription>
        </VisuallyHidden>
        <Box className="relative">
          <DialogHeader>
            <Box className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
              <Box className="flex-1 min-w-0 pr-4">
                <DialogTitle className="text-sm font-medium truncate">
                  {itemDescription}
                </DialogTitle>
                <p className="text-xs text-muted-foreground truncate">{fileName}</p>
              </Box>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                aria-label="Close preview"
                className="h-8 w-8 p-0 shrink-0"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </Box>
          </DialogHeader>

          {/* Image */}
          <Box className="relative w-full bg-muted" style={{ minHeight: '400px' }}>
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
