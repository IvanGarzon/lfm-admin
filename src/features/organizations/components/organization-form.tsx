'use client';

import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { CreateOrganizationSchema, type CreateOrganizationInput } from '@/schemas/organizations';
import { StatesSchema, type States } from '@/zod/schemas/enums/States.schema';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { AddressInlineFields } from '@/components/ui/address-autocomplete/address-inline-fields';
import { emptyAddress, type AddressInput } from '@/schemas/address';

interface OrganizationFormProps {
  onCreate: (data: CreateOrganizationInput) => void;
  isCreating?: boolean;
}

export function OrganizationForm({ onCreate, isCreating = false }: OrganizationFormProps) {
  // Address autocomplete state
  const [address, setAddress] = useState<AddressInput>(emptyAddress);
  const [addressSearchInput, setAddressSearchInput] = useState('');

  const form = useForm<CreateOrganizationInput>({
    resolver: zodResolver(CreateOrganizationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: null,
      postcode: '',
      country: 'Australia',
    },
  });

  const onSubmit = useCallback(
    (_data: CreateOrganizationInput) => {
      // Map AddressInput to organization schema fields
      const stateValue = address.region as States | undefined;
      const isValidState = stateValue && StatesSchema.safeParse(stateValue).success;

      const organizationData: CreateOrganizationInput = {
        name: form.getValues('name'),
        address: address.address1 || null,
        city: address.city || null,
        state: isValidState ? stateValue : null,
        postcode: address.postalCode || null,
        country: address.country || 'Australia',
      };
      onCreate(organizationData);
    },
    [onCreate, address, form],
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
        {isCreating && (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Creating organization...</span>
          </Box>
        )}

        <Box className="flex-1 px-6 py-6 space-y-4">
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
                  />
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
              disabled={isCreating}
            />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          <Button type="submit" disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}
