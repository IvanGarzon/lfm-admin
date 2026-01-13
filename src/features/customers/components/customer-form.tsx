'use client';

import { useEffect, useCallback } from 'react';
import { Controller, useForm, type Resolver, SubmitHandler } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from '@/schemas/customers';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { OrganizationSelect } from '@/components/shared/organization-select';
import { useOrganizations } from '@/features/organizations/hooks/use-organization-queries';
import type { CustomerListItem, CustomerFormInput } from '@/features/customers/types';
import { CustomerStatusSchema } from '@/zod/inputTypeSchemas/CustomerStatusSchema';
import { GenderSchema } from '@/zod/inputTypeSchemas/GenderSchema';

const GenderOptions = GenderSchema.options.map((gender) => ({
  value: gender,
  label: gender.charAt(0) + gender.slice(1).toLowerCase(),
}));

const StatusOptions = CustomerStatusSchema.options.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

export function CustomerForm({
  customer,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
}: {
  customer?: CustomerListItem;
  onCreate?: (data: CreateCustomerInput) => void;
  onUpdate?: (data: UpdateCustomerInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
}) {
  const mode = customer ? 'update' : 'create';

  const createResolver: Resolver<CustomerFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateCustomerSchema : UpdateCustomerSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<CustomerFormInput>({
    resolver: createResolver,
    defaultValues: customer
      ? {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone ?? null,
          gender: customer.gender,
          status: customer.status,
          organizationId: customer.organizationId ?? '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: null,
          gender: GenderSchema.enum.MALE,
          status: CustomerStatusSchema.enum.ACTIVE,
          organizationId: '',
        },
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  const { data: organizations = [], isLoading: isLoadingOrganizations } = useOrganizations();

  const onSubmit: SubmitHandler<CustomerFormInput> = useCallback(
    (data: CustomerFormInput) => {
      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdateCustomerInput = {
          ...data,
          id: customer?.id ?? '',
        };
        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, customer?.id],
  );

  return (
    <Form {...form}>
      <form
        id="form-rhf-customer"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating customer...' : 'Updating customer...'}
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
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      id="form-rhf-input-phone"
                      aria-invalid={fieldState.invalid}
                      placeholder="+61 400 000 000"
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
                        <SelectValue />
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
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-status">Status</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="form-rhf-select-status" aria-invalid={fieldState.invalid}>
                        <SelectValue />
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

          <Box className="space-y-4 border-t pt-4">
            <FieldGroup>
              <Controller
                name="organizationId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <OrganizationSelect
                      organizations={organizations}
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                      isLoading={isLoadingOrganizations}
                      label="Organization (Optional)"
                      placeholder="Select or create an organization"
                      showAddOrganizationLink={true}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          <Box className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
            <Button type="submit" disabled={isCreating || isUpdating || (customer && !isDirty)}>
              {customer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </Box>
        </Box>
      </form>
    </Form>
  );
}
