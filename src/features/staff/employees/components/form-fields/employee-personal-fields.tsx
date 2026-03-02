import { Controller, type Control } from 'react-hook-form';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { EmployeeFormInput } from '@/features/staff/employees/types';

export function EmployeePersonalFields({
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
          name="firstName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-firstName">First Name</FieldLabel>
              </FieldContent>
              <Input
                {...field}
                id="form-rhf-input-firstName"
                aria-invalid={fieldState.invalid}
                placeholder="Enter first name"
                disabled={isDisabled}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-lastName">Last Name</FieldLabel>
              </FieldContent>
              <Input
                {...field}
                id="form-rhf-input-lastName"
                aria-invalid={fieldState.invalid}
                placeholder="Enter last name"
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
