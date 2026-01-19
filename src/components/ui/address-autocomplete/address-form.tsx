'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressDialogSchema, type AddressDialogInput, type AddressInput } from '@/schemas/address';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Box } from '@/components/ui/box';

interface AddressFormProps {
  address: AddressInput;
  onSubmit: (data: AddressDialogInput) => void;
  onCancel: () => void;
}

export function AddressForm({ address, onSubmit, onCancel }: AddressFormProps) {
  const form = useForm<AddressDialogInput>({
    resolver: zodResolver(AddressDialogSchema),
    defaultValues: {
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
    },
  });

  return (
    <Form {...form}>
      <form
        id="form-rhf-address"
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="flex flex-col h-full mt-4"
      >
        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="address1">Address line 1</FieldLabel>
            </FieldContent>
            <Input
              {...form.register('address1')}
              id="address1"
              disabled={address?.address1 === ''}
              placeholder="Address line 1"
            />
            {form.formState.errors.address1 && (
              <FieldError errors={[form.formState.errors.address1]} />
            )}
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FieldContent>
              <FieldLabel htmlFor="address2">
                Address line 2 <span className="text-xs text-secondary-foreground">(Optional)</span>
              </FieldLabel>
            </FieldContent>
            <Input
              {...form.register('address2')}
              id="address2"
              disabled={address?.address1 === ''}
              placeholder="Address line 2"
            />
          </Field>
        </FieldGroup>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="city">City</FieldLabel>
              </FieldContent>
              <Input
                {...form.register('city')}
                id="city"
                disabled={address?.city === ''}
                placeholder="City"
              />
              {form.formState.errors.city && <FieldError errors={[form.formState.errors.city]} />}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="region">State / Province / Region</FieldLabel>
              </FieldContent>
              <Input
                {...form.register('region')}
                id="region"
                disabled={address?.region === ''}
                placeholder="Region"
              />
              {form.formState.errors.region && (
                <FieldError errors={[form.formState.errors.region]} />
              )}
            </Field>
          </FieldGroup>
        </Box>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="postalCode">Postal Code</FieldLabel>
              </FieldContent>
              <Input
                {...form.register('postalCode')}
                id="postalCode"
                disabled={address?.postalCode === ''}
                placeholder="Postal Code"
              />
              {form.formState.errors.postalCode && (
                <FieldError errors={[form.formState.errors.postalCode]} />
              )}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="country">Country</FieldLabel>
              </FieldContent>
              <Input value={address?.country} id="country" disabled placeholder="Country" />
            </Field>
          </FieldGroup>
        </Box>

        <Box className="flex justify-end gap-2 pt-4">
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </Box>
      </form>
    </Form>
  );
}
