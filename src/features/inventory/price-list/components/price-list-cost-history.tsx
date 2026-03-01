'use client';

import { format } from 'date-fns';
import { TrendingUp, TrendingDown, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePriceListCostHistory } from '@/features/inventory/price-list/hooks/use-price-list-queries';

interface PriceListCostHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | undefined;
  itemName?: string;
}

export function PriceListCostHistory({
  open,
  onOpenChange,
  itemId,
  itemName,
}: PriceListCostHistoryProps) {
  const { data: history, isLoading } = usePriceListCostHistory(open ? itemId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Cost History {itemName ? `— ${itemName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <Box className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <Box className="py-8 text-center text-sm text-muted-foreground">Loading history...</Box>
          ) : !history || history.length === 0 ? (
            <Box className="py-8 text-center text-sm text-muted-foreground">
              No cost changes recorded yet.
            </Box>
          ) : (
            <Box className="space-y-3">
              {history.map((entry) => {
                const isIncrease = entry.newCost > entry.previousCost;
                return (
                  <Box
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <Box className="flex items-center gap-3">
                      {isIncrease ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                      <Box>
                        <Box className="text-sm font-medium">
                          {formatCurrency({ number: entry.previousCost })} →{' '}
                          {formatCurrency({ number: entry.newCost })}
                        </Box>
                        <Box className="text-xs text-muted-foreground">
                          {format(new Date(entry.changedAt), 'MMM d, yyyy h:mm a')}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
