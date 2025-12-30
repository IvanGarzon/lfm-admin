'use client';

import { useState, useEffect } from 'react';
import { Palette, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Box } from '@/components/ui/box';
import { useUploadQuoteItemColorPalette } from '@/features/finances/quotes/hooks/use-quote-queries';

interface QuoteItemColorPaletteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  quoteItemId: string;
  itemDescription: string;
  initialColors?: string[];
}

export function QuoteItemColorPaletteDialog({
  open,
  onOpenChange,
  quoteId,
  quoteItemId,
  itemDescription,
  initialColors = [],
}: QuoteItemColorPaletteDialogProps) {
  const [colors, setColors] = useState<string[]>(initialColors);

  const uploadMutation = useUploadQuoteItemColorPalette();

  // Reset colors when dialog opens or initial colors change
  useEffect(() => {
    if (open) {
      setColors(initialColors);
    }
  }, [open, initialColors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Palette
          </DialogTitle>
          <DialogDescription>
            Select up to 10 colors for <span className="font-medium">{itemDescription}</span>
          </DialogDescription>
        </DialogHeader>

        <Box className="py-4">
          <ColorPicker
            colors={colors}
            onChange={setColors}
            maxColors={10}
            disabled={uploadMutation.isPending}
          />
        </Box>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              uploadMutation.mutate(
                { quoteItemId, quoteId, colors },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                  },
                },
              );
            }}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save colors</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
