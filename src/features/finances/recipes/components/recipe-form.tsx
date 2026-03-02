'use client';

import { useCallback, useMemo, useRef } from 'react';
import {
  useForm,
  useWatch,
  useFieldArray,
  Controller,
  type Resolver,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  type CreateRecipeInput,
  type UpdateRecipeInput,
  type LabourCostType,
  type RoundingMethod,
} from '@/schemas/recipes';
import type {
  RecipeFormInput,
  RecipeWithDetails,
  RecipeItemListItem,
} from '@/features/finances/recipes/types';
import { RecipeItemsList } from '@/features/finances/recipes/components/recipe-items-list';
import { formatCurrency } from '@/lib/utils';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useFormReset } from '@/hooks/use-form-reset';
import { LabourCostTypeSchema } from '@/zod/schemas/enums/LabourCostType.schema';
import { RoundingMethodSchema } from '@/zod/schemas/enums/RoundingMethod.schema';

const LABOUR_COST_TYPE_OPTIONS: { value: LabourCostType; label: string }[] = [
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
  { value: 'PERCENTAGE_OF_RETAIL', label: '% of Retail Price' },
  { value: 'PERCENTAGE_OF_MATERIAL', label: '% of Material Cost' },
];

const ROUNDING_METHOD_OPTIONS: { value: RoundingMethod; label: string }[] = [
  { value: 'NEAREST', label: 'Round to Nearest' },
  { value: 'PSYCHOLOGICAL_99', label: 'Psychological Price (.99)' },
  { value: 'PSYCHOLOGICAL_95', label: 'Psychological Price (.95)' },
];

const defaultFormState: CreateRecipeInput = {
  name: '',
  description: '',
  labourCostType: LabourCostTypeSchema.enum.FIXED_AMOUNT,
  labourAmount: 0,
  roundPrice: false,
  roundingMethod: RoundingMethodSchema.enum.NEAREST,
  totalMaterialsCost: 0,
  labourCost: 0,
  totalCost: 0,
  totalRetailPrice: 0,
  sellingPrice: 0,
  items: [
    {
      priceListItemId: null,
      name: '',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
      retailPrice: 0,
      retailLineTotal: 0,
      order: 0,
    },
  ],
};

const mapRecipeToFormValues = (recipe: RecipeWithDetails): UpdateRecipeInput => {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description ?? '',
    labourCostType: recipe.labourCostType,
    labourAmount: recipe.labourAmount,
    roundPrice: recipe.roundPrice ?? false,
    roundingMethod: recipe.roundingMethod ?? RoundingMethodSchema.enum.NEAREST,
    notes: recipe.notes ?? '',
    totalMaterialsCost: recipe.totalMaterialsCost,
    labourCost: recipe.labourCost,
    totalCost: recipe.totalCost,
    totalRetailPrice: recipe.totalRetailPrice,
    sellingPrice: recipe.sellingPrice,
    items: recipe.items.map((item: RecipeItemListItem, index: number) => ({
      id: item.id,
      priceListItemId: item.priceListItemId ?? null,
      name: item.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      retailPrice: Number(item.retailPrice),
      retailLineTotal: Number(item.retailLineTotal),
      order: item.order ?? index,
    })),
  };
};

