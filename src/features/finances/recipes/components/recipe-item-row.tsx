'use client';

import { useState } from 'react';
import type { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { GripVertical, Trash2, Package } from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import type { RecipeFormInput } from '@/features/finances/recipes/types';

type RecipeItemRowProps = {
  index: number;
  field: FieldArrayWithId<RecipeFormInput, 'items', 'id'>;
  form: UseFormReturn<RecipeFormInput>;
  canRemove: boolean;
  onRemove: () => void;
  isLocked?: boolean;
  onOpenSearch: () => void;
};

export function RecipeItemRow({
  index,
  field,
  form,
  canRemove,
  onRemove,
  isLocked = false,
  onOpenSearch,
}: RecipeItemRowProps) {
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  // Watch item values for calculations and display
  const [quantity, unitPrice, retailPrice] = useWatch({
    control: form.control,
    name: [`items.${index}.quantity`, `items.${index}.unitPrice`, `items.${index}.retailPrice`],
  });

  // Calculate totals for display
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const retail = Number(retailPrice) || 0;
  const lineTotal = qty * price;
  const retailLineTotal = qty * retail;

  // Update both totals when quantity changes - use newQty directly to avoid stale closure
  const updateLineTotals = (newQty: number) => {
    const newLineTotal = newQty * price;
    const newRetailLineTotal = newQty * retail;
    form.setValue(`items.${index}.lineTotal`, newLineTotal);
    form.setValue(`items.${index}.retailLineTotal`, newRetailLineTotal);
  };

  // Get error states
  const nameError = form.formState.errors.items?.[index]?.name;
  const quantityError = form.formState.errors.items?.[index]?.quantity;

  return (
    <Reorder.Item
      as="div"
      value={field}
      dragListener={false}
      dragControls={dragControls}
      style={{ y }}
      layout="position"
      transition={{ type: 'spring', stiffness: 500, damping: 50, mass: 1 }}
      className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 relative"
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <Box
        className={cn(
          'flex items-center gap-2 px-4 py-3 transition-colors',
          isDragging
            ? 'bg-gray-100 dark:bg-gray-800 shadow-lg cursor-grabbing'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        )}
      >
        {/* Drag Handle */}
        <Box
          className="w-6 shrink-0 flex items-center justify-center"
          onPointerDown={(e) => !isLocked && dragControls.start(e)}
        >
          <GripVertical
            className={cn(
              'h-4 w-4',
              isLocked ? 'text-gray-300' : 'text-gray-400 cursor-grab active:cursor-grabbing',
            )}
          />
        </Box>

        {/* Name with Browse Button */}
        <Box className="flex-1 min-w-0">
          <FormField
            control={form.control}
            name={`items.${index}.name`}
            render={({ field }) => (
              <FormItem className="space-y-0 mb-0">
                <FormControl>
                  <InputGroup
                    className={cn(
                      nameError && 'border-destructive focus-within:ring-destructive/20',
                    )}
                  >
                    <InputGroupInput {...field} placeholder="e.g., Red Rose" disabled={isLocked} />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        onClick={onOpenSearch}
                        aria-label="Browse price list"
                        title="Browse price list"
                        size="icon-xs"
                        className="cursor-pointer hover:text-primary"
                        disabled={isLocked}
                      >
                        <Package />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </Box>

        {/* Quantity */}
        <Box className="w-20 shrink-0">
          <FormField
            control={form.control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <FormItem className="space-y-0 mb-0">
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    onChange={(e) => {
                      const newQty = e.target.valueAsNumber || 0;
                      field.onChange(newQty);
                      updateLineTotals(newQty);
                    }}
                    disabled={isLocked}
                    className={cn(
                      'h-9 border-gray-200 dark:border-gray-700 text-sm text-center',
                      quantityError && 'border-destructive',
                    )}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </Box>

        {/* Price (Display Only) */}
        <Box className="w-24 shrink-0">
          <Box className="h-9 px-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 w-full flex items-center justify-end">
            {formatCurrency({ number: price })}
          </Box>
        </Box>

        {/* Line Total (Display Only) - Commented out per user request */}
        {/* <Box className="w-24 shrink-0">
          <Box className="h-9 px-3 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800 font-semibold text-sm text-emerald-700 dark:text-emerald-400 w-full flex items-center justify-end">
            {formatCurrency({ number: lineTotal })}
          </Box>
        </Box> */}

        {/* Retail Price (Display Only) */}
        <Box className="w-24 shrink-0">
          <Box className="h-9 px-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400 w-full flex items-center justify-end">
            {formatCurrency({ number: retail })}
          </Box>
        </Box>

        {/* Retail Line Total (Display Only) - Commented out per user request */}
        {/* <Box className="w-28 shrink-0">
          <Box className="h-9 px-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 font-semibold text-sm text-blue-700 dark:text-blue-400 w-full flex items-center justify-end">
            {formatCurrency({ number: retailLineTotal })}
          </Box>
        </Box> */}

        {/* Delete Button */}
        <Box className="w-8 shrink-0 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onRemove}
            className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-transparent cursor-pointer"
            disabled={isLocked || !canRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Box>
      </Box>

      {/* Formula Display */}
      <Box className="px-4 pb-2 pt-1 text-xs text-muted-foreground">
        <Box className="flex gap-6 justify-end">
          <span>
            Cost: ({qty}) × {formatCurrency({ number: price })} ={' '}
            {formatCurrency({ number: lineTotal })}
          </span>
          <span>
            Retail: ({qty}) × {formatCurrency({ number: retail })} ={' '}
            {formatCurrency({ number: retailLineTotal })}
          </span>
        </Box>
      </Box>
    </Reorder.Item>
  );
}
