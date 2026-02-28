'use client';

import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { useState } from 'react';

import { cn, formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormLabel } from '@/components/ui/form';
import {
  RecipeItemTypeSchema,
  type RecipeItemType,
} from '@/zod/schemas/enums/RecipeItemType.schema';
import type { RecipeFormInput } from '@/features/finances/recipes/types';

export function RecipeItemsList({ isLocked = false }: { isLocked?: boolean }) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<RecipeFormInput>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({
    control,
    name: 'items',
  });

  const handleAddItem = () => {
    append({
      description: '',
      type: 'FLORAL',
      purchaseUnit: 'Stem',
      purchaseUnitQuantity: 1,
      purchaseCost: 0,
      unitCost: 0,
      quantityUsed: 1,
      subtotal: 0,
      order: fields.length,
    });
  };

  const calculateItemCosts = (index: number) => {
    const item = watchedItems[index];
    if (!item) return;

    const purchaseCost = Number(item.purchaseCost) || 0;
    const purchaseUnitQuantity = Number(item.purchaseUnitQuantity) || 1;
    const quantityUsed = Number(item.quantityUsed) || 0;

    const unitCost = purchaseCost / purchaseUnitQuantity;
    const subtotal = unitCost * quantityUsed;

    setValue(`items.${index}.unitCost`, unitCost);
    setValue(`items.${index}.subtotal`, subtotal);
  };

  return (
    <Box className="py-6">
      <Box className="flex items-center justify-between mb-4">
        <FormLabel className="text-base font-semibold">Materials & Ingredients</FormLabel>
      </Box>

      <Box className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <Box className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Box className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            <Box className="w-4 shrink-0" />
            <Box className="w-[180px] min-w-0 shrink-0">Item</Box>
            <Box className="w-20 shrink-0">Type</Box>
            <Box className="w-20 shrink-0">I paid</Box>
            <Box className="w-12 shrink-0 text-center">for</Box>
            <Box className="w-16 shrink-0">Unit</Box>
            <Box className="w-24 shrink-0 text-right">= Cost/Unit</Box>
            <Box className="w-20 shrink-0">I use</Box>
            <Box className="w-24 shrink-0 text-right">= Total</Box>
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
              isLocked={isLocked}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
              register={register}
              setValue={setValue}
              errors={errors}
              watchedItem={watchedItems[index]}
              calculateItemCosts={calculateItemCosts}
            />
          ))}
        </Reorder.Group>

        {/* Empty State */}
        {fields.length === 0 && (
          <Box className="px-4 py-8 text-center text-sm text-muted-foreground">
            No materials added yet. Click "Add Item" to get started.
          </Box>
        )}

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

function RecipeItemRow({
  field,
  index,
  isLocked,
  canRemove,
  onRemove,
  register,
  setValue,
  errors,
  watchedItem,
  calculateItemCosts,
}: {
  field: any;
  index: number;
  isLocked: boolean;
  canRemove: boolean;
  onRemove: () => void;
  register: any;
  setValue: any;
  errors: any;
  watchedItem: any;
  calculateItemCosts: (index: number) => void;
}) {
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  const itemError = errors.items?.[index];

  // Get current unit for display
  const currentUnit = watchedItem?.purchaseUnit || 'Unit';
  const unitCost = watchedItem?.unitCost || 0;

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
          className="w-4 shrink-0 flex items-center justify-center"
          onPointerDown={(e) => !isLocked && dragControls.start(e)}
        >
          <GripVertical
            className={cn(
              'h-4 w-4',
              isLocked ? 'text-gray-300' : 'text-gray-400 cursor-grab active:cursor-grabbing',
            )}
          />
        </Box>

        {/* Item Description */}
        <Box className="w-[180px] min-w-0 shrink-0">
          <Input
            {...register(`items.${index}.description`)}
            placeholder="e.g., Red Rose"
            disabled={isLocked}
            className={cn(
              'h-9 border-gray-200 dark:border-gray-700',
              itemError?.description && 'border-destructive',
            )}
          />
        </Box>

        {/* Type */}
        <Box className="w-20 shrink-0">
          <Select
            defaultValue={field.type}
            onValueChange={(val) => setValue(`items.${index}.type`, val as RecipeItemType)}
            disabled={isLocked}
          >
            <SelectTrigger className="h-9 border-gray-200 dark:border-gray-700 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RecipeItemTypeSchema.options.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>

        {/* I paid (Purchase Cost) */}
        <Box className="w-20 shrink-0">
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="$0.00"
            {...register(`items.${index}.purchaseCost`, {
              valueAsNumber: true,
              onChange: () => calculateItemCosts(index),
            })}
            disabled={isLocked}
            className="h-9 border-gray-200 dark:border-gray-700 text-sm"
          />
        </Box>

        {/* for (Purchase Unit Quantity) */}
        <Box className="w-12 shrink-0">
          <Input
            type="number"
            step="1"
            min="1"
            {...register(`items.${index}.purchaseUnitQuantity`, {
              valueAsNumber: true,
              onChange: () => calculateItemCosts(index),
            })}
            disabled={isLocked}
            className="h-9 border-gray-200 dark:border-gray-700 text-sm text-center"
          />
        </Box>

        {/* Unit (Purchase Unit) */}
        <Box className="w-16 shrink-0">
          <Input
            {...register(`items.${index}.purchaseUnit`)}
            placeholder="Stem"
            disabled={isLocked}
            className="h-9 border-gray-200 dark:border-gray-700 text-sm"
          />
        </Box>

        {/* = Cost/Unit (Calculated) */}
        <Box className="w-24 shrink-0">
          <Box className="h-9 px-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 w-full flex items-center justify-end">
            {formatCurrency({ number: unitCost })}/{currentUnit.toLowerCase()}
          </Box>
        </Box>

        {/* I use (Quantity Used) + unit label */}
        <Box className="w-20 shrink-0">
          <Box className="flex items-center gap-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register(`items.${index}.quantityUsed`, {
                valueAsNumber: true,
                onChange: () => calculateItemCosts(index),
              })}
              disabled={isLocked}
              className="h-9 border-gray-200 dark:border-gray-700 text-sm w-14"
            />
            <span className="text-xs text-gray-500 truncate">{currentUnit.toLowerCase()}s</span>
          </Box>
        </Box>

        {/* = Total (Subtotal) */}
        <Box className="w-24 shrink-0">
          <Box className="h-9 px-3 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800 font-semibold text-sm text-emerald-700 dark:text-emerald-400 w-full flex items-center justify-end">
            {formatCurrency({ number: watchedItem?.subtotal || 0 })}
          </Box>
        </Box>

        {/* Delete Button */}
        <Box className="w-8 shrink-0 flex items-center justify-center">
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-transparent cursor-pointer"
              disabled={isLocked}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </Box>
      </Box>
    </Reorder.Item>
  );
}
