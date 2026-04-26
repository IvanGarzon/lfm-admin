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

interface DeleteOtherSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  sessionCount: number;
  isPending?: boolean;
}

export function DeleteOtherSessionsDialog({
  open,
  onOpenChange,
  onConfirm,
  sessionCount,
  isPending = false,
}: DeleteOtherSessionsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign Out All Devices?</AlertDialogTitle>
          <AlertDialogDescription>
            This will sign out <span className="font-semibold text-foreground">{sessionCount}</span>{' '}
            {sessionCount === 1 ? 'session' : 'sessions'} including this device. You&apos;ll need to
            sign in again to access your account.
            <br />
            <br />
            You will be redirected to the sign-in page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isPending
              ? 'Signing Out...'
              : `Sign Out ${sessionCount} ${sessionCount === 1 ? 'Session' : 'Sessions'}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
