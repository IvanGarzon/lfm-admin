import { Controller, type Control } from 'react-hook-form';

import { Textarea } from '@/components/ui/textarea';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import type { QuoteFormInput } from '@/features/finances/quotes/types';

interface QuoteNotesFieldsProps {
  control: Control<QuoteFormInput>;
  isLocked: boolean;
}

export function QuoteNotesFields({ control, isLocked }: QuoteNotesFieldsProps) {
  return (
    <>
      <FieldGroup>
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-notes">Notes</FieldLabel>
              </FieldContent>
              <Textarea
                {...field}
                id="form-rhf-textarea-notes"
                aria-invalid={fieldState.invalid}
                value={field.value ?? ''}
                placeholder="Add any additional comments or notes for this quote..."
                rows={3}
                className="resize-none"
                disabled={isLocked}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="terms"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-terms">Terms & Conditions</FieldLabel>
              </FieldContent>
              <Textarea
                {...field}
                id="form-rhf-textarea-terms"
                aria-invalid={fieldState.invalid}
                value={field.value ?? ''}
                placeholder="Add terms and conditions for this quote..."
                rows={4}
                className="resize-none"
                disabled={isLocked}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
    </>
  );
}
