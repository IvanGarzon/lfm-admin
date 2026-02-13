'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { MoreHorizontal, Pencil, Trash2, Package, PackageX, PackageMinus } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
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
import { ProductStatusBadge } from '@/features/inventory/products/components/product-status-badge';
import type { ProductListItem } from '@/features/inventory/products/types';
import type { ProductStatus } from '@/prisma/client';

// Status options for filtering
const statusOptions = [
  { label: 'Active', value: 'ACTIVE', icon: Package },
  { label: 'Inactive', value: 'INACTIVE', icon: PackageMinus },
  { label: 'Out of Stock', value: 'OUT_OF_STOCK', icon: PackageX },
];

interface CreateProductColumnsOptions {
  onDelete: (id: string, name: string) => void;
}

export function createProductColumns({
  onDelete,
}: CreateProductColumnsOptions): ColumnDef<ProductListItem>[] {
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

    // Name column (searchable)
    {
      id: 'search',
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <Link
            href={`/inventory/products/${product.id}`}
            className="font-medium text-primary hover:underline"
          >
            {product.name}
          </Link>
        );
      },
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Product Name',
        placeholder: 'Search products...',
        variant: 'text',
      },
    },

    // Status column (filterable)
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <ProductStatusBadge status={row.getValue('status')} />,
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      enableColumnFilter: true,
      meta: {
        label: 'Status',
        variant: 'multiSelect',
        options: statusOptions,
      },
    },

    // Price column
    {
      id: 'price',
      accessorKey: 'price',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
      cell: ({ row }) => {
        const price = row.original.price ?? 0;
        return <Box className="font-medium">{formatCurrency({ number: price })}</Box>;
      },
      enableSorting: true,
    },

    // Stock column
    {
      id: 'stock',
      accessorKey: 'stock',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number;
        const isLowStock = stock > 0 && stock <= 10;
        const isOutOfStock = stock === 0;

        return (
          <Box
            className={`font-medium ${
              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-foreground'
            }`}
          >
            {stock}
          </Box>
        );
      },
      enableSorting: true,
    },

    // Created date column
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'MMM d, yyyy'),
      enableSorting: true,
    },

    // Actions column
    {
      id: 'actions',
      cell: ({ row }) => {
        const product = row.original;

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
                <Link href={`/inventory/products/${product.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(product.id, product.name)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
    },
  ];
}
