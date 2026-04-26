'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Bell, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SessionCard } from '@/features/users/components/sessions/session-card';
import { SessionCardSkeleton } from '@/features/users/components/sessions/session-card-skeleton';
import { DeleteSessionDialog } from '@/features/users/components/sessions/delete-session-dialog';
import { hasPermission } from '@/lib/permissions';
import { ChangePasswordSchema, type ChangePasswordInput } from '@/schemas/users';
import {
  useChangePassword,
  useSendPasswordResetEmail,
  useUserSessions,
} from '@/features/users/hooks/use-user-queries';
import { useDeleteSession } from '@/features/users/hooks/use-sessions';
import type { UserDetail } from '@/features/users/types';
import type { SessionWithUser } from '@/features/sessions/types';

// -- Change Password Block --------------------------------------------------

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

// -- Security Settings Block ------------------------------------------------

function SecuritySettingsBlock() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(false);

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
          <Box className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Coming soon
            </Badge>
            <Switch checked={twoFactor} onCheckedChange={setTwoFactor} disabled />
          </Box>
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
          <Box className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Coming soon
            </Badge>
            <Switch checked={loginNotifications} onCheckedChange={setLoginNotifications} disabled />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// -- Active Sessions Block --------------------------------------------------

function ActiveSessionsBlock({ userId }: { userId: string }) {
  const { data: sessions = [], isLoading } = useUserSessions(userId);
  const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession();
  const [sessionToDelete, setSessionToDelete] = useState<SessionWithUser | null>(null);

  const handleConfirmDelete = () => {
    if (!sessionToDelete) {
      return;
    }

    deleteSession(sessionToDelete.id, {
      onSettled: () => setSessionToDelete(null),
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="px-6 pt-4 pb-2">
          <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Manage devices that are logged into your account.
          </p>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4 space-y-3">
          {isLoading ? (
            <>
              <SessionCardSkeleton />
              <SessionCardSkeleton />
            </>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No active sessions.</p>
          ) : (
            sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={setSessionToDelete} />
            ))
          )}
        </CardContent>
      </Card>

      <DeleteSessionDialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        deviceName={sessionToDelete?.deviceName ?? sessionToDelete?.deviceModel}
        isPending={isDeleting}
      />
    </>
  );
}

// -- Main Component ---------------------------------------------------------

export function UserSecurityForm({ user }: { user: UserDetail }) {
  return (
    <Box className="h-full overflow-y-auto p-6 space-y-4">
      <ChangePasswordBlock userId={user.id} userEmail={user.email} />
      <SecuritySettingsBlock />
      <ActiveSessionsBlock userId={user.id} />
    </Box>
  );
}
