import { Controller, type Control } from 'react-hook-form';

import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { TransactionFormInput } from '@/features/finances/transactions/types';

export function TransactionDescriptionField({
  control,
  isDisabled,
}: {
  control: Control<TransactionFormInput>;
  isDisabled: boolean;
}) {
  return (
    <FieldGroup>
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel htmlFor="form-rhf-description">Description</FieldLabel>
            </FieldContent>
            <Textarea
              {...field}
              id="form-rhf-textarea-description"
              aria-invalid={fieldState.invalid}
              value={field.value ?? ''}
              placeholder="Enter transaction description..."
              rows={3}
              className="resize-none"
              disabled={isDisabled}
            />
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
