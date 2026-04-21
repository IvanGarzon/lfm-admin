'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { MoreHorizontal, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { VendorStatusBadge } from './vendor-status-badge';
import type { VendorListItem } from '@/features/inventory/vendors/types';

interface CreateVendorColumnsOptions {
  onDelete: (id: string, vendorCode: string, name: string) => void;
}

export function createVendorColumns({
  onDelete,
}: CreateVendorColumnsOptions): ColumnDef<VendorListItem>[] {
  return [
    // Selection column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
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

    // Vendor Code column
    {
      accessorKey: 'vendorCode',
      id: 'vendorCode',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor Code" />,
      cell: ({ row }) => {
        const vendorCode = row.getValue('vendorCode') as string;
        return <div className="font-mono font-medium">{vendorCode}</div>;
      },
      enableSorting: true,
    },

    // Name column (searchable)
    {
      id: 'search',
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor Name" />,
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <Link
            href={`/inventory/vendors/${vendor.id}`}
            className="font-medium text-primary dark:text-foreground hover:underline"
          >
            {vendor.name}
          </Link>
        );
      },
      enableSorting: true,
    },

    // Email column
    {
      accessorKey: 'email',
      id: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const email = row.getValue('email') as string;
        return <div className="max-w-[200px] truncate">{email}</div>;
      },
      enableSorting: true,
    },

    // Phone column
    {
      accessorKey: 'phone',
      id: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string | null;
        return <div>{phone || '-'}</div>;
      },
      enableSorting: false,
    },

    // Status column
    {
      accessorKey: 'status',
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as VendorListItem['status'];
        return <VendorStatusBadge status={status} />;
      },
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },

    // Payment Terms column
    {
      accessorKey: 'paymentTerms',
      id: 'paymentTerms',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Payment Terms" />,
      cell: ({ row }) => {
        const paymentTerms = row.getValue('paymentTerms') as number | null;
        return <div>{paymentTerms ? `${paymentTerms} days` : '-'}</div>;
      },
      enableSorting: true,
    },

    // Transaction count column
    {
      accessorKey: 'transactionCount',
      id: 'transactionCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transactions" className="justify-center" />
      ),
      cell: ({ row }) => {
        const count = row.original.transactionCount ?? 0;
        return <div className="text-center font-medium">{count}</div>;
      },
      enableSorting: true,
    },

    // Actions column
    {
      id: 'actions',
      cell: ({ row }) => {
        const vendor = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/inventory/vendors/${vendor.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(vendor.id, vendor.vendorCode, vendor.name)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
