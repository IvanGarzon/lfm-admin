import { Controller, type Control } from 'react-hook-form';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { GenderSchema } from '@/zod/schemas/enums/Gender.schema';
import type { EmployeeFormInput } from '@/features/staff/employees/types';

const GenderOptions = GenderSchema.options.map((gender) => ({
  value: gender,
  label: gender.charAt(0) + gender.slice(1).toLowerCase(),
}));

export function EmployeeDetailsFields({
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
          name="gender"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-gender">Gender</FieldLabel>
              </FieldContent>
              <Select onValueChange={field.onChange} value={field.value} disabled={isDisabled}>
                <SelectTrigger id="form-rhf-select-gender" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GenderOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="dob"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-dob">Date of Birth</FieldLabel>
              </FieldContent>
              <DatePicker
                endYear={new Date().getFullYear()}
                formatString="MMMM d, yyyy"
                value={field.value as Date | undefined}
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
