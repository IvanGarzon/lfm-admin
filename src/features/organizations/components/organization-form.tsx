'use client';

import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { CreateOrganizationSchema, type CreateOrganizationInput } from '@/schemas/organizations';
import { StatesSchema } from '@/zod/inputTypeSchemas/StatesSchema';
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

const StateOptions = StatesSchema.options.map((state) => ({
  value: state,
  label: state,
}));

interface OrganizationFormProps {
  onCreate: (data: CreateOrganizationInput) => void;
  isCreating?: boolean;
}

export function OrganizationForm({ onCreate, isCreating = false }: OrganizationFormProps) {
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
    (data: CreateOrganizationInput) => {
      onCreate(data);
    },
    [onCreate],
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

        <Box className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
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
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldLabel htmlFor="form-rhf-address">Address</FieldLabel>
                  </FieldContent>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    id="form-rhf-input-address"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter street address"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-city">City</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      id="form-rhf-input-city"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter city"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-state">State</FieldLabel>
                    </FieldContent>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <SelectTrigger id="form-rhf-select-state" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {StateOptions.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="postcode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-postcode">Postcode</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      id="form-rhf-input-postcode"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter postcode"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="country"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-rhf-country">Country</FieldLabel>
                    </FieldContent>
                    <Input
                      {...field}
                      value={field.value ?? 'Australia'}
                      id="form-rhf-input-country"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter country"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </Box>

          <Box className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
            <Button type="submit" disabled={isCreating}>
              Create Organization
            </Button>
          </Box>
        </Box>
      </form>
    </Form>
  );
}
