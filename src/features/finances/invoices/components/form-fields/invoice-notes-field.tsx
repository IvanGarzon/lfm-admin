'use client';

import { Controller, type Control } from 'react-hook-form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { InvoiceFormInput } from '@/features/finances/invoices/types';

export function InvoiceNotesField({
  control,
  isLocked,
}: {
  control: Control<InvoiceFormInput>;
  isLocked: boolean;
}) {
  return (
    <FieldGroup>
      <Controller
        name="notes"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel htmlFor="form-rhf-textarea-notes">Notes</FieldLabel>
            </FieldContent>
            <Textarea
              {...field}
              id="form-rhf-textarea-notes"
              aria-invalid={fieldState.invalid}
              value={field.value ?? ''}
              placeholder="Add any additional comments or notes for this invoice..."
              rows={3}
              className="resize-none"
              disabled={isLocked}
            />
            {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
