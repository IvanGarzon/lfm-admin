import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { BulkActionsBar } from './bulk-actions-bar';
import { QuoteStatus } from '@/prisma/client';
import { QuoteListItem } from '../types';

interface QuoteTableProps<TData extends QuoteListItem> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
  onBulkUpdateStatus: (ids: string[], status: QuoteStatus) => void;
  onBulkDelete: (ids: string[]) => void;
  isBulkPending: boolean;
}

export function QuoteTable<TData extends QuoteListItem>({
  table,
  items,
  totalItems,
  onBulkUpdateStatus,
  onBulkDelete,
  isBulkPending,
}: QuoteTableProps<TData>) {
  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <BulkActionsBar
        table={table}
        onUpdateStatus={onBulkUpdateStatus}
        onDelete={onBulkDelete}
        isPending={isBulkPending}
      />
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No quotes found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
