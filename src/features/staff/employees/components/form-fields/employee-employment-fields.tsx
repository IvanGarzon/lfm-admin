import { Controller, type Control } from 'react-hook-form';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EmployeeFormInput } from '@/features/staff/employees/types';
import { EmployeeStatusSchema } from '@/zod/schemas/enums/EmployeeStatus.schema';

const StatusOptions = EmployeeStatusSchema.options.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

export function EmployeeEmploymentFields({
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
          name="rate"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-rate">Rate ($)</FieldLabel>
              </FieldContent>
              <Input
                id="form-rhf-input-rate"
                type="number"
                step="0.01"
                min="0"
                aria-invalid={fieldState.invalid}
                placeholder="Enter rate"
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                disabled={isDisabled}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-status">Status</FieldLabel>
              </FieldContent>
              <Select onValueChange={field.onChange} value={field.value} disabled={isDisabled}>
                <SelectTrigger id="form-rhf-select-status" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {StatusOptions.map(({ value, label }) => (
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
    </Box>
  );
}
