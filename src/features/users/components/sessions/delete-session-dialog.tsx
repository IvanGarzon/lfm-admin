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

interface RevokeAllSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isAdminAction?: boolean;
  isPending?: boolean;
}

export function RevokeAllSessionsDialog({
  open,
  onOpenChange,
  onConfirm,
  isAdminAction = false,
  isPending = false,
}: RevokeAllSessionsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdminAction
              ? 'This will revoke all active sessions for this user. They will be signed out on all devices.'
              : 'This will sign out all other devices. Your current session will remain active.'}
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
            {isPending ? 'Revoking...' : 'Revoke all'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deviceName?: string | null;
  isCurrentSession?: boolean;
  isAdminAction?: boolean;
  isPending?: boolean;
}

export function DeleteSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  deviceName,
  isCurrentSession = false,
  isAdminAction = false,
  isPending = false,
}: DeleteSessionDialogProps) {
  const device = deviceName ? (
    <span className="font-semibold text-foreground">{deviceName}</span>
  ) : (
    'this session'
  );

  const description = isAdminAction ? (
    <>This will revoke {device}. The user will be signed out on that device.</>
  ) : isCurrentSession ? (
    <>This will sign out {device}. You'll be redirected to the sign-in page.</>
  ) : (
    <>This will sign out {device}. You'll need to sign in again on that device.</>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAdminAction ? 'Revoke Session?' : 'Sign Out Session?'}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
              ? isAdminAction
                ? 'Revoking...'
                : 'Signing Out...'
              : isAdminAction
                ? 'Revoke'
                : 'Sign Out'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
