'use client';

import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { usePrefetchCustomer } from '@/features/customers/hooks/use-customer-queries';
import type { CustomerListItem } from '@/features/customers/types';

interface CustomersTableProps<TData> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function CustomersTable<TData>({ table, items, totalItems }: CustomersTableProps<TData>) {
  const prefetchCustomer = usePrefetchCustomer();

  const handleRowHover = (customer: TData) => {
    const customerData = customer as unknown as CustomerListItem;
    prefetchCustomer(customerData.id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No customers found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
