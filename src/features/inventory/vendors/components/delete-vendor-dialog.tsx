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

interface DeleteVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  vendorCode?: string;
  vendorName?: string;
  isPending: boolean;
}

export function DeleteVendorDialog({
  open,
  onOpenChange,
  onConfirm,
  vendorCode,
  vendorName,
  isPending,
}: DeleteVendorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              {vendorCode} - {vendorName || 'this vendor'}
            </span>
            ? This action cannot be undone.
            {'\n\n'}
            Note: Vendors with associated transactions cannot be deleted. Consider setting the
            status to INACTIVE instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
