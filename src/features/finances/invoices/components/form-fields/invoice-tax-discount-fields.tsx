'use client';

import { Control, Controller } from 'react-hook-form';
import { Percent, DollarSign } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from '@/components/ui/input-group';

import type { InvoiceFormInput } from '@/features/finances/invoices/types';

interface InvoiceTaxDiscountFieldsProps {
  control: Control<InvoiceFormInput>;
  isLocked: boolean;
}

export function InvoiceTaxDiscountFields({ control, isLocked }: InvoiceTaxDiscountFieldsProps) {
  return (
    <Box className="grid grid-cols-2 gap-4">
      <FieldGroup>
        <Controller
          name="gst"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-gst">GST</FieldLabel>
              </FieldContent>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <Percent className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="form-rhf-input-gst"
                  aria-invalid={fieldState.invalid}
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Enter GST percentage"
                  disabled={isLocked}
                />
              </InputGroup>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="discount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-discount">Discount</FieldLabel>
              </FieldContent>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>
                    <DollarSign className="h-4 w-4" />
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  {...field}
                  id="form-rhf-input-discount"
                  aria-invalid={fieldState.invalid}
                  type="number"
                  step="1"
                  min="0"
                  value={isNaN(field.value ?? 0) ? '' : (field.value ?? 0)}
                  onChange={(e) => {
                    const value = e.target.valueAsNumber;
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                  placeholder="Enter discount amount"
                  disabled={isLocked}
                />
              </InputGroup>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
    </Box>
  );
}
