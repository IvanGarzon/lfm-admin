'use client';

import type { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { useState } from 'react';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import {
  GripVertical,
  Package,
  Trash2,
  X,
  ImagePlus,
  Palette,
} from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { ActiveProduct } from '@/features/products/types';
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
import { ProductSearchDialog } from '@/components/shared/product-search-dialog';
import type { QuoteFormInput } from '@/features/finances/quotes/types';
import { QuoteItemAttachmentsDialog } from './quote-item-attachments-dialog';
import { QuoteItemColorPaletteDialog } from './quote-item-color-palette-dialog';

type QuoteItemRowProps = {
  index: number;
  field: FieldArrayWithId<QuoteFormInput, 'items', 'id'>;
  form: UseFormReturn<QuoteFormInput>;
  products: ActiveProduct[] | undefined;
  isLoadingProducts: boolean;
  canRemove: boolean;
  onRemove: () => void;
  isLocked?: boolean;
  quoteId?: string;
  itemId?: string;
};

export function QuoteItemRow({
  index,
  field,
  form,
  products,
  isLoadingProducts,
  canRemove,
  onRemove,
  isLocked,
  quoteId,
  itemId,
}: QuoteItemRowProps) {
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  const [isDragging, setIsDragging] = useState(false);
  const [attachmentsDialogOpen, setAttachmentsDialogOpen] = useState(false);
  const [colorPaletteDialogOpen, setColorPaletteDialogOpen] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const handleProductSelect = (productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (!product) {
      return;
    }
  
    const current = form.getValues(`items.${index}`);
  
    form.setValue(
      `items.${index}`,
      {
        ...current,
        productId,
        description: product.name ?? '',
        unitPrice: Number(product.price),
      },
      {
        shouldValidate: true,
        shouldDirty: true,
      }
    );
  
    setProductSearchOpen(false);
  };

  const handleClearProduct = () => {
    form.setValue(`items.${index}`, {
      ...form.getValues(`items.${index}`),
      productId: null,
      description: '',
      unitPrice: 0,
    }, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const selectedProductId = form.watch(`items.${index}.productId`);
  const quantity = form.watch(`items.${index}.quantity`) || 0;
  const unitPrice = form.watch(`items.${index}.unitPrice`) || 0;
  const total = quantity * unitPrice;

  // Get error states
  const descriptionError = form.formState.errors.items?.[index]?.description;
  const quantityError = form.formState.errors.items?.[index]?.quantity;
  const unitPriceError = form.formState.errors.items?.[index]?.unitPrice;

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
        <Box
          className="w-4 shrink-0 flex items-center justify-center"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
        </Box>

        {/* Item Description with Product Selector */}
        <Box className="flex-1 min-w-0">
          <FormField
            control={form.control}
            name={`items.${index}.description`}
            render={({ field }) => (
              <FormItem className="space-y-0 mb-0">
                <FormControl>
                  <InputGroup
                    className={cn(
                      descriptionError && 'border-destructive focus-within:ring-destructive/20',
                    )}
                  >
                    <InputGroupInput {...field} placeholder="Enter item name" disabled={isLocked} />
                    <InputGroupAddon align="inline-end">
                      {selectedProductId ? (
                        <InputGroupButton
                          type="button"
                          onClick={handleClearProduct}
                          aria-label="Clear product"
                          title="Clear product selection"
                          size="icon-xs"
                          className="cursor-pointer hover:text-destructive"
                          disabled={isLocked}
                        >
                          <X />
                        </InputGroupButton>
                      ) : (
                        products &&
                        products.length > 0 ? (
                          <InputGroupButton
                            type="button"
                            onClick={() => setProductSearchOpen(true)}
                            aria-label="Browse products"
                            title="Browse products"
                            size="icon-xs"
                            className="cursor-pointer hover:text-primary"
                            disabled={isLocked}
                          >
                            <Package />
                          </InputGroupButton>
                        ) : null
                      )}
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </Box>

        {/* Quantity */}
        <Box className="w-18 shrink-0">
          <FormField
            control={form.control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <FormItem className="space-y-0 mb-0">
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="1"
                    min="1"
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    className={cn(
                      'text-left border-gray-200 dark:border-gray-700 h-9 py-0',
                      quantityError && 'border-destructive focus:ring-destructive/20',
                    )}
                    disabled={isLocked}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </Box>

        {/* Unit Price */}
        <Box className="w-30 shrink-0">
          <FormField
            control={form.control}
            name={`items.${index}.unitPrice`}
            render={({ field }) => (
              <FormItem className="space-y-0 mb-0">
                <FormControl>
                  <InputGroup
                    className={cn(
                      unitPriceError && 'border-destructive focus-within:ring-destructive/20',
                    )}
                  >
                    <InputGroupInput
                      {...field}
                      type="number"
                      step="0.5"
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      min="0"
                      className="text-left"
                      disabled={isLocked}
                    />                    
                  </InputGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </Box>

        {/* Total */}
        <Box className="w-30 shrink-0">
          <Box className="h-9 px-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 w-full flex items-center justify-end">
            {formatCurrency({
              number: total,
              maxFractionDigits: 0,
            })}
          </Box>
        </Box>

        {/* Color Palette Button */}
        <Box className="w-4 shrink-0 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setColorPaletteDialogOpen(true)}
            className={cn(
              'h-8 w-8 p-0',
              quoteId && itemId
                ? 'text-gray-400 hover:text-purple-500 hover:bg-transparent cursor-pointer'
                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed',
            )}
            title={quoteId && itemId ? 'Edit color palette' : 'Save the quote first to add colors'}
            disabled={isLocked || !quoteId || !itemId}
          >
            <Palette className="h-4 w-4" />
          </Button>
        </Box>

        {/* Attach Images Button */}
        <Box className="w-4 shrink-0 flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setAttachmentsDialogOpen(true)}
            className={cn(
              'h-8 w-8 p-0',
              quoteId && itemId
                ? 'text-gray-400 hover:text-blue-500 hover:bg-transparent cursor-pointer'
                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed',
            )}
            title={quoteId && itemId ? 'Attach images' : 'Save the quote first to attach images'}
            disabled={isLocked || !quoteId || !itemId}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
        </Box>

        {/* Delete Button */}
        <Box className="w-4 shrink-0 flex items-center justify-center">
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-transparent cursor-pointer"
              disabled={isLocked}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </Box>
      </Box>

      {/* Product Search Modal */}
      <ProductSearchDialog
        open={productSearchOpen}
        onOpenChange={setProductSearchOpen}
        products={products || []}
        isLoadingProducts={isLoadingProducts}
        selectedProductId={selectedProductId}
        onProductSelect={handleProductSelect}
      />

      {/* Color Palette Dialog */}
      {quoteId && itemId ? (
        <QuoteItemColorPaletteDialog
          open={colorPaletteDialogOpen}
          onOpenChange={setColorPaletteDialogOpen}
          quoteId={quoteId}
          quoteItemId={itemId}
          itemDescription={form.watch(`items.${index}.description`) || 'Untitled Item'}
          initialColors={field.colors || []}
        />
      ) : null}

      {/* Item Attachments Dialog */}
      {quoteId && itemId ? (
        <QuoteItemAttachmentsDialog
          open={attachmentsDialogOpen}
          onOpenChange={setAttachmentsDialogOpen}
          quoteId={quoteId}
          quoteItemId={itemId}
          itemDescription={form.watch(`items.${index}.description`) || 'Untitled Item'}
        />
      ) : null}
    </Reorder.Item>
  );
}
