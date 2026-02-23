'use client';

import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { usePrefetchVendor } from '@/features/inventory/vendors/hooks/use-vendor-queries';
import type { VendorListItem } from '@/features/inventory/vendors/types';

interface VendorTableProps<TData> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function VendorTable<TData>({ table, items, totalItems }: VendorTableProps<TData>) {
  const prefetch = usePrefetchVendor();

  const handleRowHover = (vendor: TData) => {
    prefetch((vendor as VendorListItem).id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No vendors found. Try adjusting your filters or add a new vendor.
        </Box>
      )}
    </Card>
  );
}
