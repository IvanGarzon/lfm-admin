'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Bell, ShieldCheck, ShieldOff, Check, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionCard } from '@/features/users/components/sessions/session-card';
import { SessionCardSkeleton } from '@/features/users/components/sessions/session-card-skeleton';
import {
  DeleteSessionDialog,
  RevokeAllSessionsDialog,
} from '@/features/users/components/sessions/delete-session-dialog';
import { hasPermission } from '@/lib/permissions';
import { ChangePasswordSchema, type ChangePasswordInput } from '@/schemas/users';
import {
  useChangePassword,
  useSendPasswordResetEmail,
  useUpdateUserSecurity,
  useUserSessions,
  useAdminRevokeUserSession,
  useAdminExtendUserSession,
  useAdminRevokeAllUserSessions,
} from '@/features/users/hooks/use-user-queries';
import {
  useDeleteSession,
  useDeleteOtherSessions,
  useExtendSession,
  useSessions,
} from '@/features/users/hooks/use-sessions';
import type { UserDetail } from '@/features/users/types';
import type { SessionWithUser } from '@/features/sessions/types';

function ChangePasswordBlock({ userId, userEmail }: { userId: string; userEmail: string | null }) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === userId;
  const canManageUsers = hasPermission(session?.user, 'canManageUsers');
  const isAdmin = canManageUsers && !isOwnProfile;

  const changePassword = useChangePassword();
  const sendReset = useSendPasswordResetEmail();

  const selfForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { userId, currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleSelfSubmit = (data: ChangePasswordInput) => {
    changePassword.mutate(data, { onSuccess: () => selfForm.reset() });
  };

  if (isAdmin) {
    return (
      <Card>
        <CardHeader className="px-6 pt-4 pb-2">
          <CardTitle className="text-sm font-medium">Reset Password</CardTitle>
          <p className="text-xs text-muted-foreground">
            Send a password reset link to <strong>{userEmail ?? 'this user'}</strong>. They will
            receive an email to set a new password.
          </p>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4">
          <Button
            variant="outline"
            onClick={() => sendReset.mutate(userId)}
            disabled={sendReset.isPending || !userEmail}
          >
            {sendReset.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Send reset email
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isOwnProfile) return null;

  return (
    <Card>
      <CardHeader className="px-6 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">Change Password</CardTitle>
        <p className="text-xs text-muted-foreground">
          Update your password to keep your account secure. Choose a strong, unique password.
        </p>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-4 space-y-4">
        <Form {...selfForm}>
          <form onSubmit={selfForm.handleSubmit(handleSelfSubmit)} className="space-y-4">
            <FieldGroup>
              <Controller
                name="currentPassword"
                control={selfForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel>Current password</FieldLabel>
                    </FieldContent>
                    <Input type="password" {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldGroup>
              <Controller
                name="newPassword"
                control={selfForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel>New password</FieldLabel>
                    </FieldContent>
                    <Input type="password" {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldGroup>
              <Controller
                name="confirmPassword"
                control={selfForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel>Confirm new password</FieldLabel>
                    </FieldContent>
                    <Input type="password" {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
            <Box className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Update password
              </Button>
            </Box>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SecuritySettingsBlock({ user }: { user: UserDetail }) {
  const { mutate: updateSecurity, isPending } = useUpdateUserSecurity();

  const handleToggle = (field: 'isTwoFactorEnabled' | 'loginNotificationsEnabled') => {
    updateSecurity({ id: user.id, [field]: !user[field] });
  };

  return (
    <Card>
      <CardHeader className="px-6 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">Security Settings</CardTitle>
        <p className="text-xs text-muted-foreground">
          Manage your account security and authentication.
        </p>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-4 space-y-4">
        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Box className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="size-4 text-primary" />
            </Box>
            <Box>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </Box>
          </Box>
          <Button
            variant={user.isTwoFactorEnabled ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleToggle('isTwoFactorEnabled')}
            disabled={isPending}
          >
            {user.isTwoFactorEnabled ? (
              <ShieldOff className="size-4" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {user.isTwoFactorEnabled ? 'Disable' : 'Enable'}
          </Button>
        </Box>

        <Box className="border-t" />

        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-3">
            <Box className="p-2 rounded-lg bg-primary/10">
              <Bell className="size-4 text-primary" />
            </Box>
            <Box>
              <p className="text-sm font-medium">Login Notifications</p>
              <p className="text-xs text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </Box>
          </Box>
          <Button
            variant={user.loginNotificationsEnabled ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleToggle('loginNotificationsEnabled')}
            disabled={isPending}
          >
            {user.loginNotificationsEnabled ? (
              <X className="size-4" />
            ) : (
              <Check className="size-4" />
            )}
            {user.loginNotificationsEnabled ? 'Disable' : 'Enable'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function ActiveSessionsBlock({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === userId;

  const selfSessions = useSessions();
  const adminSessions = useUserSessions(userId);
  const { data: sessions = [], isLoading } = isOwnProfile ? selfSessions : adminSessions;

  const { mutate: deleteSelfSession, isPending: isDeletingSelf } = useDeleteSession();
  const { mutate: deleteOtherSessions, isPending: isDeletingOthers } = useDeleteOtherSessions();
  const { mutate: extendSelfSession } = useExtendSession();
  const { mutate: adminRevokeSession, isPending: isRevokingAdmin } =
    useAdminRevokeUserSession(userId);
  const { mutate: adminExtendSession } = useAdminExtendUserSession(userId);
  const { mutate: adminRevokeAll, isPending: isRevokingAll } =
    useAdminRevokeAllUserSessions(userId);

  const [sessionToDelete, setSessionToDelete] = useState<SessionWithUser | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const handleExtend = isOwnProfile ? extendSelfSession : adminExtendSession;
  const handleDelete = isOwnProfile ? deleteSelfSession : adminRevokeSession;
  const isDeleting = isOwnProfile ? isDeletingSelf : isRevokingAdmin;

  const handleConfirmDelete = useCallback(() => {
    if (!sessionToDelete) return;
    handleDelete(sessionToDelete.id, { onSettled: () => setSessionToDelete(null) });
  }, [handleDelete, sessionToDelete]);

  const handleConfirmRevokeAll = useCallback(() => {
    if (isOwnProfile) {
      const currentSession = sessions.find((s) => s.isCurrent);
      if (currentSession) {
        deleteOtherSessions(currentSession.id, { onSettled: () => setConfirmRevokeAll(false) });
      }
    } else {
      adminRevokeAll(undefined, { onSettled: () => setConfirmRevokeAll(false) });
    }
  }, [isOwnProfile, sessions, deleteOtherSessions, adminRevokeAll]);

  const hasOtherSessions = isOwnProfile ? sessions.length > 1 : sessions.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="px-6 pt-4 pb-2">
          <Box className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            {hasOtherSessions ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRevokeAll(true)}
                disabled={isRevokingAll || isDeletingOthers}
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {isRevokingAll || isDeletingOthers ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Revoke all
              </Button>
            ) : null}
          </Box>
          <p className="text-xs text-muted-foreground">
            Manage devices that are logged into this account.
          </p>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4 space-y-3">
          {isLoading ? (
            <SessionCardSkeleton />
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No active sessions.</p>
          ) : (
            sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onDelete={setSessionToDelete}
                onExtend={handleExtend}
              />
            ))
          )}
        </CardContent>
      </Card>

      {sessionToDelete ? (
        <DeleteSessionDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setSessionToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          deviceName={sessionToDelete.deviceName ?? sessionToDelete.deviceModel}
          isAdminAction={!isOwnProfile}
          isPending={isDeleting}
        />
      ) : null}

      {confirmRevokeAll ? (
        <RevokeAllSessionsDialog
          open={true}
          onOpenChange={setConfirmRevokeAll}
          onConfirm={handleConfirmRevokeAll}
          isAdminAction={!isOwnProfile}
          isPending={isRevokingAll || isDeletingOthers}
        />
      ) : null}
    </>
  );
}

export function UserSecurityForm({ user }: { user: UserDetail }) {
  return (
    <Box className="h-full overflow-y-auto p-6 space-y-4">
      <ChangePasswordBlock userId={user.id} userEmail={user.email} />
      <SecuritySettingsBlock user={user} />
      <ActiveSessionsBlock userId={user.id} />
    </Box>
  );
}
