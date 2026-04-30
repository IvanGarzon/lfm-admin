'use client';

import { useCallback } from 'react';
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

interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  referenceNumber?: string;
  isPending?: boolean;
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  onConfirm,
  referenceNumber,
  isPending = false,
}: DeleteTransactionDialogProps) {
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle aria-hidden="true" className="h-5 w-5" />
            Delete Transaction
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete transaction{' '}
            {referenceNumber ? (
              <>
                <strong>{referenceNumber}</strong>?
              </>
            ) : (
              'this transaction?'
            )}{' '}
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
