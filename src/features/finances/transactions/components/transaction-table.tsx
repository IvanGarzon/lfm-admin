import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import type { Transaction } from '../types';

interface TransactionTableProps<TData extends Transaction> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function TransactionTable<TData extends Transaction>({
  table,
  items,
  totalItems,
}: TransactionTableProps<TData>) {
  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No transactions found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
