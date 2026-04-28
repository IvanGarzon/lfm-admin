'use client';

import { useCallback } from 'react';
import { useForm, useWatch, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Box } from '@/components/ui/box';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, PERMISSION_GROUPS, RolePolicies } from '@/lib/permissions';
import type { UserRole } from '@/zod/schemas/enums/UserRole.schema';
import type { UserDetail, AccessChange } from '@/features/users/types';
import { USER_ROLE_LABELS } from '@/features/users/types';
import { UserRoleBadge } from '@/features/admin/users/components/user-role-badge';
import { UpdateUserRoleSchema, type UpdateUserRoleInput } from '@/schemas/users';
import { useUserRoleChanges } from '@/features/users/hooks/use-user-queries';

const SELECTABLE_ROLES: UserRole[] = ['USER', 'MANAGER', 'ADMIN'];

function RecentAccessChanges({ userId }: { userId: string }) {
  const { data: changes = [], isLoading } = useUserRoleChanges(userId);

  return (
    <Card>
      <CardHeader className="px-6 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">Recent Access Changes</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pt-0 pb-4">
        {isLoading ? (
          <Box className="flex justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </Box>
        ) : changes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No access changes recorded yet.</p>
        ) : (
          <Box className="divide-y max-h-48 overflow-y-auto">
            {changes.map((change: AccessChange) => (
              <Box key={change.id} className="flex items-start justify-between py-3 gap-4">
                <Box>
                  <Box className="flex items-center gap-2">
                    <p className="text-sm font-medium">{change.message}</p>
                    {change.toRole ? (
                      <UserRoleBadge role={change.toRole} className="text-xs" />
                    ) : null}
                  </Box>
                  <p className="text-xs text-muted-foreground mt-0.5">By {change.changedByName}</p>
                </Box>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                </span>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export function UserPermissionsForm({
  user,
  onUpdate,
  onDirtyChange,
}: {
  user: UserDetail;
  onUpdate: (data: UpdateUserRoleInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
  const { control, handleSubmit } = useForm<UpdateUserRoleInput>({
    resolver: zodResolver(UpdateUserRoleSchema),
    defaultValues: { id: user.id, role: user.role },
  });

  const selectedRole = useWatch({ control, name: 'role' });
  const allowedPermissions = new Set(RolePolicies[selectedRole]?.allow ?? []);

  const onSubmit: SubmitHandler<UpdateUserRoleInput> = useCallback(
    (data) => {
      onUpdate({ ...data, id: user.id });
    },
    [onUpdate, user.id],
  );

  return (
    <form id="form-permissions" className="flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
      <Box className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader className="px-6 pt-4 pb-4">
            <CardTitle className="text-sm font-medium">Role Assignment</CardTitle>
            <p className="text-xs text-muted-foreground">
              Select a predefined role to set permissions below
            </p>
          </CardHeader>
          <CardContent className="px-6 pt-0 pb-4">
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    onDirtyChange?.(value !== user.role);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SELECTABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {USER_ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </CardContent>
        </Card>

        {PERMISSION_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader className="px-6 pt-4 pb-2">
              <CardTitle className="text-sm font-medium">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-4">
              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.keys.map((key) => {
                  const enabled = allowedPermissions.has(key);
                  return (
                    <Box key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`perm-${key}`}
                        checked={enabled}
                        disabled
                        aria-readonly="true"
                        className="pointer-events-none"
                      />
                      <label
                        htmlFor={`perm-${key}`}
                        className="text-sm text-muted-foreground cursor-default select-none"
                      >
                        {PERMISSIONS[key]?.label ?? key}
                      </label>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        ))}

        <RecentAccessChanges userId={user.id} />
      </Box>
    </form>
  );
}
