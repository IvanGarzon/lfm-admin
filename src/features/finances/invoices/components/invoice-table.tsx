import { Table } from '@tanstack/react-table';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { usePrefetchInvoice } from '@/features/finances/invoices/hooks/use-invoice-queries';
import type { InvoiceListItem } from '@/features/finances/invoices/types';

interface InvoiceTableProps<TData> {
  table: Table<TData>;
  items: TData[];
  totalItems: number;
}

export function InvoiceTable<TData>({ table, items, totalItems }: InvoiceTableProps<TData>) {
  const prefetchInvoice = usePrefetchInvoice();

  const handleRowHover = (invoice: TData) => {
    const invoiceData = invoice as unknown as InvoiceListItem;
    prefetchInvoice(invoiceData.id);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <DataTableToolbar table={table} />
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No invoices found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
