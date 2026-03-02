'use client';

import { useCallback, useRef } from 'react';
import { Controller, useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { useFormReset } from '@/hooks/use-form-reset';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreateProductSchema,
  UpdateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from '@/schemas/products';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { ProductWithDetails, ProductFormInput } from '@/features/inventory/products/types';

const defaultFormState: CreateProductInput = {
  name: '',
  description: null,
  status: 'ACTIVE',
  price: 0,
  stock: 0,
  imageUrl: null,
  availableAt: null,
};

function mapProductToFormValues(product: ProductWithDetails): UpdateProductInput {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    status: product.status,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl,
    availableAt: product.availableAt,
  };
}

export function ProductForm({
  product,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  product?: ProductWithDetails | null;
  onCreate?: (data: CreateProductInput) => void;
  onUpdate?: (data: UpdateProductInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const mode = product ? 'edit' : 'create';

  const defaultValues: ProductFormInput =
    mode === 'create'
      ? defaultFormState
      : product
        ? mapProductToFormValues(product)
        : defaultFormState;

  const createResolver: Resolver<ProductFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateProductSchema : UpdateProductSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<ProductFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  // Reset form when switching between products
  useFormReset(
    form,
    product?.id,
    useCallback(() => {
      const values = product ? mapProductToFormValues(product) : defaultFormState;
      // Notify parent that form is clean after reset
      onDirtyStateChange?.(false);
      return values;
    }, [product, onDirtyStateChange]),
  );

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  // Track and notify parent of dirty state changes
  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

  const onSubmit: SubmitHandler<ProductFormInput> = useCallback(
    (data: ProductFormInput) => {
      // Notify parent that form will be clean after submission
      onDirtyStateChange?.(false);

      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdateProductInput = {
          ...data,
          id: product?.id ?? '',
        };

        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, product?.id, onDirtyStateChange],
  );

  const isSubmitting = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form
        id="form-rhf-product"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating product...' : 'Updating product...'}
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Name */}
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-product-name">Product Name *</FieldLabel>
                  </FieldContent>
                  <Input
                    id="form-rhf-product-name"
                    {...field}
                    placeholder="Enter product name"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Description */}
          <FieldGroup>
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-product-description">Description</FieldLabel>
                  </FieldContent>
                  <Textarea
                    id="form-rhf-product-description"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Enter product description"
                    disabled={isSubmitting}
                    rows={3}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Status */}
          <FieldGroup>
            <Controller
              name="status"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-product-status">Status</FieldLabel>
                  </FieldContent>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="form-rhf-product-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Price and Stock (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Price */}
            <FieldGroup>
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-product-price">Price *</FieldLabel>
                    </FieldContent>
                    <Input
                      id="form-rhf-product-price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Stock */}
            <FieldGroup>
              <Controller
                name="stock"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-product-stock">Stock *</FieldLabel>
                    </FieldContent>
                    <Input
                      id="form-rhf-product-stock"
                      type="number"
                      step="1"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          {/* Image URL */}
          <FieldGroup>
            <Controller
              name="imageUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-product-imageUrl">Image URL</FieldLabel>
                  </FieldContent>
                  <Input
                    id="form-rhf-product-imageUrl"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="https://example.com/image.jpg"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>
        </Box>

        {/* Action Buttons */}
        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Product'
            ) : (
              'Update Product'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}
