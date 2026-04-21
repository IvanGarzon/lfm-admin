'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, RolePolicies } from '@/lib/permissions';
import { UserRole } from '@/prisma/client';
import type { UserDetail } from '@/features/users/types';
import { USER_ROLE_LABELS } from '@/features/users/types';
import type { UpdateUserRoleInput } from '@/schemas/users';

const SELECTABLE_ROLES: UserRole[] = ['USER', 'MANAGER', 'ADMIN'];

export function UserPermissionsForm({
  user,
  onUpdate,
  isUpdating = false,
}: {
  user: UserDetail;
  onUpdate: (data: UpdateUserRoleInput) => void;
  isUpdating?: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const isDirty = selectedRole !== user.role;

  const allowedPermissions = RolePolicies[selectedRole]?.allow ?? [];

  const handleSave = () => {
    onUpdate({ id: user.id, role: selectedRole });
  };

  return (
    <Box className="flex flex-col h-full">
      <Box className="flex-1 overflow-y-auto p-6 space-y-6">
        <Box>
          <p className="text-sm font-medium mb-2">Role</p>
          <Select
            value={selectedRole}
            onValueChange={(v) => {
              const role = SELECTABLE_ROLES.find((role) => role === v);
              if (role !== undefined) {
                setSelectedRole(role);
              }
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
        </Box>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Permissions for {USER_ROLE_LABELS[selectedRole]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allowedPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions assigned.</p>
            ) : (
              <ul className="space-y-2">
                {allowedPermissions.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 size-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
                    <span>{PERMISSIONS[key]?.label ?? key}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box className="border-t p-4 flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating || !isDirty}>
          {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Save role
        </Button>
      </Box>
    </Box>
  );
}
