'use client';

import { ProductStatusSchema, type ProductStatus } from '@/zod/schemas/enums/ProductStatus.schema';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Package, PackageX, PackageMinus } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/shared/tableV3/data-table-column-header';
import { ProductStatusBadge } from '@/features/inventory/products/components/product-status-badge';
import type { ProductListItem } from '@/features/inventory/products/types';
import { ProductActions } from '@/features/inventory/products/components/product-actions';
import { useProductHref } from '@/features/inventory/products/hooks/use-product-href';

const statusOptions: {
  label: string;
  value: ProductStatus;
  icon: React.FC;
}[] = [
  { label: 'Active', value: ProductStatusSchema.enum.ACTIVE, icon: Package },
  { label: 'Inactive', value: ProductStatusSchema.enum.INACTIVE, icon: PackageMinus },
  { label: 'Out of Stock', value: ProductStatusSchema.enum.OUT_OF_STOCK, icon: PackageX },
];

function ProductLink({ productId, name }: { productId: string; name: string }) {
  const href = useProductHref(productId);

  return (
    <Link href={href} className="font-medium hover:text-primary transition-colors hover:underline">
      {name}
    </Link>
  );
}

interface CreateProductColumnsOptions {
  onDelete: (id: string, name: string) => void;
}

export const createProductColumns = ({
  onDelete,
}: CreateProductColumnsOptions): ColumnDef<ProductListItem>[] => [
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
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Product Name" />,
    cell: ({ row }) => <ProductLink productId={row.original.id} name={row.original.name} />,
    enableSorting: true,
    enableColumnFilter: true,
    meta: {
      label: 'Product Name',
      placeholder: 'Search products...',
      variant: 'text',
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <ProductStatusBadge status={row.getValue('status')} />,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id));
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect',
      options: statusOptions,
    },
  },
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
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'MMM d, yyyy'),
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProductActions product={row.original} onDelete={onDelete} />,
    enableHiding: false,
    meta: {
      className: 'text-right',
    },
  },
];
