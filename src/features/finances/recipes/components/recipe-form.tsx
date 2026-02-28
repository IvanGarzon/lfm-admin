'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useWatch, type Resolver, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import {
  CreateRecipeSchema,
  UpdateRecipeSchema,
  type CreateRecipeInput,
  type UpdateRecipeInput,
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

const defaultFormState: CreateRecipeInput = {
  name: '',
  description: '',
  laborRate: 25,
  targetMargin: 30,
  totalMaterialsCost: 0,
  laborCost: 0,
  totalProductionCost: 0,
  sellingPrice: 0,
  profitValue: 0,
  profitPercentage: 0,
  items: [
    {
      description: '',
      type: 'FLORAL',
      purchaseUnit: 'Stem',
      purchaseUnitQuantity: 1,
      purchaseCost: 0,
      unitCost: 0,
      quantityUsed: 1,
      subtotal: 0,
      order: 0,
    },
  ],
};

const mapRecipeToFormValues = (recipe: RecipeWithDetails): UpdateRecipeInput => {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description ?? '',
    laborRate: Number(recipe.laborRate),
    targetMargin: Number(recipe.targetMargin),
    notes: recipe.notes ?? '',
    totalMaterialsCost: recipe.totalMaterialsCost,
    laborCost: recipe.laborCost,
    totalProductionCost: recipe.totalProductionCost,
    sellingPrice: recipe.sellingPrice,
    profitValue: recipe.profitValue,
    profitPercentage: recipe.profitPercentage,
    items: recipe.items.map((item: RecipeItemListItem, index: number) => ({
      id: item.id,
      description: item.description,
      type: item.type,
      purchaseUnit: item.purchaseUnit,
      purchaseUnitQuantity: Number(item.purchaseUnitQuantity),
      purchaseCost: Number(item.purchaseCost),
      unitCost: Number(item.unitCost),
      quantityUsed: Number(item.quantityUsed),
      subtotal: Number(item.subtotal),
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

  const [watchedItems, watchedLaborRate, watchedTargetMargin] = useWatch({
    control: form.control,
    name: ['items', 'laborRate', 'targetMargin'],
  });

  const totals = useMemo(() => {
    const items = watchedItems || [];
    const laborRate = Number(watchedLaborRate) || 0;
    const targetMargin = Number(watchedTargetMargin) || 0;

    const totalMaterialsCost = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const laborCost = totalMaterialsCost * (laborRate / 100);
    const totalProductionCost = totalMaterialsCost + laborCost;

    const marginMultiplier = 1 - targetMargin / 100;
    const sellingPrice =
      marginMultiplier > 0 ? totalProductionCost / marginMultiplier : totalProductionCost;

    const profitValue = sellingPrice - totalProductionCost;
    const profitPercentage = sellingPrice > 0 ? (profitValue / sellingPrice) * 100 : 0;

    return {
      totalMaterialsCost,
      laborCost,
      totalProductionCost,
      sellingPrice,
      profitValue,
      profitPercentage,
    };
  }, [watchedItems, watchedLaborRate, watchedTargetMargin]);

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
            {/* Row 1: Name, Labor Rate, Target Margin */}
            <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Box className="sm:col-span-2 space-y-2">
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

              <Box className="space-y-2">
                <Label htmlFor="labor-rate">Labor Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...form.register('laborRate', { valueAsNumber: true })}
                  id="labor-rate"
                />
              </Box>

              <Box className="space-y-2">
                <Label htmlFor="target-margin">Target Margin (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...form.register('targetMargin', { valueAsNumber: true })}
                  id="target-margin"
                />
              </Box>
            </Box>

            {/* Row 2: Description */}
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
            <RecipeItemsList />
          </Box>

          {/* Footer - Summary & Actions */}
          <Box className="border-t p-4 bg-muted/30">
            <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Summary Stats */}
              <Box className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-sm">
                <Box>
                  <p className="text-muted-foreground text-xs">Total Cost</p>
                  <p className="font-semibold">
                    {formatCurrency({ number: totals.totalProductionCost })}
                  </p>
                </Box>
                <Box>
                  <p className="text-muted-foreground text-xs">Target Price</p>
                  <p className="font-bold text-primary">
                    {formatCurrency({ number: totals.sellingPrice })}
                  </p>
                </Box>
                <Box>
                  <p className="text-muted-foreground text-xs">Est. Profit</p>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency({ number: totals.profitValue })}
                  </p>
                </Box>
                <Box>
                  <p className="text-muted-foreground text-xs">Margin</p>
                  <p className="font-semibold text-emerald-600">
                    {totals.profitPercentage.toFixed(1)}%
                  </p>
                </Box>
              </Box>
            </Box>
          </Box>
        </form>
      </Form>
    </FormProvider>
  );
}
