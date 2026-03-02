'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { Reorder } from 'framer-motion';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { FormLabel } from '@/components/ui/form';
import type { RecipeFormInput } from '@/features/finances/recipes/types';
import { RecipeItemRow } from '@/features/finances/recipes/components/recipe-item-row';
import { PriceListSearchDialog } from '@/components/shared/price-list-search-dialog';
import { useActivePriceListItems } from '@/features/inventory/price-list/hooks/use-price-list-queries';
import type { PriceListItemListItem } from '@/features/inventory/price-list/types';
type RecipeItemsListProps = {
  form: UseFormReturn<RecipeFormInput>;
  fieldArray: UseFieldArrayReturn<RecipeFormInput, 'items', 'id'>;
  isLocked?: boolean;
};

export function RecipeItemsList({ form, fieldArray, isLocked = false }: RecipeItemsListProps) {
  const { fields, append, remove, move } = fieldArray;
  const { data: priceListItems = [], isLoading: isLoadingPriceList } = useActivePriceListItems();

  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddItem = useCallback(() => {
    append(
      {
        priceListItemId: null,
        name: '',
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
        retailPrice: 0,
        retailLineTotal: 0,
        order: fields.length,
      },
      { shouldFocus: false },
    );
  }, [append, fields.length]);

  const handleOpenSearch = useCallback((index: number) => {
    setEditingIndex(index);
    setSearchDialogOpen(true);
  }, []);

  const handleSelectPriceListItem = useCallback(
    (item: PriceListItemListItem) => {
      if (editingIndex !== null) {
        const quantity = form.getValues(`items.${editingIndex}.quantity`) || 1;

        // Cost calculations
        const costLineTotal = item.costPerUnit * quantity;

        // Retail calculations
        const retailPricePerUnit = item.retailPriceOverride ?? item.retailPrice;
        const retailLineTotal = retailPricePerUnit * quantity;

        // Set all values
        form.setValue(`items.${editingIndex}.priceListItemId`, item.id);
        form.setValue(`items.${editingIndex}.name`, item.name);
        form.setValue(`items.${editingIndex}.unitPrice`, item.costPerUnit);
        form.setValue(`items.${editingIndex}.lineTotal`, costLineTotal);
        form.setValue(`items.${editingIndex}.retailPrice`, retailPricePerUnit);
        form.setValue(`items.${editingIndex}.retailLineTotal`, retailLineTotal);
      }
      setSearchDialogOpen(false);
      setEditingIndex(null);
    },
    [editingIndex, form],
  );

  return (
    <Box className="py-6">
      <Box className="flex items-center justify-between mb-4">
        <FormLabel className="text-base font-semibold">Items</FormLabel>
      </Box>

      <Box className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <Box className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Box className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            <Box className="w-6 shrink-0" />
            <Box className="flex-1 min-w-0">Name</Box>
            <Box className="w-20 shrink-0 text-center">Qty</Box>
            <Box className="w-24 shrink-0 text-right">Cost</Box>
            <Box className="w-24 shrink-0 text-right">Cost Total</Box>
            <Box className="w-24 shrink-0 text-right">Retail</Box>
            <Box className="w-28 shrink-0 text-right">Retail Total</Box>
            <Box className="w-8 shrink-0" />
          </Box>
        </Box>

        {/* Items List */}
        <Reorder.Group
          values={fields}
          onReorder={(newOrder) => {
            const movedItemId = newOrder.find((item, index) => fields[index].id !== item.id)?.id;
            if (!movedItemId) return;

            const from = fields.findIndex((item) => item.id === movedItemId);
            const to = newOrder.findIndex((item) => item.id === movedItemId);

            if (from !== -1 && to !== -1) {
              move(from, to);
            }
          }}
          as="div"
        >
          {fields.map((field, index) => (
            <RecipeItemRow
              key={field.id}
              field={field}
              index={index}
              form={form}
              isLocked={isLocked}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
              onOpenSearch={() => handleOpenSearch(index)}
            />
          ))}
        </Reorder.Group>

        {/* Empty State */}
        {fields.length === 0 ? (
          <Box className="px-4 py-8 text-center text-sm text-muted-foreground">
            No items added yet. Click &quot;Add Item&quot; to get started.
          </Box>
        ) : null}

        {/* Add Item Button */}
        <Box className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddItem}
            disabled={isLocked}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-secondary cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Price List Search Dialog */}
      <PriceListSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        items={priceListItems}
        isLoading={isLoadingPriceList}
        selectedItemId={
          editingIndex !== null ? form.getValues(`items.${editingIndex}.priceListItemId`) : null
        }
        onItemSelect={handleSelectPriceListItem}
      />
    </Box>
  );
}
