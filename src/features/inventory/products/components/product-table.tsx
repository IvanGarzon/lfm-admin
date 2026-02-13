'use client';

import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { usePrefetchProduct } from '@/features/inventory/products/hooks/use-products-queries';
import type { ProductListItem } from '@/features/inventory/products/types';

interface ProductTableProps<TData> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function ProductTable<TData>({ table, items, totalItems }: ProductTableProps<TData>) {
  const prefetch = usePrefetchProduct();

  const handleRowHover = (product: TData) => {
    prefetch((product as ProductListItem).id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No products found. Try adjusting your filters or add a new product.
        </Box>
      )}
    </Card>
  );
}
