'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  useForm,
  useWatch,
  useFieldArray,
  Controller,
  type Resolver,
  type SubmitHandler,
  FormProvider,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Printer } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  type CreateRecipeInput,
  type UpdateRecipeInput,
  type LabourCostType,
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

const LABOUR_COST_TYPE_OPTIONS: { value: LabourCostType; label: string }[] = [
  { value: 'FIXED_AMOUNT', label: 'Fixed Amount' },
  { value: 'PERCENTAGE_OF_RETAIL', label: '% of Retail Price' },
  { value: 'PERCENTAGE_OF_MATERIAL', label: '% of Material Cost' },
];

const defaultFormState: CreateRecipeInput = {
  name: '',
  description: '',
  labourCostType: 'FIXED_AMOUNT',
  labourAmount: 0,
  totalMaterialsCost: 0,
  laborCost: 0,
  totalCost: 0,
  totalRetailPrice: 0,
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
    notes: recipe.notes ?? '',
    totalMaterialsCost: recipe.totalMaterialsCost,
    laborCost: recipe.laborCost,
    totalCost: recipe.totalCost,
    totalRetailPrice: recipe.totalRetailPrice,
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

  const [watchedItems, watchedLabourCostType, watchedLabourAmount] = useWatch({
    control: form.control,
    name: ['items', 'labourCostType', 'labourAmount'],
  });

  const totals = useMemo(() => {
    const items = watchedItems || [];
    const labourCostType = watchedLabourCostType as LabourCostType;
    const labourAmount = Number(watchedLabourAmount) || 0;

    const totalMaterialsCost = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
    const totalRetailPrice = items.reduce(
      (sum, item) => sum + (Number(item.retailLineTotal) || 0),
      0,
    );

    let laborCost = 0;
    if (labourCostType === 'FIXED_AMOUNT') {
      laborCost = labourAmount;
    } else if (labourCostType === 'PERCENTAGE_OF_MATERIAL') {
      laborCost = totalMaterialsCost * (labourAmount / 100);
    } else if (labourCostType === 'PERCENTAGE_OF_RETAIL') {
      const pct = labourAmount / 100;
      laborCost = pct < 1 ? (totalRetailPrice * pct) / (1 - pct) : 0;
    }

    const totalCost = totalMaterialsCost + laborCost;
    const sellingPrice = totalRetailPrice + laborCost;
    const profit = sellingPrice - totalCost;
    const profitPercentage = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      totalMaterialsCost,
      laborCost,
      totalCost,
      totalRetailPrice,
      sellingPrice,
      profit,
      profitPercentage,
    };
  }, [watchedItems, watchedLabourCostType, watchedLabourAmount]);

  const { isDirty } = form.formState;

  useEffect(() => {
    onDirtyStateChange?.(isDirty);
  }, [isDirty, onDirtyStateChange]);

  useFormReset(
    form,
    recipe?.id,
    useCallback(() => (recipe ? mapRecipeToFormValues(recipe) : defaultFormState), [recipe]),
  );

  useUnsavedChanges(isDirty);

  const onSubmit: SubmitHandler<RecipeFormInput> = useCallback(
    (data: RecipeFormInput) => {
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
    [mode, onCreate, onUpdate, recipe?.id, totals],
  );

  const isPending = isCreating || isUpdating;
  const isPercentageType = watchedLabourCostType !== 'FIXED_AMOUNT';

  return (
    <FormProvider {...form}>
      <Form {...form}>
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
                <Box className="space-y-2">
                  <Label htmlFor="recipe-name">Recipe Name</Label>
                  <Input
                    {...form.register('name')}
                    id="recipe-name"
                    placeholder="e.g., Summer Bridal Bouquet"
                    className="h-11"
                  />
                  {form.formState.errors.name ? (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  ) : null}
                </Box>

                {/* Labour Cost Type & Amount */}
                <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Box className="space-y-2">
                    <Label htmlFor="labour-cost-type">Labour Cost Type</Label>
                    <Controller
                      control={form.control}
                      name="labourCostType"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="labour-cost-type">
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
                      )}
                    />
                  </Box>

                  <Box className="space-y-2">
                    <Label htmlFor="labour-amount">
                      {isPercentageType ? 'Labour Percentage (%)' : 'Labour Amount ($)'}
                    </Label>
                    <Input
                      type="number"
                      step={isPercentageType ? '0.1' : '0.01'}
                      {...form.register('labourAmount', { valueAsNumber: true })}
                      id="labour-amount"
                      placeholder={isPercentageType ? 'e.g., 25' : 'e.g., 50.00'}
                    />
                  </Box>

                  <Box className="space-y-2">
                    <Label htmlFor="labour-cost-calculated">Calculated Labour Cost</Label>
                    <Input
                      id="labour-cost-calculated"
                      value={formatCurrency({ number: totals.laborCost })}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </Box>
                </Box>

                {/* Description */}
                <Box className="space-y-2">
                  <Label htmlFor="recipe-description">Description</Label>
                  <Textarea
                    {...form.register('description')}
                    id="recipe-description"
                    placeholder="Add notes about design style, techniques, or customer preferences..."
                    className="resize-none"
                    rows={2}
                  />
                </Box>

                {/* Recipe Items */}
                <RecipeItemsList form={form} fieldArray={fieldArray} />
              </Box>

              {/* Right Column: Summary Panel */}
              <Box className="w-[340px] shrink-0 bg-muted/20 overflow-y-auto p-4">
                <Box className="sticky top-0 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Selling Price Header */}
                  <Box className="bg-teal-500 text-white p-6 text-center">
                    <p className="text-xs uppercase tracking-wider mb-1 text-teal-100">
                      Selling Price
                    </p>
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
                          <span>{formatCurrency({ number: totals.laborCost })}</span>
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
                          <span>{formatCurrency({ number: totals.laborCost })}</span>
                        </Box>
                      </Box>
                    </Box>

                    {/* Profit */}
                    <Box className="flex justify-between items-center pt-3 border-t border-border">
                      <span className="text-sm font-semibold text-emerald-600">Profit</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency({ number: totals.profit })} (
                        {totals.profitPercentage.toFixed(1)}%)
                      </span>
                    </Box>

                    {/* Update Button */}
                    <Button
                      type="submit"
                      form="form-rhf-recipe"
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white h-11"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isCreating ? 'Creating...' : 'Updating...'}
                        </>
                      ) : (
                        <>{mode === 'create' ? 'Create' : 'Update'}</>
                      )}
                    </Button>

                    {/* Editing indicator */}
                    {mode === 'update' && recipe?.name ? (
                      <p className="text-xs text-center text-muted-foreground">
                        Editing &quot;{recipe.name}&quot;
                      </p>
                    ) : null}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </form>
      </Form>
    </FormProvider>
  );
}
