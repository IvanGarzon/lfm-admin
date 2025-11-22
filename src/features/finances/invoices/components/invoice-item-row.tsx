'use client';

import type { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { useState } from 'react';
import { Reorder, useDragControls, useMotionValue } from 'framer-motion';
import { GripVertical, Package, Trash2, Check, Loader2, X, Lock, Unlock } from 'lucide-react';

import { cn, formatters, formatCurrency } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';

type InvoiceItemRowProps = {
  index: number;
  field: FieldArrayWithId<InvoiceFormInput, 'items', 'id'>;
  form: UseFormReturn<InvoiceFormInput>;
  products: ActiveProduct[] | undefined;
  isLoadingProducts: boolean;
  canRemove: boolean;
  onRemove: () => void;
  productSearchOpen: boolean;
  onProductSearchOpenChange: (open: boolean) => void;
  productSearchQuery: string;
  onProductSearchQueryChange: (query: string) => void;
  filteredProducts: ActiveProduct[];
  onProductSelect: (index: number, productId: string) => void;
  onClearProduct: (index: number) => void;
  isLocked?: boolean;
};

export function InvoiceItemRow({
  index,
  field,
  form,
  products,
  isLoadingProducts,
  canRemove,
  onRemove,
  productSearchOpen,
  onProductSearchOpenChange,
  productSearchQuery,
  onProductSearchQueryChange,
  filteredProducts,
  onProductSelect,
  onClearProduct,
  isLocked,
}: InvoiceItemRowProps) {
  const y = useMotionValue(0);
  const dragControls = useDragControls();

  const [isPriceLocked, setIsPriceLocked] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

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
          'flex items-center gap-3 px-4 py-3 transition-colors',
          isDragging
            ? 'bg-gray-100 dark:bg-gray-800 shadow-lg cursor-grabbing'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        )}
      >
        <Box
          className="w-10 shrink-0 flex items-center justify-center"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab active:cursor-grabbing" />
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
                    <InputGroupInput
                      {...field}
                      placeholder="Enter item name"
                      disabled={!!selectedProductId || isLocked}
                    />
                    <InputGroupAddon align="inline-end">
                      {selectedProductId ? (
                        <InputGroupButton
                          type="button"
                          onClick={() => {
                            setIsPriceLocked(true);
                            onClearProduct(index);
                          }}
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
                        products.length > 0 && (
                          <InputGroupButton
                            type="button"
                            onClick={() => onProductSearchOpenChange(true)}
                            aria-label="Browse products"
                            title="Browse products"
                            size="icon-xs"
                            className="cursor-pointer hover:text-primary"
                            disabled={isLocked}
                          >
                            <Package />
                          </InputGroupButton>
                        )
                      )}
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
        <Box className="w-32 shrink-0">
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
                      disabled={(!!selectedProductId && isPriceLocked) || isLocked}
                    />
                    {selectedProductId ? (
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          onClick={() => setIsPriceLocked(!isPriceLocked)}
                          aria-label={isPriceLocked ? 'Unlock price' : 'Lock price'}
                          title={isPriceLocked ? 'Unlock to edit price' : 'Lock price'}
                          size="icon-xs"
                          className="cursor-pointer"
                          disabled={isLocked}
                        >
                          {isPriceLocked ? <Lock /> : <Unlock />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    ) : null}
                  </InputGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </Box>

        {/* Total */}
        <Box className="w-24 shrink-0">
          <Box className="h-9 px-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 w-full flex items-center">
            {formatCurrency({
              number: total,
              maxFractionDigits: 0,
            })}
          </Box>
        </Box>

        {/* Delete Button */}
        <Box className="w-10 shrink-0 flex items-center justify-center">
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              onClick={onRemove}
              className="h-9 w-9 p-0 text-gray-400 hover:text-destructive hover:bg-transparent cursor-pointer"
              disabled={isLocked}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </Box>
      </Box>

      {/* Product Search Modal */}
      <Dialog
        open={productSearchOpen}
        onOpenChange={(open) => {
          onProductSearchOpenChange(open);
          if (!open) {
            onProductSearchQueryChange('');
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Product</DialogTitle>
            <DialogDescription>Search and select a product to add to the invoice</DialogDescription>
          </DialogHeader>

          {isLoadingProducts ? (
            <Box className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p>Loading products...</p>
            </Box>
          ) : null}

          {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            <Box className="flex-1 flex flex-col gap-4 overflow-hidden">
              <Box className="relative">
                <Input
                  type="search"
                  inputSize="lg"
                  placeholder="Search products by name..."
                  value={productSearchQuery}
                  onChange={(e) => onProductSearchQueryChange(e.target.value)}
                  autoFocus
                  className="focus-visible:ring-primary/20 focus-visible:border-primary"
                />
              </Box>
              <Box className="flex-1 border rounded-lg overflow-hidden flex flex-col">
                <Box className="flex-1 overflow-y-auto">
                  <Box className="divide-y dark:divide-gray-800">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => product.id && onProductSelect(index, product.id)}
                        className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
                      >
                        <Box className="shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </Box>
                        <Box className="flex-1 min-w-0">
                          <Box className="font-medium">{product.name}</Box>
                          {product.description ? (
                            <Box className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </Box>
                          ) : null}
                          <Box className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency({
                              number: product.price,
                            })}
                          </Box>
                        </Box>
                        {selectedProductId === product.id && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : !isLoadingProducts ? (
            <Box className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
              <Package className="h-8 w-8 mb-2" />
              <p>No products found</p>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Reorder.Item>
  );
}
