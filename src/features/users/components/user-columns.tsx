'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { format } from 'date-fns';
import { Ban, CheckCircle2, CircleDashed, Shield, Text, User, UserCog } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { UserAvatar } from '@/components/shared/user-avatar';
import { USER_ROLE_LABELS, type UserListItem } from '@/features/users/types';
import { UserStatusBadge } from '@/features/users/components/user-status-badge';
import { UserRoleBadge } from '@/features/admin/users/components/user-role-badge';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, userSearchParamsDefaults } from '@/filters/users/users-filters';
import { UserStatusSchema } from '@/zod/schemas/enums/UserStatus.schema';
import { UserRoleSchema } from '@/zod/schemas/enums/UserRole.schema';

const RoleOptions = [
  { label: USER_ROLE_LABELS.USER, value: UserRoleSchema.enum.USER, icon: User },
  { label: USER_ROLE_LABELS.MANAGER, value: UserRoleSchema.enum.MANAGER, icon: UserCog },
  { label: USER_ROLE_LABELS.ADMIN, value: UserRoleSchema.enum.ADMIN, icon: Shield },
];

const StatusOptions = [
  { label: 'Active', value: UserStatusSchema.enum.ACTIVE, icon: CheckCircle2 },
  { label: 'Invited', value: UserStatusSchema.enum.INVITED, icon: CircleDashed },
  { label: 'Suspended', value: UserStatusSchema.enum.SUSPENDED, icon: Ban },
];

function UserLink({ userId, name }: { userId: string; name: string }) {
  const queryString = useQueryString(searchParams, userSearchParamsDefaults);
  const basePath = `/users/${userId}/details`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {name}
    </Link>
  );
}

export const userColumns: ColumnDef<UserListItem>[] = [
  {
    id: 'search',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    cell: ({ row }) => (
      <Box className="flex items-center gap-3">
        <UserAvatar
          user={{ name: `${row.original.firstName} ${row.original.lastName}`, image: null }}
          className="h-8 w-8"
        />
        <Box className="flex flex-col">
          <UserLink
            userId={row.original.id}
            name={`${row.original.firstName} ${row.original.lastName}`}
          />
          <Box className="text-xs text-muted-foreground">{row.original.email}</Box>
        </Box>
      </Box>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'User',
      placeholder: 'Search users...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: {
      label: 'Role',
      variant: 'multiSelect',
      options: RoleOptions,
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    enableSorting: true,
    enableColumnFilter: true,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      options: StatusOptions,
    },
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.phone ?? '—'}</span>
    ),
    meta: {
      label: 'Phone',
    },
  },
  {
    id: 'lastLoginAt',
    accessorKey: 'lastLoginAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Seen" />,
    cell: ({ row }) =>
      row.original.lastLoginAt ? format(new Date(row.original.lastLoginAt), 'MMM dd, yyyy') : '—',
    enableSorting: true,
    meta: {
      label: 'Last Seen',
    },
  },
];
