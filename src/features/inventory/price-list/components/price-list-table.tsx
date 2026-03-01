'use client';

import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { usePrefetchPriceListItem } from '@/features/inventory/price-list/hooks/use-price-list-queries';
import type { PriceListItemListItem } from '@/features/inventory/price-list/types';

interface PriceListTableProps<TData> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function PriceListTable<TData>({ table, items, totalItems }: PriceListTableProps<TData>) {
  const prefetch = usePrefetchPriceListItem();

  const handleRowHover = (item: TData) => {
    prefetch((item as PriceListItemListItem).id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No items found. Try adjusting your filters or add a new item.
        </Box>
      )}
    </Card>
  );
}
