import { Controller, type Control } from 'react-hook-form';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PhoneInputField } from '@/components/ui/phone-input';
import type { EmployeeFormInput } from '@/features/staff/employees/types';

export function EmployeeContactFields({
  control,
  isDisabled,
}: {
  control: Control<EmployeeFormInput>;
  isDisabled: boolean;
}) {
  return (
    <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FieldGroup>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-email">Email</FieldLabel>
              </FieldContent>
              <Input
                {...field}
                id="form-rhf-input-email"
                aria-invalid={fieldState.invalid}
                placeholder="john.doe@example.com"
                disabled={isDisabled}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-phone">Phone</FieldLabel>
              </FieldContent>
              <PhoneInputField
                defaultCountry="AU"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                disabled={isDisabled}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
    </Box>
  );
}
