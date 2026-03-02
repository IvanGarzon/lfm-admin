'use client';

import { useState, useMemo } from 'react';
import { Package, Check, Loader2 } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { PriceListCategoryBadge } from '@/features/inventory/price-list/components/price-list-category-badge';
import type { PriceListItemListItem } from '@/features/inventory/price-list/types';

interface PriceListSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PriceListItemListItem[];
  isLoading: boolean;
  selectedItemId: string | null;
  onItemSelect: (item: PriceListItemListItem) => void;
}

export function PriceListSearchDialog({
  open,
  onOpenChange,
  items,
  isLoading,
  selectedItemId,
  onItemSelect,
}: PriceListSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.category?.toLowerCase().includes(query),
    );
  }, [items, searchQuery]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setSearchQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Item</DialogTitle>
          <DialogDescription>Search and select an item from the price list</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Box className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p>Loading items...</p>
          </Box>
        ) : null}

        {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
          <Box className="flex-1 flex flex-col gap-4 overflow-hidden">
            <Box className="relative">
              <Input
                type="search"
                inputSize="lg"
                placeholder="Search items by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus-visible:ring-primary/20 focus-visible:border-primary"
              />
            </Box>
            <Box className="flex-1 border rounded-lg overflow-hidden flex flex-col">
              <Box className="flex-1 overflow-y-auto">
                <Box className="divide-y dark:divide-gray-800">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemSelect(item)}
                      className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
                    >
                      <Box className="shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </Box>
                      <Box className="flex-1 min-w-0">
                        <Box className="font-medium">{item.name}</Box>
                        <Box className="flex items-center gap-2 mt-1">
                          <PriceListCategoryBadge category={item.category} />
                          <Box className="text-sm font-semibold text-primary">
                            {formatCurrency({ number: item.costPerUnit })}
                          </Box>
                        </Box>
                      </Box>
                      {selectedItemId === item.id ? (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      ) : null}
                    </button>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        ) : !isLoading ? (
          <Box className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
            <Package className="h-8 w-8 mb-2" />
            <p>No items found</p>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
