'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeStatus, Employee } from '@/prisma/client';
import { GenderSchema, type GenderType } from '@/zod/inputTypeSchemas/GenderSchema';
import {
  EmployeeStatusSchema,
  type EmployeeStatusType,
} from '@/zod/inputTypeSchemas/EmployeeStatusSchema';
import { Loader2 } from 'lucide-react';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  type CreateEmployeeFormValues,
  type UpdateEmployeeFormValues,
} from '@/schemas/employees';
import { DatePicker } from '@/components/ui/date-picker';
import { PhoneInputField } from '@/components/ui/phone-input';
import { parsePhoneNumber } from 'react-phone-number-input';
import type { SubmitHandler } from 'react-hook-form';

const defaultFormState: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  dob: undefined,
  phone: '',
  email: '',
  gender: undefined,
  status: EmployeeStatus.ACTIVE,
  rate: '0',
  avatarUrl: null,
};

type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rate: string;
  status: EmployeeStatusType;
  avatarUrl: string | null;
  id?: string;
  gender?: GenderType | undefined;
  dob?: Date | undefined;
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

const mapEmployeeToFormValues = (employee: Employee | null): EmployeeFormValues => {
  if (!employee) {
    return defaultFormState;
  }

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    dob: employee.dob ?? undefined,
    phone: normalizePhoneNumber(employee.phone),
    email: employee.email,
    gender: employee.gender ?? undefined,
    status: employee.status,
    rate: employee.rate.toString(),
    avatarUrl: employee.avatarUrl ?? null,
  };
};

const genderOptions = GenderSchema.options.map((gender) => ({
  value: gender,
  label: gender.charAt(0) + gender.slice(1).toLowerCase(),
}));

const statusOptions = EmployeeStatusSchema.options.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

export function EmployeeForm({
  employee,
  onCreate,
  onUpdate,
  isUpdating = false,
  isCreating = false,
}: {
  employee?: Employee | undefined | null;
  onCreate?: (data: CreateEmployeeFormValues) => void;
  onUpdate?: (data: UpdateEmployeeFormValues) => void;
  isUpdating?: boolean;
  isCreating?: boolean;
}) {
  const mode = employee ? 'update' : 'create';
  const isSubmitting = isUpdating || isCreating;

  // Get default values and ensure they're properly serialized (no superjson metadata)
  const rawDefaultValues: EmployeeFormValues =
    mode === 'create'
      ? defaultFormState
      : employee
        ? mapEmployeeToFormValues(employee)
        : defaultFormState;

  // Clean default values to ensure no superjson metadata leaks through
  const defaultValues: EmployeeFormValues = {
    ...rawDefaultValues,
    dob:
      rawDefaultValues.dob instanceof Date
        ? rawDefaultValues.dob
        : rawDefaultValues.dob
          ? new Date(String(rawDefaultValues.dob).replace('$D', ''))
          : undefined,
    rate: String(rawDefaultValues.rate).replace('$D', ''),
  };

  const form = useForm<EmployeeFormValues>({
    mode: 'onBlur',
    resolver: zodResolver(mode === 'create' ? CreateEmployeeSchema : UpdateEmployeeSchema),
    defaultValues,
  });

  const onSubmit: SubmitHandler<EmployeeFormValues> = (data) => {
    const cleanedData = {
      ...data,
      dob: data.dob instanceof Date ? data.dob.toISOString() : data.dob,
      rate: parseFloat(String(data.rate)),
    };

    if (mode === 'create') {
      onCreate?.(cleanedData);
    } else {
      onUpdate?.(cleanedData as UpdateEmployeeFormValues);
    }
  };

  return (
    <Form {...form}>
      <form id="employee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Box className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input type="search" placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <PhoneInputField
                    defaultCountry="AU"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <DatePicker
                    endYear={new Date().getFullYear()}
                    formatString="MMMM d, yyyy"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Box>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Updating...'
            : mode === 'create'
              ? 'Create Employee'
              : 'Update Employee'}
        </Button>
      </form>
    </Form>
  );
}
