'use client';

import { useCallback, useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { Plus } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { FormLabel } from '@/components/ui/form';
import type { ActiveProduct } from '@/features/products/types';
import type { QuoteFormInput } from '@/features/finances/quotes/types';
import { QuoteItemRow } from '@/features/finances/quotes/components/quote-item-row';

export function QuoteItemsList({
  form,
  fieldArray,
  products,
  isLoadingProducts,
  isLocked,
  quoteId,
}: {
  form: UseFormReturn<QuoteFormInput>;
  fieldArray: UseFieldArrayReturn<QuoteFormInput, 'items', 'id'>;
  products: ActiveProduct[] | undefined;
  isLoadingProducts: boolean;
  isLocked?: boolean;
  quoteId?: string;
}) {
  const { fields, append, remove, move } = fieldArray;

  const handleAddItem = useCallback(() => {
    append(
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        productId: null,
        colors: [],
      },
      { shouldFocus: false },
    );
  }, [append]);

  return (
    <Box className="py-6">
      <Box className="flex items-center justify-between mb-4">
        <FormLabel className="text-base font-semibold">Items details</FormLabel>
      </Box>

      <Box className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <Box className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Box className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            <Box className="w-4 shrink-0"></Box>
            <Box className="flex-1 min-w-0">Item</Box>
            <Box className="w-18 shrink-0">QTY</Box>
            <Box className="w-30 shrink-0">Cost</Box>
            <Box className="w-30 shrink-0">Total</Box>
            <Box className="w-4 shrink-0"></Box>
            <Box className="w-4 shrink-0"></Box>
          </Box>
        </Box>

        {/* Items List */}
        <Reorder.Group
          values={fields}
          onReorder={(newOrder) => {
            // A single drag-and-drop reorder can be represented by a single `move` operation.
            // We need to find which item was moved and from where to where.
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
          {fields.map((field, index) => {
            // Get the database item ID (only exists for saved items)
            const itemId = form.watch(`items.${index}.id`);

            return (
              <QuoteItemRow
                key={field.id}
                field={field}
                index={index}
                form={form}
                isLocked={isLocked}
                quoteId={quoteId}
                itemId={itemId}
                products={products}
                isLoadingProducts={isLoadingProducts}
                canRemove={fields.length > 1}
                onRemove={() => {
                  const nextFocusIndex = index === 0 ? 0 : index - 1;
                  remove(index);
                  if (fields.length > 1) {
                    form.setFocus(`items.${nextFocusIndex}.description`);
                  }
                }}
              />
            );
          })}
        </Reorder.Group>

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
    </Box>
  );
}
