'use client';

import { useState, useCallback, useMemo } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Layers } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { createRecipeGroupSchema, type CreateRecipeGroupInput } from '@/schemas/recipe-groups';
import { RecipeSearchDialog } from './recipe-search-dialog';
import type { RecipeListItem } from '@/features/finances/recipes/types';

// Extended form type that includes recipe data for display
type RecipeGroupFormItem = {
  recipeId: string;
  quantity: number;
  order: number;
  recipe: RecipeListItem; // Extra field for display only
};

type RecipeGroupFormInput = {
  name: string;
  description?: string | null;
  items: RecipeGroupFormItem[];
};

interface CreateRecipeGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateRecipeGroupInput) => void;
  isCreating: boolean;
}

export function CreateRecipeGroupDialog({
  open,
  onOpenChange,
  onCreate,
  isCreating,
}: CreateRecipeGroupDialogProps) {
  const [recipeSearchOpen, setRecipeSearchOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<RecipeGroupFormInput>({
    resolver: zodResolver(createRecipeGroupSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      items: [],
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');
  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const recipe = item.recipe;
      if (!recipe) return sum;
      return sum + (recipe.sellingPrice || 0) * item.quantity;
    }, 0);
  }, [items]);

  const handleAddRecipe = useCallback(() => {
    setEditingIndex(null);
    setRecipeSearchOpen(true);
  }, []);

  const handleSelectRecipe = useCallback(
    (recipe: RecipeListItem) => {
      if (editingIndex !== null) {
        // Update existing item
        const current = fieldArray.fields[editingIndex];
        fieldArray.update(editingIndex, {
          recipeId: recipe.id,
          quantity: current.quantity,
          order: current.order,
          recipe: recipe,
        });
      } else {
        // Add new item
        fieldArray.append({
          recipeId: recipe.id,
          quantity: 1,
          order: fieldArray.fields.length,
          recipe: recipe,
        });
      }
      setRecipeSearchOpen(false);
      setEditingIndex(null);
    },
    [editingIndex, fieldArray],
  );

  const handleSubmit = useCallback(
    (data: RecipeGroupFormInput) => {
      // Clean up the data - remove the recipe object, keep only required fields
      const cleanedData: CreateRecipeGroupInput = {
        name: data.name,
        description: data.description,
        items: data.items.map((item) => ({
          recipeId: item.recipeId,
          quantity: item.quantity,
          order: item.order,
        })),
      };
      onCreate(cleanedData);
    },
    [onCreate],
  );

  const handleClose = useCallback(() => {
    form.reset();
    onOpenChange(false);
  }, [form, onOpenChange]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create Recipe Group</DialogTitle>
            <DialogDescription>
              Bundle multiple recipes together for quick quoting. Select recipes and set quantities.
            </DialogDescription>
          </DialogHeader>

          <form
            id="form-rhf-recipe-group"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <Box className="space-y-4">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-group-name">Group Name</FieldLabel>
                      </FieldContent>
                      <Input
                        {...field}
                        id="form-rhf-group-name"
                        placeholder="e.g., Wedding Package Standard"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-group-description">
                          Description (Optional)
                        </FieldLabel>
                      </FieldContent>
                      <Textarea
                        {...field}
                        id="form-rhf-group-description"
                        value={field.value ?? ''}
                        placeholder="Describe what's included in this group..."
                        rows={2}
                        className="resize-none"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>
            </Box>

            <Box className="space-y-3">
              <Box className="flex items-center justify-between">
                <FieldLabel>Recipes in Group</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRecipe}
                  className="h-8"
                >
                  <Plus aria-hidden="true" className="h-4 w-4 mr-1" />
                  Add Recipe
                </Button>
              </Box>

              {form.formState.errors.items?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
              ) : null}

              {fieldArray.fields.length === 0 ? (
                <Box className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <Layers aria-hidden="true" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recipes added yet</p>
                  <p className="text-xs mt-1">Click "Add Recipe" to get started</p>
                </Box>
              ) : (
                <Box className="border rounded-lg divide-y">
                  {fieldArray.fields.map((field, index) => {
                    const recipe = field.recipe;
                    if (!recipe) return null;

                    return (
                      <Box key={field.id} className="flex items-center gap-3 p-3">
                        <Box className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{recipe.name}</p>
                          {recipe.description ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {recipe.description}
                            </p>
                          ) : null}
                        </Box>

                        <Box className="flex items-center gap-2">
                          <Controller
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                step="1"
                                className="w-20 h-9"
                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              />
                            )}
                          />

                          <Box className="w-24 text-right text-sm font-medium">
                            {formatCurrency({
                              number: (recipe.sellingPrice || 0) * (field.quantity || 1),
                            })}
                          </Box>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove recipe"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => fieldArray.remove(index)}
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}

                  <Box className="p-3 bg-muted/50">
                    <Box className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Group Value</span>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency({ number: totalCost })}
                      </span>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || fieldArray.fields.length === 0}>
                {isCreating ? 'Creating...' : 'Create Group'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <RecipeSearchDialog
        open={recipeSearchOpen}
        onOpenChange={setRecipeSearchOpen}
        onSelect={handleSelectRecipe}
      />
    </>
  );
}
