'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import type { UserListItem } from '@/features/admin/users/types';
import { UserRoleBadge } from './user-role-badge';

export const userColumns: ColumnDef<UserListItem>[] = [
  {
    id: 'name',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
  },
  {
    id: 'tenant',
    accessorFn: (row) => row.tenant?.name ?? '',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant" />,
    cell: ({ row }) =>
      row.original.tenant ? (
        <Link
          href={`/admin/tenants/${row.original.tenantId}`}
          className="hover:text-primary transition-colors hover:underline"
        >
          {row.original.tenant.name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];
