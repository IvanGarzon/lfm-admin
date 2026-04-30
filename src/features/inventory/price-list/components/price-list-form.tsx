'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Controller, useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { useFormReset } from '@/hooks/use-form-reset';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  CreatePriceListItemSchema,
  UpdatePriceListItemSchema,
  type CreatePriceListItemInput,
  type UpdatePriceListItemInput,
} from '@/schemas/price-list';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import {
  PRICE_LIST_CATEGORIES,
  PRICE_LIST_CATEGORY_LABELS,
} from '@/features/inventory/price-list/constants/categories';
import {
  PRICE_LIST_UNIT_TYPES,
  PRICE_LIST_UNIT_TYPE_LABELS,
} from '@/features/inventory/price-list/constants/unit-types';
import {
  PRICE_LIST_SEASONS,
  PRICE_LIST_SEASON_LABELS,
} from '@/features/inventory/price-list/constants/seasons';
import type {
  PriceListItemWithDetails,
  PriceListItemFormInput,
} from '@/features/inventory/price-list/types';

const defaultFormState: CreatePriceListItemInput = {
  name: '',
  description: null,
  category: 'FLORAL',
  imageUrl: null,
  wholesalePrice: null,
  costPerUnit: 0,
  multiplier: 3,
  retailPriceOverride: null,
  unitType: null,
  bunchSize: null,
  season: null,
};

function mapItemToFormValues(item: PriceListItemWithDetails): UpdatePriceListItemInput {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category as CreatePriceListItemInput['category'],
    imageUrl: item.imageUrl,
    wholesalePrice: item.wholesalePrice,
    costPerUnit: item.costPerUnit,
    multiplier: item.multiplier,
    retailPriceOverride: item.retailPriceOverride,
    unitType: item.unitType as CreatePriceListItemInput['unitType'],
    bunchSize: item.bunchSize,
    season: item.season as CreatePriceListItemInput['season'],
  };
}

