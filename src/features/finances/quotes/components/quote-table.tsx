import { Table } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/tableV3/data-table';
import { DataTableToolbar } from '@/components/shared/tableV3/data-table-toolbar';
import { BulkActionsBar } from './bulk-actions-bar';

import { QuoteListItem } from '../types';
import { usePrefetchQuote } from '../hooks/use-quote-queries';
import { useQueryState, parseAsBoolean, parseAsInteger } from 'nuqs';
import { cn } from '@/lib/utils';

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
  const prefetchQuote = usePrefetchQuote();
  const [isFavourite, setIsFavourite] = useQueryState(
    'isFavourite',
    parseAsBoolean.withDefault(false).withOptions({ shallow: false }),
  );
  const [, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  );

  const handleRowHover = (quote: TData) => {
    prefetchQuote(quote.id);
  };

  const toggleFavouritesFilter = () => {
    void setIsFavourite(isFavourite ? false : true);
    void setPage(1);
  };

  return (
    <Card className="flex w-full flex-col space-y-4 p-4 overflow-hidden min-w-0">
      <BulkActionsBar
        table={table}
        onUpdateStatus={onBulkUpdateStatus}
        onDelete={onBulkDelete}
        isPending={isBulkPending}
      />
      <DataTableToolbar table={table}>
        <Button
          variant={isFavourite ? 'default' : 'outline'}
          size="sm"
          onClick={toggleFavouritesFilter}
          className={cn(isFavourite && 'bg-amber-500 hover:bg-amber-600')}
        >
          <Star className={cn('h-4 w-4 mr-2', isFavourite && 'fill-current')} />
          {isFavourite ? 'Showing Favourites' : 'Show Favourites'}
        </Button>
      </DataTableToolbar>
      {items.length ? (
        <DataTable table={table} totalItems={totalItems} onRowHover={handleRowHover} />
      ) : (
        <Box className="text-center py-12 text-muted-foreground">
          No quotes found. Try adjusting your filters.
        </Box>
      )}
    </Card>
  );
}