export function RecipeForm({
  recipe,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
}: {
  recipe?: RecipeWithDetails | null;
  onCreate?: (data: CreateRecipeInput) => void;
  onUpdate?: (data: UpdateRecipeInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
}) {
  const mode = recipe ? 'update' : 'create';

  const defaultValues: RecipeFormInput =
    mode === 'create'
      ? defaultFormState
      : recipe
        ? mapRecipeToFormValues(recipe)
        : defaultFormState;

  const createResolver: Resolver<RecipeFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateRecipeSchema : UpdateRecipeSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<RecipeFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const [
    watchedItems,
    watchedLabourCostType,
    watchedLabourAmount,
    watchedRoundPrice,
    watchedRoundingMethod,
  ] = useWatch({
    control: form.control,
    name: ['items', 'labourCostType', 'labourAmount', 'roundPrice', 'roundingMethod'],
  });

  const totals = useMemo(() => {
    const items = watchedItems || [];
    const labourCostType = watchedLabourCostType as LabourCostType;
    const labourAmount = Number(watchedLabourAmount) || 0;
    const roundPrice = watchedRoundPrice ?? false;
    const roundingMethod = (watchedRoundingMethod as RoundingMethod) ?? 'NEAREST';

    const totalMaterialsCost = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
    const totalRetailPrice = items.reduce(
      (sum, item) => sum + (Number(item.retailLineTotal) || 0),
      0,
    );

    let labourCost = 0;
    if (labourCostType === 'FIXED_AMOUNT') {
      labourCost = labourAmount;
    } else if (labourCostType === 'PERCENTAGE_OF_MATERIAL') {
      labourCost = totalMaterialsCost * (labourAmount / 100);
    } else if (labourCostType === 'PERCENTAGE_OF_RETAIL') {
      const pct = labourAmount / 100;
      labourCost = pct < 1 ? (totalRetailPrice * pct) / (1 - pct) : 0;
    }

    const totalCost = totalMaterialsCost + labourCost;
    let sellingPrice = totalRetailPrice + labourCost;

    // Apply rounding if enabled
    if (roundPrice && sellingPrice > 0) {
      if (roundingMethod === 'NEAREST') {
        sellingPrice = Math.round(sellingPrice);
      } else if (roundingMethod === 'PSYCHOLOGICAL_99') {
        sellingPrice = Math.ceil(sellingPrice) - 0.01;
      } else if (roundingMethod === 'PSYCHOLOGICAL_95') {
        sellingPrice = Math.ceil(sellingPrice) - 0.05;
      }
    }

    const profit = sellingPrice - totalCost;
    const profitPercentage = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      totalMaterialsCost,
      labourCost,
      totalCost,
      totalRetailPrice,
      sellingPrice,
      profit,
      profitPercentage,
    };
  }, [
    watchedItems,
    watchedLabourCostType,
    watchedLabourAmount,
    watchedRoundPrice,
    watchedRoundingMethod,
  ]);

  const { isDirty } = form.formState;

  useFormReset(
    form,
    recipe?.id,
    useCallback(() => {
      const values = recipe ? mapRecipeToFormValues(recipe) : defaultFormState;
      // Notify parent that form is clean after reset
      onDirtyStateChange?.(false);
      return values;
    }, [recipe, onDirtyStateChange]),
  );

  useUnsavedChanges(isDirty);

  // Track and notify parent of dirty state changes
  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

  const onSubmit: SubmitHandler<RecipeFormInput> = useCallback(
    (data: RecipeFormInput) => {
      // Notify parent that form will be clean after submission
      onDirtyStateChange?.(false);

      const finalData = {
        ...data,
        ...totals,
      };

      if (mode === 'create') {
        onCreate?.(finalData);
      } else {
        const updateData: UpdateRecipeInput = {
          ...finalData,
          id: recipe?.id ?? '',
        };
        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, recipe?.id, totals, onDirtyStateChange],
  );

  const isPending = isCreating || isUpdating;
  const isPercentageType = watchedLabourCostType !== 'FIXED_AMOUNT';

  return (
    <form
      id="form-rhf-recipe"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col h-full"
    >
      <Box className="flex-1 flex overflow-hidden">
        <Box className="flex flex-1 min-h-0">
          {/* Left Column: Form */}
          <Box className="flex-1 p-6 space-y-6 border-r border-border overflow-y-auto">
            {/* Recipe Name */}
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-recipe-name">Recipe Name</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      id="form-rhf-recipe-name"
                      placeholder="e.g., Summer Bridal Bouquet"
                      className="h-11"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Labour Cost Type & Amount */}
            <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FieldGroup>
                <Controller
                  name="labourCostType"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-labour-cost-type">
                          Labour Cost Type
                        </FieldLabel>
                      </FieldContent>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger
                          id="form-rhf-labour-cost-type"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LABOUR_COST_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="labourAmount"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-labour-amount">
                          {isPercentageType ? 'Labour Percentage (%)' : 'Labour Amount ($)'}
                        </FieldLabel>
                      </FieldContent>
                      <Input
                        {...field}
                        id="form-rhf-labour-amount"
                        type="number"
                        step={isPercentageType ? '0.1' : '0.01'}
                        placeholder={isPercentageType ? 'e.g., 25' : 'e.g., 50.00'}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-labour-cost-calculated">
                      Calculated Labour Cost
                    </FieldLabel>
                  </FieldContent>
                  <Input
                    id="form-rhf-labour-cost-calculated"
                    value={formatCurrency({ number: totals.labourCost })}
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </Field>
              </FieldGroup>
            </Box>

            {/* Description */}
            <FieldGroup>
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-recipe-description">Description</FieldLabel>
                    </FieldContent>
                    <Textarea
                      {...field}
                      id="form-rhf-recipe-description"
                      placeholder="Add notes about design style, techniques, or customer preferences..."
                      className="resize-none"
                      rows={2}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Recipe Items */}
            <RecipeItemsList form={form} fieldArray={fieldArray} />
          </Box>

          {/* Right Column: Summary Panel */}
          <Box className="w-[340px] shrink-0 bg-muted/20 overflow-y-auto p-4">
            <Box className="sticky top-0 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Selling Price Header */}
              <Box className="bg-teal-500 text-white p-6 text-center">
                <p className="text-xs uppercase tracking-wider mb-1 text-teal-100">Selling Price</p>
                <p className="text-4xl font-bold">
                  {formatCurrency({ number: totals.sellingPrice })}
                </p>
              </Box>

              {/* Cost Breakdown */}
              <Box className="p-4 space-y-4 bg-white dark:bg-gray-900">
                {/* Costs Section */}
                <Box className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Costs
                  </p>
                  <Box className="space-y-1.5">
                    <Box className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Materials</span>
                      <span>{formatCurrency({ number: totals.totalMaterialsCost })}</span>
                    </Box>
                    <Box className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Labour</span>
                      <span>{formatCurrency({ number: totals.labourCost })}</span>
                    </Box>
                  </Box>
                  <Box className="flex justify-between text-sm font-semibold pt-1 border-t border-border">
                    <span>Total Cost</span>
                    <span>{formatCurrency({ number: totals.totalCost })}</span>
                  </Box>
                </Box>

                {/* Retail Section */}
                <Box className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Retail
                  </p>
                  <Box className="space-y-1.5">
                    <Box className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Materials (marked up)</span>
                      <span>{formatCurrency({ number: totals.totalRetailPrice })}</span>
                    </Box>
                    <Box className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Labour</span>
                      <span>{formatCurrency({ number: totals.labourCost })}</span>
                    </Box>
                  </Box>
                </Box>

                {/* Profit */}
                <Box className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-sm font-semibold text-emerald-600">Profit</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatCurrency({ number: totals.profit })} (
                    {totals.profitPercentage.toFixed(1)}
                    %)
                  </span>
                </Box>
              </Box>
            </Box>

            {/* Pricing Options Panel */}
            <Box className="mt-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Box className="p-4 space-y-4 bg-white dark:bg-gray-900">
                <Box className="flex items-center justify-between">
                  <FieldLabel
                    htmlFor="form-rhf-round-price"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Round Price
                  </FieldLabel>
                  <Controller
                    control={form.control}
                    name="roundPrice"
                    render={({ field }) => (
                      <Switch
                        id="form-rhf-round-price"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </Box>

                {watchedRoundPrice ? (
                  <FieldGroup>
                    <Controller
                      control={form.control}
                      name="roundingMethod"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger
                              id="form-rhf-rounding-method"
                              aria-invalid={fieldState.invalid}
                            >
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROUNDING_METHOD_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                ) : null}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </form>
  );
}
