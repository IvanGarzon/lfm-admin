'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { VendorStatusBadge } from './vendor-status-badge';
import { VendorActions } from '@/features/inventory/vendors/components/vendor-actions';
import { useVendorHref } from '@/features/inventory/vendors/hooks/use-vendor-href';
import type { VendorListItem } from '@/features/inventory/vendors/types';

interface CreateVendorColumnsOptions {
  onDelete: (id: string, vendorCode: string, name: string) => void;
}

function VendorLink({ id, name }: { id: string; name: string }) {
  const href = useVendorHref(id);
  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {name}
    </Link>
  );
}

export function createVendorColumns({
  onDelete,
}: CreateVendorColumnsOptions): ColumnDef<VendorListItem>[] {
  return [
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
    {
      id: 'search',
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor Name" />,
      cell: ({ row }) => <VendorLink id={row.original.id} name={row.original.name} />,
      enableSorting: true,
    },
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
    {
      id: 'actions',
      cell: ({ row }) => <VendorActions vendor={row.original} onDelete={onDelete} />,
      enableHiding: false,
      meta: {
        className: 'text-right',
      },
    },
  ];
}
