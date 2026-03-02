import { Controller, type Control } from 'react-hook-form';

import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { VendorSelect } from '@/features/inventory/vendors/components/vendor-select';
import { TransactionTypeSchema } from '@/zod/schemas/enums/TransactionType.schema';
import type { TransactionFormInput } from '@/features/finances/transactions/types';

export function TransactionPayeeField({
  control,
  isDisabled,
  transactionType,
}: {
  control: Control<TransactionFormInput>;
  isDisabled: boolean;
  transactionType: string;
}) {
  return (
    <FieldGroup>
      {transactionType === TransactionTypeSchema.enum.EXPENSE ? (
        <Controller
          name="vendorId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <VendorSelect
                value={field.value ?? undefined}
                onValueChange={field.onChange}
                placeholder="Select or create a vendor"
                label="Vendor (Optional)"
                showAddVendorLink={false}
                disabled={isDisabled}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      ) : (
        <Controller
          name="payee"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-payee">From (Customer/Client)</FieldLabel>
              </FieldContent>
              <Input
                {...field}
                id="form-rhf-input-payee"
                aria-invalid={fieldState.invalid}
                placeholder="Enter customer name"
                disabled={isDisabled}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      )}
    </FieldGroup>
  );
}
