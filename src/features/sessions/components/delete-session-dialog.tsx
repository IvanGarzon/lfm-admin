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

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deviceName?: string | null;
  isCurrentSession?: boolean;
  isPending?: boolean;
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  deviceName,
  isCurrentSession = false,
  isPending = false,
}: DeleteSessionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign Out Session?</AlertDialogTitle>
          <AlertDialogDescription>
            This will sign out{' '}
            {deviceName ? (
              <>
                <span className="font-semibold text-foreground">{deviceName}</span>
              </>
            ) : (
              'this session'
            )}
            .{' '}
            {isCurrentSession
              ? "You'll be redirected to the sign-in page."
              : "You'll need to sign in again on that device to access your account."}
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
            {isPending ? 'Signing Out...' : 'Sign Out'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
