'use client';

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

interface MarkAsPendingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  invoiceNumber?: string;
  isPending?: boolean;
}

export function MarkAsPendingDialog({
  open,
  onOpenChange,
  onConfirm,
  invoiceNumber,
  isPending = false,
}: MarkAsPendingDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark invoice as pending?</AlertDialogTitle>
          <AlertDialogDescription>
            {invoiceNumber
              ? `This will mark invoice ${invoiceNumber} as pending and make it active for payment.`
              : 'This will mark the invoice as pending and make it active for payment.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Updating...' : 'Mark as Pending'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