export function PriceListForm({
  item,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  item?: PriceListItemWithDetails | null;
  onCreate?: (data: CreatePriceListItemInput) => void;
  onUpdate?: (data: UpdatePriceListItemInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const mode = item ? 'edit' : 'create';

  const initialAdvancedOpen = useMemo(() => {
    if (item) {
      return !!(item.unitType || item.bunchSize || item.season || item.retailPriceOverride);
    }
    return false;
  }, [item]);

  const [advancedOpen, setAdvancedOpen] = useState(initialAdvancedOpen);

  const defaultValues: PriceListItemFormInput =
    mode === 'create' ? defaultFormState : item ? mapItemToFormValues(item) : defaultFormState;

  const createResolver: Resolver<PriceListItemFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreatePriceListItemSchema : UpdatePriceListItemSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<PriceListItemFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  useFormReset(
    form,
    item?.id,
    useCallback(() => {
      const values = item ? mapItemToFormValues(item) : defaultFormState;
      onDirtyStateChange?.(false);

      return values;
    }, [item, onDirtyStateChange]),
  );

  useUnsavedChanges(form.formState.isDirty);

  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

  const onSubmit: SubmitHandler<PriceListItemFormInput> = useCallback(
    (data: PriceListItemFormInput) => {
      onDirtyStateChange?.(false);

      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdatePriceListItemInput = {
          ...data,
          id: item?.id ?? '',
        };
        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, item?.id, onDirtyStateChange],
  );

  const isSubmitting = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form
        id="form-rhf-price-list-item"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating item...' : 'Updating item...'}
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
                    <FieldLabel htmlFor="form-rhf-price-list-name">Name *</FieldLabel>
                  </FieldContent>
                  <Input
                    id="form-rhf-price-list-name"
                    {...field}
                    placeholder="Enter item name"
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
                    <FieldLabel htmlFor="form-rhf-price-list-description">Description</FieldLabel>
                  </FieldContent>
                  <Textarea
                    id="form-rhf-price-list-description"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Optional description"
                    disabled={isSubmitting}
                    rows={3}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <Box className="grid grid-cols-2 gap-4">
            {/* Category */}
            <FieldGroup>
              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-price-list-category">Category *</FieldLabel>
                    </FieldContent>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="form-rhf-price-list-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRICE_LIST_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {PRICE_LIST_CATEGORY_LABELS[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Wholesale Price */}
            <FieldGroup>
              <Controller
                name="wholesalePrice"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-price-list-wholesalePrice">
                        Wholesale Price
                      </FieldLabel>
                    </FieldContent>
                    <Input
                      id="form-rhf-price-list-wholesalePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val ? parseFloat(val) : null);
                      }}
                      disabled={isSubmitting}
                      placeholder="Price paid to supplier"
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Unit Cost */}
            <FieldGroup>
              <Controller
                name="costPerUnit"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-price-list-costPerUnit">Unit Cost *</FieldLabel>
                    </FieldContent>
                    <Input
                      id="form-rhf-price-list-costPerUnit"
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

            {/* Multiplier */}
            <FieldGroup>
              <Controller
                name="multiplier"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-price-list-multiplier">Multiplier *</FieldLabel>
                    </FieldContent>
                    <Input
                      id="form-rhf-price-list-multiplier"
                      type="number"
                      step="0.1"
                      min="0.1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 3)}
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          {/* Advanced Settings */}
          <Box className="rounded-lg border bg-muted/50">
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start gap-2 px-4 py-3 h-auto rounded-b-none hover:bg-muted/80"
                >
                  {advancedOpen ? (
                    <ChevronUp aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <ChevronDown aria-hidden="true" className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">Advanced Settings</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 pt-2 space-y-4">
                <Box className="grid grid-cols-2 gap-4">
                  {/* Unit Type */}
                  <FieldGroup>
                    <Controller
                      name="unitType"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldContent>
                            <FieldLabel htmlFor="form-rhf-price-list-unitType">
                              Unit Type
                            </FieldLabel>
                          </FieldContent>
                          <Select
                            value={field.value ?? ''}
                            onValueChange={(value) => field.onChange(value || null)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger id="form-rhf-price-list-unitType">
                              <SelectValue placeholder="Select unit type" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICE_LIST_UNIT_TYPES.map((ut) => (
                                <SelectItem key={ut} value={ut}>
                                  {PRICE_LIST_UNIT_TYPE_LABELS[ut]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  {/* Bunch Size */}
                  <FieldGroup>
                    <Controller
                      name="bunchSize"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldContent>
                            <FieldLabel htmlFor="form-rhf-price-list-bunchSize">
                              Bunch Size (stems per bunch)
                            </FieldLabel>
                          </FieldContent>
                          <Input
                            id="form-rhf-price-list-bunchSize"
                            type="number"
                            step="1"
                            min="1"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val ? parseInt(val) : null);
                            }}
                            disabled={isSubmitting}
                          />
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  {/* Season */}
                  <FieldGroup>
                    <Controller
                      name="season"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldContent>
                            <FieldLabel htmlFor="form-rhf-price-list-season">Season</FieldLabel>
                          </FieldContent>
                          <Select
                            value={field.value ?? ''}
                            onValueChange={(value) => field.onChange(value || null)}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger id="form-rhf-price-list-season">
                              <SelectValue placeholder="Select season" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRICE_LIST_SEASONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {PRICE_LIST_SEASON_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  {/* Retail Price Override */}
                  <FieldGroup>
                    <Controller
                      name="retailPriceOverride"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldContent>
                            <FieldLabel htmlFor="form-rhf-price-list-retailPriceOverride">
                              Retail Price Override
                            </FieldLabel>
                          </FieldContent>
                          <Input
                            id="form-rhf-price-list-retailPriceOverride"
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val ? parseFloat(val) : null);
                            }}
                            disabled={isSubmitting}
                            placeholder="Leave empty to use calculated price"
                          />
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </Box>
              </CollapsibleContent>
            </Collapsible>
          </Box>

          {/* Image URL */}
          <FieldGroup>
            <Controller
              name="imageUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-price-list-imageUrl">Image URL</FieldLabel>
                  </FieldContent>
                  <Input
                    id="form-rhf-price-list-imageUrl"
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
        <Box className="border-t p-6 flex gap-3 justify-end bg-muted">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Item'
            ) : (
              'Update Item'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}
