'use client';

import { useCallback, useRef } from 'react';
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parsePhoneNumber } from 'react-phone-number-input';
import { Loader2, User, Phone, CalendarDays, Briefcase } from 'lucide-react';

import { Form } from '@/components/ui/form';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useFormReset } from '@/hooks/use-form-reset';
import { EmployeeStatusSchema } from '@/zod/schemas/enums/EmployeeStatus.schema';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from '@/schemas/employees';
import type { EmployeeListItem, EmployeeFormInput } from '@/features/staff/employees/types';
import { EmployeePersonalFields } from './form-fields/employee-personal-fields';
import { EmployeeContactFields } from './form-fields/employee-contact-fields';
import { EmployeeDetailsFields } from './form-fields/employee-details-fields';
import { EmployeeEmploymentFields } from './form-fields/employee-employment-fields';

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

  useFormReset(
    form,
    employee?.id,
    useCallback(() => {
      const values = employee ? mapEmployeeToFormValues(employee) : defaultFormState;

      onDirtyStateChange?.(false);
      return values;
    }, [employee, onDirtyStateChange]),
    isUpdating, // Reset form when update completes (true -> false)
  );

  const { isDirty } = form.formState;
  useUnsavedChanges(form.formState.isDirty);

  const previousDirtyRef = useRef(form.formState.isDirty);
  const currentDirty = form.formState.isDirty;

  if (currentDirty !== previousDirtyRef.current) {
    previousDirtyRef.current = currentDirty;
    queueMicrotask(() => {
      onDirtyStateChange?.(currentDirty);
    });
  }

  const onSubmit: SubmitHandler<EmployeeFormInput> = useCallback(
    (data: EmployeeFormInput) => {
      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdateEmployeeInput = {
          ...data,
          id: employee?.id ?? '',
        };

        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, employee?.id],
  );

  const isDisabled = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form
        id="form-rhf-employee"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isDisabled ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating employee...' : 'Updating employee...'}
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <Box className="space-y-4">
            <Box className="flex items-center gap-2">
              <Box className="flex items-center justify-center size-7 rounded-md bg-primary/10">
                <User className="size-3.5 text-primary" />
              </Box>
              <span className="text-sm font-semibold text-foreground">Personal</span>
              <Separator className="flex-1" />
            </Box>
            <EmployeePersonalFields control={form.control} isDisabled={isDisabled} />
          </Box>

          <Box className="space-y-4">
            <Box className="flex items-center gap-2">
              <Box className="flex items-center justify-center size-7 rounded-md bg-primary/10">
                <Phone className="size-3.5 text-primary" />
              </Box>
              <span className="text-sm font-semibold text-foreground">Contact</span>
              <Separator className="flex-1" />
            </Box>
            <EmployeeContactFields control={form.control} isDisabled={isDisabled} />
          </Box>

          <Box className="space-y-4">
            <Box className="flex items-center gap-2">
              <Box className="flex items-center justify-center size-7 rounded-md bg-primary/10">
                <CalendarDays className="size-3.5 text-primary" />
              </Box>
              <span className="text-sm font-semibold text-foreground">Details</span>
              <Separator className="flex-1" />
            </Box>
            <EmployeeDetailsFields control={form.control} isDisabled={isDisabled} />
          </Box>

          <Box className="space-y-4">
            <Box className="flex items-center gap-2">
              <Box className="flex items-center justify-center size-7 rounded-md bg-primary/10">
                <Briefcase className="size-3.5 text-primary" />
              </Box>
              <span className="text-sm font-semibold text-foreground">Employment</span>
              <Separator className="flex-1" />
            </Box>
            <EmployeeEmploymentFields control={form.control} isDisabled={isDisabled} />
          </Box>
        </Box>

        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isDisabled}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isDisabled || (employee && !isDirty)}>
            {isDisabled ? (
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
