'use client';

import { useEffect, useCallback } from 'react';
import { Controller, useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumber } from 'react-phone-number-input';
import { Loader2 } from 'lucide-react';

import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { PhoneInputField } from '@/components/ui/phone-input';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useFormReset } from '@/hooks/use-form-reset';
import { GenderSchema } from '@/zod/schemas/enums/Gender.schema';
import { EmployeeStatusSchema } from '@/zod/schemas/enums/EmployeeStatus.schema';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from '@/schemas/employees';
import type { EmployeeListItem, EmployeeFormInput } from '@/features/staff/employees/types';

const GenderOptions = GenderSchema.options.map((gender) => ({
  value: gender,
  label: gender.charAt(0) + gender.slice(1).toLowerCase(),
}));

const StatusOptions = EmployeeStatusSchema.options.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

const defaultFormState: CreateEmployeeInput = {
  firstName: '',
  lastName: '',
  dob: undefined,
  phone: '',
  email: '',
  gender: undefined,
  status: EmployeeStatusSchema.enum.ACTIVE,
  rate: 0,
  avatarUrl: null,
};

// Helper function to convert phone number to E.164 format
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) {
    return '';
  }

  // If already in E.164 format, return as is
  if (phone.startsWith('+')) return phone;

  // Try to parse as Australian number
  try {
    const phoneNumber = parsePhoneNumber(phone, 'AU');
    return phoneNumber ? phoneNumber.format('E.164') : phone;
  } catch {
    // If parsing fails, assume it's Australian and add +61
    if (phone.startsWith('0')) {
      return '+61' + phone.substring(1);
    }
    return phone;
  }
};

const mapEmployeeToFormValues = (employee: EmployeeListItem): UpdateEmployeeInput => {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    dob: employee.dob ?? undefined,
    phone: normalizePhoneNumber(employee.phone),
    email: employee.email,
    gender: employee.gender ?? undefined,
    status: employee.status,
    rate: employee.rate,
    avatarUrl: employee.avatarUrl ?? null,
  };
};

export function EmployeeForm({
  employee,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  employee?: EmployeeListItem;
  onCreate?: (data: CreateEmployeeInput) => void;
  onUpdate?: (data: UpdateEmployeeInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const mode = employee ? 'update' : 'create';

  const defaultValues: EmployeeFormInput =
    mode === 'create'
      ? defaultFormState
      : employee
        ? mapEmployeeToFormValues(employee)
        : defaultFormState;

  const createResolver: Resolver<EmployeeFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateEmployeeSchema : UpdateEmployeeSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<EmployeeFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  // Reset form when employee changes (instead of relying on key={id} remount)
  useFormReset(
    form,
    employee?.id,
    useCallback(
      () => (employee ? mapEmployeeToFormValues(employee) : defaultFormState),
      [employee],
    ),
  );

  const { isDirty } = form.formState;

  // Track dirty state for parent
  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  const onSubmit: SubmitHandler<EmployeeFormInput> = useCallback(
    (data: EmployeeFormInput) => {
      if (mode === 'create') {
        onCreate?.(data as CreateEmployeeInput);
      } else {
        const updateData: UpdateEmployeeInput = {
          ...data,
          id: employee?.id ?? '',
        } as UpdateEmployeeInput;
        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, employee?.id],
  );

  return (
    <Form {...form}>
      <form
        id="form-rhf-employee"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating employee...' : 'Updating employee...'}
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="firstName"
                control={form.control}
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
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="lastName"
                control={form.control}
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
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
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
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="phone"
                control={form.control}
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
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="gender"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-gender">Gender</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                control={form.control}
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
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="rate"
                control={form.control}
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
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-status">Status</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value}>
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
        </Box>

        {/* Action Buttons */}
        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          {onClose ? (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isCreating || isUpdating || (employee && !isDirty)}>
            {isCreating || isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Employee'
            ) : (
              'Update Employee'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}
