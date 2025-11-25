'use client';

import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (quoteId: string) => void;
  quoteId: string;
  quoteNumber: string;
  isPending?: boolean;
}

export function DeleteQuoteDialog({
  open,
  onOpenChange,
  onConfirm,
  quoteId,
  quoteNumber,
  isPending = false,
}: DeleteQuoteDialogProps) {
  const handleConfirm = () => {
    onConfirm(quoteId);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Delete Quote
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete quote <strong>{quoteNumber}</strong>? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
