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
import { Loader2 } from 'lucide-react';

import { Box } from '@/components/ui/box';
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

    return {
      totalMaterialsCost,
      laborCost,
      totalCost,
      totalRetailPrice,
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
          {isPending && (
            <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                {isCreating ? 'Creating recipe...' : 'Updating recipe...'}
              </span>
            </Box>
          )}

          <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Two Column Layout: Form Fields + Summary */}
            <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Form Inputs */}
              <Box className="lg:col-span-2 space-y-4">
                {/* Recipe Name */}
                <Box className="space-y-2">
                  <Label htmlFor="recipe-name">Recipe Name</Label>
                  <Input
                    {...form.register('name')}
                    id="recipe-name"
                    placeholder="e.g., Summer Bridal Bouquet"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </Box>

                {/* Labour Cost Type & Amount */}
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </Box>

              {/* Right Column: Summary Panel */}
              <Box className="lg:col-span-1">
                <Box className="sticky top-6 p-4 border border-border rounded-lg bg-muted/30 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Cost Summary
                  </h3>

                  <Box className="space-y-3">
                    <Box className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Materials Cost</span>
                      <span className="font-medium">
                        {formatCurrency({ number: totals.totalMaterialsCost })}
                      </span>
                    </Box>

                    <Box className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Labour Cost</span>
                      <span className="font-medium">
                        {formatCurrency({ number: totals.laborCost })}
                      </span>
                    </Box>

                    <Box className="border-t border-border pt-3">
                      <Box className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Cost</span>
                        <span className="font-bold text-primary">
                          {formatCurrency({ number: totals.totalCost })}
                        </span>
                      </Box>
                    </Box>

                    <Box className="border-t border-border pt-3">
                      <Box className="flex justify-between items-center">
                        <span className="text-sm font-medium">Retail Price</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency({ number: totals.totalRetailPrice })}
                        </span>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Recipe Items */}
            <RecipeItemsList form={form} fieldArray={fieldArray} />
          </Box>
        </form>
      </Form>
    </FormProvider>
  );
}
