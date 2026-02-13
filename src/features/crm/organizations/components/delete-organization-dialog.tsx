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

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  organizationName?: string;
  customersCount?: number;
  isPending?: boolean;
}

export function DeleteOrganizationDialog({
  open,
  onOpenChange,
  onConfirm,
  organizationName,
  customersCount = 0,
  isPending = false,
}: DeleteOrganizationDialogProps) {
  const hasLinkedCustomers = customersCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasLinkedCustomers ? 'Cannot delete organization' : 'Are you sure?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {hasLinkedCustomers ? (
              <>
                <p>
                  {organizationName
                    ? `${organizationName} has ${customersCount} ${customersCount === 1 ? 'customer' : 'customers'} linked to it.`
                    : `This organization has ${customersCount} ${customersCount === 1 ? 'customer' : 'customers'} linked to it.`}
                </p>
                <p>
                  Before deleting this organization, you must first unlink all customers or reassign
                  them to a different organization.
                </p>
              </>
            ) : (
              <p>
                {organizationName
                  ? `This will permanently delete ${organizationName}. This action cannot be undone.`
                  : 'This action cannot be undone. This will permanently delete the organization.'}
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {hasLinkedCustomers ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          {!hasLinkedCustomers ? (
            <AlertDialogAction onClick={onConfirm} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
