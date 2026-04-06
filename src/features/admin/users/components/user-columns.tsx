'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import type { UserListItem } from '@/features/admin/users/types';
import type { UserRole } from '@/prisma/client';

function roleVariant(role: UserRole) {
  if (role === 'SUPER_ADMIN') return 'default' as const;
  if (role === 'ADMIN') return 'secondary' as const;
  return 'outline' as const;
}

function roleLabel(role: UserRole) {
  return role
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

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
    cell: ({ row }) => (
      <Badge variant={roleVariant(row.original.role)}>{roleLabel(row.original.role)}</Badge>
    ),
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
