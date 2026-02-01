'use client';

import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from '@/schemas/organizations';
import { StatesSchema, type States } from '@/zod/schemas/enums/States.schema';
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
import { emptyAddress, type AddressInput } from '@/schemas/address';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { OrganizationListItem, OrganizationFormInput } from '@/features/organizations/types';

const defaultFormState: CreateOrganizationInput = {
  name: '',
  address: null,
  city: null,
  state: null,
  postcode: null,
  country: 'Australia',
  phone: null,
  email: null,
  website: null,
  abn: null,
  status: 'ACTIVE',
};

const mapOrganizationToFormValues = (
  organization: OrganizationListItem,
): UpdateOrganizationInput => {
  return {
    id: organization.id,
    name: organization.name,
    address: organization.address,
    city: organization.city,
    state: organization.state,
    postcode: organization.postcode,
    country: organization.country,
    phone: organization.phone,
    email: organization.email,
    website: organization.website,
    abn: organization.abn,
    status: organization.status,
  };
};

interface OrganizationFormProps {
  organization?: OrganizationListItem;
  onCreate?: (data: CreateOrganizationInput) => void;
  onUpdate?: (data: UpdateOrganizationInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}

export function OrganizationForm({
  organization,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: OrganizationFormProps) {
  const mode = organization ? 'update' : 'create';

  const defaultValues: OrganizationFormInput =
    mode === 'create'
      ? defaultFormState
      : organization
        ? mapOrganizationToFormValues(organization)
        : defaultFormState;

  const createResolver: Resolver<OrganizationFormInput> = (values, context, options) => {
    const schema = mode === 'create' ? CreateOrganizationSchema : UpdateOrganizationSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<OrganizationFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  const { isDirty } = form.formState;

  // Address autocomplete state
  const [address, setAddress] = useState<AddressInput>(() => {
    if (mode === 'update' && organization) {
      const stateValue = organization.state as States | undefined;
      const isValidState = stateValue && StatesSchema.safeParse(stateValue).success;

      return {
        address1: organization.address || '',
        address2: '',
        city: organization.city || '',
        region: isValidState ? stateValue : '',
        postalCode: organization.postcode || '',
        country: organization.country || 'Australia',
        lat: 0,
        lng: 0,
        formattedAddress: organization.address || '',
      };
    }
    return emptyAddress;
  });
  const [addressSearchInput, setAddressSearchInput] = useState('');

  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(isDirty);

  const onSubmit: SubmitHandler<OrganizationFormInput> = useCallback(
    (data: OrganizationFormInput) => {
      // Map AddressInput to organization schema fields
      const stateValue = address.region as States | undefined;
      const isValidState = stateValue && StatesSchema.safeParse(stateValue).success;

      if (mode === 'create') {
        const organizationData: CreateOrganizationInput = {
          name: data.name,
          address: address.address1 || null,
          city: address.city || null,
          state: isValidState ? stateValue : null,
          postcode: address.postalCode || null,
          country: address.country || 'Australia',
          phone: data.phone,
          email: data.email,
          website: data.website,
          abn: data.abn,
          status: data.status,
        };
        onCreate?.(organizationData);
      } else {
        const updateData: UpdateOrganizationInput = {
          ...data,
          id: (data as UpdateOrganizationInput).id,
          address: address.address1 || null,
          city: address.city || null,
          state: isValidState ? stateValue : null,
          postcode: address.postalCode || null,
          country: address.country || 'Australia',
          phone: data.phone,
          email: data.email,
          website: data.website,
          abn: data.abn,
          status: data.status,
        };
        onUpdate?.(updateData);
      }
    },
    [onCreate, onUpdate, address, mode],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <Form {...form}>
      <form id="form-rhf-organization" onSubmit={handleSubmit} className="flex flex-col h-full">
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating organization...' : 'Updating organization...'}
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-name">Organization Name *</FieldLabel>
                  </FieldContent>
                  <Input
                    {...field}
                    id="form-rhf-input-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter organization name"
                    disabled={isCreating || isUpdating}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    value={field.value || ''}
                    id="form-rhf-input-phone"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. 0412 345 678"
                    disabled={isCreating || isUpdating}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

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
                    value={field.value || ''}
                    id="form-rhf-input-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. contact@example.com"
                    disabled={isCreating || isUpdating}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="website"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-website">Website</FieldLabel>
                  </FieldContent>
                  <Input
                    {...field}
                    value={field.value || ''}
                    id="form-rhf-input-website"
                    type="url"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. https://example.com"
                    disabled={isCreating || isUpdating}
                  />
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />

            <Controller
              name="abn"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-abn">ABN</FieldLabel>
                  </FieldContent>
                  <Input
                    {...field}
                    value={field.value || ''}
                    id="form-rhf-input-abn"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g. 12 345 678 901"
                    disabled={isCreating || isUpdating}
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || 'ACTIVE'}
                    disabled={isCreating || isUpdating}
                  >
                    <SelectTrigger id="form-rhf-select-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="DELETED">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
              )}
            />
          </FieldGroup>

          <Box className="space-y-2">
            <FieldLabel>Address</FieldLabel>
            <AddressInlineFields
              address={address}
              setAddress={setAddress}
              searchInput={addressSearchInput}
              setSearchInput={setAddressSearchInput}
              placeholder="Search for an address"
              disabled={isCreating || isUpdating}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : mode === 'update' ? (
              'Update Organization'
            ) : (
              'Create Organization'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}
