'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import type { TenantListItem } from '@/features/admin/tenants/types';
import type { TenantStatus } from '@/prisma/client';

function statusVariant(status: TenantStatus) {
  return status === 'ACTIVE' ? 'success' : 'destructive';
}

export const tenantColumns: ColumnDef<TenantListItem>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link
        href={`/admin/tenants/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'slug',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-sm">{row.original.slug}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)}>
        {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
      </Badge>
    ),
  },
  {
    accessorKey: 'userCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Users" />,
    cell: ({ row }) => row.original.userCount,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => format(new Date(row.original.createdAt), 'dd MMM yyyy'),
  },
];
