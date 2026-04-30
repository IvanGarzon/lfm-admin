import { Controller, type Control } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import type { TransactionFormInput } from '@/features/finances/transactions/types';
import { CategoryMultiSelect, type Category } from '../category-multi-select';

export function TransactionCategoryField({
  control,
  isDisabled,
  categories,
  isLoadingCategories,
  onCategoryCreated,
}: {
  control: Control<TransactionFormInput>;
  isDisabled: boolean;
  categories: Category[];
  isLoadingCategories: boolean;
  onCategoryCreated: (newCategory: Category) => void;
}) {
  return (
    <FieldGroup>
      <Controller
        name="categoryIds"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel>Categories</FieldLabel>
            </FieldContent>
            {isLoadingCategories ? (
              <Box className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
              </Box>
            ) : (
              <CategoryMultiSelect
                categories={categories}
                selectedIds={field.value || []}
                onChange={field.onChange}
                onCategoryCreated={onCategoryCreated}
                disabled={isDisabled}
              />
            )}
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
