'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Text } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { UserAvatar } from '@/components/shared/user-avatar';
import type { CustomerListItem } from '@/features/crm/customers/types';
import { useQueryString } from '@/hooks/use-query-string';
import { customerSearchParamsDefaults, searchParams } from '@/filters/customers/customers-filters';
import { CustomerStatusBadge } from '@/features/crm/customers/components/customer-status-badge';
import { CustomerActions } from '@/features/crm/customers/components/customer-actions';
import { CUSTOMER_STATUS_OPTIONS } from '@/features/crm/customers/constants/customer-status-options';

function CustomerLink({ customerId, name }: { customerId: string; name: string }) {
  const queryString = useQueryString(searchParams, customerSearchParamsDefaults);
  const basePath = `/crm/customers/${customerId}`;
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
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <CustomerStatusBadge status={row.original.status} />,
    enableColumnFilter: true,
    enableSorting: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      options: CUSTOMER_STATUS_OPTIONS,
    },
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
