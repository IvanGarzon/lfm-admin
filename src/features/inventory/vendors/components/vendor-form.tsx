'use client';

import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, useWatch, type SubmitHandler, type Resolver } from 'react-hook-form';
import { useFormReset } from '@/hooks/use-form-reset';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  type CreateVendorInput,
  type UpdateVendorInput,
} from '@/schemas/vendors';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { VendorFormInput, VendorWithDetails } from '@/features/inventory/vendors/types';
import { VendorStatusSchema } from '@/zod/schemas/enums/VendorStatus.schema';
import { AddressInlineFields } from '@/components/ui/address-autocomplete/address-inline-fields';
import { emptyAddress, type AddressInput } from '@/schemas/address';

const defaultFormState: CreateVendorInput = {
  name: '',
  email: '',
  phone: null,
  abn: null,
  status: VendorStatusSchema.enum.ACTIVE,
  address: null,
  website: null,
  paymentTerms: 30,
  taxId: null,
  notes: null,
};

function mapVendorToFormValues(vendor: VendorWithDetails): UpdateVendorInput {
  return {
    id: vendor.id,
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    abn: vendor.abn,
    status: vendor.status,
    address: vendor.address,
    website: vendor.website,
    paymentTerms: vendor.paymentTerms,
    taxId: vendor.taxId,
    notes: vendor.notes,
  };
}

export function VendorForm({
  vendor,
  onCreate,
  onUpdate,
  isCreating = false,
  isUpdating = false,
  onDirtyStateChange,
  onClose,
}: {
  vendor?: VendorWithDetails | null;
  onCreate?: (data: CreateVendorInput) => void;
  onUpdate?: (data: UpdateVendorInput) => void;
  isCreating?: boolean;
  isUpdating?: boolean;
  onDirtyStateChange?: (isDirty: boolean) => void;
  onClose?: () => void;
}) {
  const mode = vendor ? 'edit' : 'create';

  const defaultValues: VendorFormInput =
    mode === 'create'
      ? defaultFormState
      : vendor
        ? mapVendorToFormValues(vendor)
        : defaultFormState;

  const createResolver: Resolver<VendorFormInput> = (values: any, context: any, options: any) => {
    const schema = mode === 'create' ? CreateVendorSchema : UpdateVendorSchema;
    return zodResolver(schema)(values, context, options);
  };

  const form = useForm<VendorFormInput>({
    mode: 'onChange',
    resolver: createResolver,
    defaultValues,
  });

  // Reset form when switching between vendors
  useFormReset(
    form,
    vendor?.id,
    useCallback(() => (vendor ? mapVendorToFormValues(vendor) : defaultFormState), [vendor]),
  );

  // Watch address field
  const watchedAddress = useWatch({
    control: form.control,
    name: 'address',
  });

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

  // Track dirty state for parent
  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyStateChange]);

  // Warn user before leaving page with unsaved changes
  useUnsavedChanges(form.formState.isDirty);

  const onSubmit: SubmitHandler<VendorFormInput> = useCallback(
    (data: VendorFormInput) => {
      if (mode === 'create') {
        onCreate?.(data);
      } else {
        const updateData: UpdateVendorInput = {
          ...data,
          id: vendor?.id ?? '',
        };

        onUpdate?.(updateData);
      }
    },
    [mode, onCreate, onUpdate, vendor?.id],
  );

  const isSubmitting = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form
        id="form-rhf-vendor"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        {isCreating || isUpdating ? (
          <Box className="px-6 py-3 bg-primary/10 border-b flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              {isCreating ? 'Creating vendor...' : 'Updating vendor...'}
            </span>
          </Box>
        ) : null}

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-vendor-name">Vendor Name *</FieldLabel>
                      </FieldContent>
                      <Input
                        id="form-rhf-vendor-name"
                        {...field}
                        placeholder="Acme Corp"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-vendor-email">Email *</FieldLabel>
                      </FieldContent>
                      <Input
                        id="form-rhf-vendor-email"
                        type="email"
                        {...field}
                        placeholder="contact@acme.com"
                        disabled={isSubmitting}
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
                        <FieldLabel htmlFor="form-rhf-vendor-phone">Phone</FieldLabel>
                      </FieldContent>
                      <Input
                        id="form-rhf-vendor-phone"
                        {...field}
                        value={field.value ?? ''}
                        placeholder="+61 2 1234 5678"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="abn"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-vendor-abn">ABN</FieldLabel>
                      </FieldContent>
                      <Input
                        id="form-rhf-vendor-abn"
                        {...field}
                        value={field.value ?? ''}
                        placeholder="12 345 678 901"
                        disabled={isSubmitting}
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
                        <FieldLabel htmlFor="form-rhf-vendor-status">Status</FieldLabel>
                      </FieldContent>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="form-rhf-vendor-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={VendorStatusSchema.enum.ACTIVE}>Active</SelectItem>
                          <SelectItem value={VendorStatusSchema.enum.INACTIVE}>Inactive</SelectItem>
                          <SelectItem value={VendorStatusSchema.enum.SUSPENDED}>
                            Suspended
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="paymentTerms"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-vendor-payment-terms">
                          Payment Terms (days)
                        </FieldLabel>
                      </FieldContent>
                      <Input
                        id="form-rhf-vendor-payment-terms"
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                        placeholder="30"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Address</h3>
            <div className="space-y-2">
              <FieldLabel>Address (Optional)</FieldLabel>
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
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid && !watchedAddress?.formattedAddress && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </>
                )}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <div className="grid gap-4">
              <FieldGroup>
                <Controller
                  name="website"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-vendor-website">Website</FieldLabel>
                      </FieldContent>
                      <Input
                        id="form-rhf-vendor-website"
                        type="url"
                        {...field}
                        value={field.value ?? ''}
                        placeholder="https://acme.com"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="taxId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-vendor-tax-id">Tax ID</FieldLabel>
                      </FieldContent>
                      <Input
                        id="form-rhf-vendor-tax-id"
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Tax identification number"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>

              <FieldGroup>
                <Controller
                  name="notes"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor="form-rhf-vendor-notes">Notes</FieldLabel>
                      </FieldContent>
                      <Textarea
                        id="form-rhf-vendor-notes"
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Additional notes about this vendor..."
                        rows={4}
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />
              </FieldGroup>
            </div>
          </div>
        </Box>

        {/* Action Buttons */}
        <Box className="border-t p-6 flex gap-3 justify-end bg-gray-50 dark:bg-gray-900">
          {onClose ? (
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Vendor'
            ) : (
              'Update Vendor'
            )}
          </Button>
        </Box>
      </form>
    </Form>
  );
}
