'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Building2, Text } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import type { OrganizationListItem } from '@/features/organizations/types';
import { OrganizationActions } from './organization-actions';

export const createOrganizationColumns = (
  onDelete: (id: string, name: string, customersCount: number) => void,
  onEdit?: (organization: OrganizationListItem) => void,
): ColumnDef<OrganizationListItem>[] => [
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
    id: 'name',
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" />,
    cell: ({ row }) => (
      <Box className="flex items-center gap-3">
        <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-4 w-4" />
        </Box>
        <Box className="flex flex-col">
          <Box className="font-medium">{row.original.name}</Box>
          {row.original.address ? (
            <Box className="text-xs text-muted-foreground">
              {row.original.city && row.original.state
                ? `${row.original.city}, ${row.original.state}`
                : row.original.city || row.original.state || '-'}
            </Box>
          ) : null}
        </Box>
      </Box>
    ),
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Organization',
      placeholder: 'Search organizations...',
      variant: 'text',
      icon: Text,
    },
  },
  {
    id: 'address',
    accessorKey: 'address',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    cell: ({ row }) => {
      const { address, city, state, postcode, country } = row.original;

      if (!address && !city && !state && !postcode) {
        return '-';
      }

      const addressLine1 = address || '';
      const cityStatePostcode = [city, state, postcode].filter(Boolean).join(' ');

      return (
        <Box className="flex flex-col text-sm">
          {addressLine1 && <Box>{addressLine1}</Box>}
          {cityStatePostcode && <Box className="text-muted-foreground">{cityStatePostcode}</Box>}
        </Box>
      );
    },
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => row.original.phone || '-',
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => row.original.email || '-',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={
            status === 'ACTIVE' ? 'default' : status === 'INACTIVE' ? 'secondary' : 'destructive'
          }
        >
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      );
    },
  },
  {
    id: 'customersCount',
    accessorKey: 'customersCount',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Customers" />,
    cell: ({ row }) => row.original.customersCount ?? 0,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <OrganizationActions organization={row.original} onDelete={onDelete} onEdit={onEdit} />
    ),
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];
