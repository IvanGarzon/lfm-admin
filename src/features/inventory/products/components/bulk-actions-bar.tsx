'use client';

import { Table } from '@tanstack/react-table';
import { Trash2, Package, PackageX, PackageMinus } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProductListItem } from '@/features/inventory/products/types';
import type { ProductStatus } from '@/prisma/client';

interface BulkActionsBarProps<TData> {
  table: Table<TData>;
  onUpdateStatus: (rows: TData[], status: ProductStatus) => void;
  onDelete: (rows: TData[]) => void;
  isPending?: boolean;
}

export function BulkActionsBar<TData>({
  table,
  onUpdateStatus,
  onDelete,
  isPending = false,
}: BulkActionsBarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  if (!hasSelection) return null;

  const rows = selectedRows.map((row) => row.original);

  return (
    <Box className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 animate-in fade-in slide-in-from-top-2">
      <Box className="flex-1 px-2 text-sm font-medium">
        {selectedRows.length} {selectedRows.length === 1 ? 'product' : 'products'} selected
      </Box>

      <Box className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              Update Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Change Status to:</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onUpdateStatus(rows, 'ACTIVE')}>
              <Package className="h-4 w-4 text-green-600" aria-hidden="true" />
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(rows, 'INACTIVE')}>
              <PackageMinus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Inactive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus(rows, 'OUT_OF_STOCK')}>
              <PackageX className="h-4 w-4 text-red-600" aria-hidden="true" />
              Out of Stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="destructive" size="sm" disabled={isPending} onClick={() => onDelete(rows)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.toggleAllPageRowsSelected(false)}
          disabled={isPending}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
}
