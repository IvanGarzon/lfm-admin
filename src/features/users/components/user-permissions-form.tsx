'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PERMISSIONS, RolePolicies, type PermissionKey } from '@/lib/permissions';

import type { UserDetail, AccessChange } from '@/features/users/types';
import { USER_ROLE_LABELS } from '@/features/users/types';
import type { UpdateUserRoleInput } from '@/schemas/users';
import { useUserRoleChanges } from '@/features/users/hooks/use-user-queries';

type PermissionGroup = {
  title: string;
  keys: PermissionKey[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'CRM',
    keys: [
      'canReadCustomers',
      'canManageCustomers',
      'canReadOrganisations',
      'canManageOrganisations',
    ],
  },
  {
    title: 'Finances',
    keys: [
      'canReadInvoices',
      'canManageInvoices',
      'canRecordPayments',
      'canReadQuotes',
      'canManageQuotes',
      'canReadTransactions',
      'canManageTransactions',
    ],
  },
  {
    title: 'Inventory',
    keys: [
      'canReadProducts',
      'canManageProducts',
      'canReadVendors',
      'canManageVendors',
      'canReadRecipes',
      'canManageRecipes',
      'canReadPriceList',
      'canManagePriceList',
    ],
  },
  {
    title: 'Staff',
    keys: ['canReadEmployees', 'canManageEmployees'],
  },
  {
    title: 'Administration',
    keys: ['canManageUsers', 'canManageSettings', 'canAccessTools'],
  },
];

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
          <Box className="divide-y">
            {changes.map((change: AccessChange) => (
              <Box key={change.id} className="flex items-start justify-between py-3 gap-4">
                <Box>
                  <p className="text-sm font-medium">{change.message}</p>
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
  isUpdating = false,
}: {
  user: UserDetail;
  onUpdate: (data: UpdateUserRoleInput) => void;
  isUpdating?: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const isDirty = selectedRole !== user.role;
  const allowedPermissions = new Set(RolePolicies[selectedRole]?.allow ?? []);

  const handleSave = () => {
    onUpdate({ id: user.id, role: selectedRole });
  };

  return (
    <Box className="flex flex-col h-full">
      <Box className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader className="px-6 pt-4 pb-4">
            <CardTitle className="text-sm font-medium">Role Assignment</CardTitle>
            <p className="text-xs text-muted-foreground">
              Select a predefined role to set permissions below
            </p>
          </CardHeader>
          <CardContent className="px-6 pt-0 pb-4">
            <Select
              value={selectedRole}
              onValueChange={(v) => {
                const role = SELECTABLE_ROLES.find((r) => r === v);
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
          </CardContent>
        </Card>

        {/* -- Permission groups ---------------------------------------------- */}
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

        {/* -- Recent access changes ------------------------------------------ */}
        <RecentAccessChanges userId={user.id} />
      </Box>

      <Box className="border-t p-4 flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating || !isDirty}>
          {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Update Permissions
        </Button>
      </Box>
    </Box>
  );
}
