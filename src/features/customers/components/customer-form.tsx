'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
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
import { AddressInlineFields } from '@/components/ui/address-autocomplete/address-inline-fields';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { OrganizationSelect } from '@/components/shared/organization-select';
import { useOrganizations } from '@/features/organizations/hooks/use-organization-queries';
import type { CustomerListItem, CustomerFormInput } from '@/features/customers/types';
import { AddressSourceSelector } from './address-source-selector';

import { GenderSchema } from '@/zod/schemas/enums/Gender.schema';
import { CustomerStatusSchema } from '@/zod/schemas/enums/CustomerStatus.schema';

import { emptyAddress, type AddressInput } from '@/schemas/address';

const GenderOptions = GenderSchema.options.map((gender) => ({
  value: gender,
  label: gender.charAt(0) + gender.slice(1).toLowerCase(),
}));

const StatusOptions = CustomerStatusSchema.options.map((status) => ({
  value: status,
  label: status.charAt(0) + status.slice(1).toLowerCase(),
}));

const defaultFormState: CreateCustomerInput = {
  firstName: '',
  lastName: '',
  email: '',
  phone: null,
  gender: GenderSchema.enum.MALE,
  status: CustomerStatusSchema.enum.ACTIVE,
  organizationId: '',
  useOrganizationAddress: false,
  address: null,
};

const mapCustomerToFormValues = (customer: CustomerListItem): UpdateCustomerInput => {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone ?? null,
    gender: customer.gender,
    status: customer.status,
    organizationId: customer.organizationId ?? '',
    useOrganizationAddress: customer.useOrganizationAddress ?? false,
    address: customer.address ?? null,
  };
};

export function CustomerForm({
  customer,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  customer?: CustomerListItem;
  onCreate?: (data: CreateCustomerInput) => void;
  onUpdate?: (data: UpdateCustomerInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const mode = customer ? 'update' : 'create';

  const defaultValues: CustomerFormInput =
    mode === 'create'
      ? defaultFormState
      : customer
        ? mapCustomerToFormValues(customer)
        : defaultFormState;

  const createResolver: Resolver<CustomerFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateCustomerSchema : UpdateCustomerSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<CustomerFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  const { isDirty } = form.formState;

  // Watch address from form
  const watchedAddress = form.watch('address');

  // Address autocomplete search input state
  const [addressSearchInput, setAddressSearchInput] = useState<string>('');

  // Handler to update address in form
  const handleAddressChange = useCallback(
    (newAddress: AddressInput) => {
      const targetAddress = newAddress.formattedAddress ? newAddress : null;
      form.setValue('address', targetAddress, { shouldDirty: true });
    },
    [form],
  );

  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  const { data: organizations = [], isLoading: isLoadingOrganizations } = useOrganizations();

  // Watch organization-related fields
  const watchedOrgId = form.watch('organizationId');
  const watchedUseOrgAddress = form.watch('useOrganizationAddress');

  // Find selected organization with full details
  const selectedOrganization = useMemo(
    () => organizations.find((org) => org.id === watchedOrgId) ?? null,
    [organizations, watchedOrgId],
  );

  // Handle address source change
  const handleAddressSourceChange = useCallback(
    (useOrgAddress: boolean) => {
      form.setValue('useOrganizationAddress', useOrgAddress, { shouldDirty: true });

      if (useOrgAddress) {
        // Clear customer address when using org address
        form.setValue('address', null, { shouldDirty: true });
        setAddressSearchInput('');
      }
    },
    [form],
  );

  // Handler for organization change - resets useOrganizationAddress
  const handleOrganizationChange = useCallback(
    (organizationId: string) => {
      form.setValue('organizationId', organizationId, { shouldDirty: true });
      form.setValue('useOrganizationAddress', false, { shouldDirty: true });
    },
    [form],
  );

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
                      onValueChange={handleOrganizationChange}
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

            {/* Address Source Selector - only show when organization is selected */}
            {watchedOrgId ? (
              <FieldGroup>
                <AddressSourceSelector
                  organization={selectedOrganization}
                  useOrganizationAddress={watchedUseOrgAddress ?? false}
                  onValueChange={handleAddressSourceChange}
                />
              </FieldGroup>
            ) : null}

            {/* Custom Address Input - show only when NOT using org address */}
            {!watchedOrgId || !watchedUseOrgAddress ? (
              <Box className="space-y-2">
                <FieldLabel>Address {watchedOrgId ? '(Optional)' : '(Required)'}</FieldLabel>
                <Controller
                  name="address"
                  control={form.control}
                  render={({ fieldState }) => (
                    <>
                      <AddressInlineFields
                        address={watchedAddress ?? emptyAddress}
                        setAddress={handleAddressChange}
                        searchInput={addressSearchInput}
                        setSearchInput={setAddressSearchInput}
                        placeholder="Search for an address"
                        disabled={isCreating || isUpdating}
                      />
                      {fieldState.invalid && !watchedAddress?.formattedAddress && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </>
                  )}
                />
              </Box>
            ) : null}
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
          <Button type="submit" disabled={isCreating || isUpdating || (customer && !isDirty)}>
            {isCreating || isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {customer ? 'Updating...' : 'Creating...'}
              </>
            ) : customer ? (
              'Update Customer'
            ) : (
              'Create Customer'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}
