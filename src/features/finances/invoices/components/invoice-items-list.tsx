'use client';

import { useCallback } from 'react';
import { Reorder } from 'framer-motion';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import { Plus } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import type { ActiveProduct } from '@/features/inventory/products/types';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';
import { InvoiceItemRow } from '@/features/finances/invoices/components/invoice-item-row';

export function InvoiceItemsList({
  form,
  fieldArray,
  products,
  isLoadingProducts,
  isLocked,
}: {
  form: UseFormReturn<InvoiceFormInput>;
  fieldArray: UseFieldArrayReturn<InvoiceFormInput, 'items', 'id'>;
  products: ActiveProduct[] | undefined;
  isLoadingProducts: boolean;
  isLocked?: boolean;
}) {
  const { fields, append, remove, move } = fieldArray;

  const handleAddItem = useCallback(() => {
    append(
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        productId: null,
      },
      { shouldFocus: false },
    );
  }, [append]);

  return (
    <Box className="py-6">
      <Box className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Items details</h3>
      </Box>

      <Box className="border border-border rounded-lg overflow-hidden">
        {/* Table Header */}
        <Box className="bg-muted/50 px-4 py-3 border-b border-border">
          <Box className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Box className="w-4 shrink-0"></Box>
            <Box className="flex-1 min-w-0">Item</Box>
            <Box className="w-18 shrink-0">QTY</Box>
            <Box className="w-30 shrink-0">Cost</Box>
            <Box className="w-30 shrink-0">Total</Box>
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
          {fields.map((field, index) => (
            <InvoiceItemRow
              key={field.id}
              field={field}
              index={index}
              form={form}
              isLocked={isLocked}
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
          ))}
        </Reorder.Group>

        {/* Add Item Button */}
        <Box className="px-4 py-3 bg-card border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddItem}
            disabled={isLocked}
            className="text-sm text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <Plus aria-hidden="true" className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
