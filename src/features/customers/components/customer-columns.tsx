'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Text } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import type { CustomerListItem } from '@/features/customers/types';
import { useCustomerQueryString } from '@/features/customers/hooks/use-customer-query-string';
import { customerSearchParamsDefaults, searchParams } from '@/filters/customers/customers-filters';
import { Badge } from '@/components/ui/badge';
import { CustomerActions } from './customer-actions';

function CustomerLink({ customerId, name }: { customerId: string; name: string }) {
  const queryString = useCustomerQueryString(searchParams, customerSearchParamsDefaults);
  const basePath = `/customers/${customerId}`;
  const href = queryString ? `${basePath}?${queryString}` : basePath;

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {name}
    </Link>
  );
}

export const createCustomerColumns = (
  onDelete: (id: string, name: string) => void,
): ColumnDef<CustomerListItem>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'search',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
    cell: ({ row }) => (
      <Box className="flex items-center gap-3">
        <UserAvatar
          user={{ name: `${row.original.firstName} ${row.original.lastName}`, image: null }}
          className="h-8 w-8"
        />
        <Box className="flex flex-col">
          <CustomerLink
            customerId={row.original.id}
            name={`${row.original.firstName} ${row.original.lastName}`}
          />
          <Box className="text-xs text-muted-foreground">{row.original.email}</Box>
        </Box>
      </Box>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Customer',
      placeholder: 'Search customers...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={
            status === 'ACTIVE' ? 'success' : status === 'INACTIVE' ? 'secondary' : 'destructive'
          }
        >
          {status}
        </Badge>
      );
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    id: 'organization',
    accessorKey: 'organizationName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" />,
    cell: ({ row }) => row.original.organizationName || '-',
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
  },
  {
    id: 'invoices',
    header: 'Invoices',
    cell: ({ row }) => row.original.invoicesCount ?? 0,
  },
  {
    id: 'quotes',
    header: 'Quotes',
    cell: ({ row }) => row.original.quotesCount ?? 0,
  },
  {
    id: 'actions',
    cell: ({ row }) => <CustomerActions customer={row.original} onDelete={onDelete} />,
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];
