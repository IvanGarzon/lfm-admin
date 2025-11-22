'use client';

import { useState } from 'react';
import { Controller, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronDown } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { CreateCustomerSchema, type CreateCustomerInput } from '@/schemas/customers';
import { useOrganizations } from '@/features/customers/hooks/useCustomersQueries';

interface CustomerFormProps {
  onSubmit: (data: CreateCustomerInput) => void;
  defaultValues?: Partial<CreateCustomerInput>;
  form?: UseFormReturn<CreateCustomerInput>;
}

export function CustomerForm({ onSubmit, defaultValues, form: externalForm }: CustomerFormProps) {
  const [organizationMode, setOrganizationMode] = useState<'select' | 'create'>('select');
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);

  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizations();

  const internalForm = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: defaultValues ?? {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'MALE',
      organizationId: undefined,
      organizationName: '',
    },
  });

  // Use external form if provided, otherwise use internal form
  const form = externalForm ?? internalForm;
  const selectedOrgId = form.watch('organizationId');
  const selectedOrg = organizations?.find((org) => org.id === selectedOrgId);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
      {/* First Name */}
      <FieldGroup>
        <Controller
          name="firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="customer-form-firstName">
                  First Name <span className="text-destructive">*</span>
                </FieldLabel>
              </FieldContent>
              <Input
                {...field}
                id="customer-form-firstName"
                placeholder="Enter first name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Last Name */}
      <FieldGroup>
        <Controller
          name="lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="customer-form-lastName">
                  Last Name <span className="text-destructive">*</span>
                </FieldLabel>
              </FieldContent>
              <Input
                {...field}
                id="customer-form-lastName"
                placeholder="Enter last name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Email */}
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="customer-form-email">
                  Email <span className="text-destructive">*</span>
                </FieldLabel>
              </FieldContent>
              <Input
                {...field}
                id="customer-form-email"
                type="email"
                placeholder="Enter email address"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Phone */}
      <FieldGroup>
        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="customer-form-phone">Phone</FieldLabel>
              </FieldContent>
              <Input
                {...field}
                value={field.value ?? ''}
                id="customer-form-phone"
                type="tel"
                placeholder="Enter phone number"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Gender */}
      <FieldGroup>
        <Controller
          name="gender"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor="customer-form-gender">
                  Gender <span className="text-destructive">*</span>
                </FieldLabel>
              </FieldContent>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="customer-form-gender" aria-invalid={fieldState.invalid}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* Organization Section */}
      <Box className="space-y-3">
        <Box className="flex items-center justify-between">
          <FieldLabel>Organization (Optional)</FieldLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOrganizationMode(organizationMode === 'select' ? 'create' : 'select');
              form.setValue('organizationId', undefined);
              form.setValue('organizationName', '');
            }}
            className="h-auto p-1 text-xs"
          >
            {organizationMode === 'select' ? 'Create new' : 'Select existing'}
          </Button>
        </Box>

        {organizationMode === 'select' ? (
          <FieldGroup>
            <Controller
              name="organizationId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={isLoadingOrganizations}
                        type="button"
                      >
                        {selectedOrg ? selectedOrg.name : 'Select organization'}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-0"
                      align="start"
                      style={{ width: 'var(--radix-popover-trigger-width)' }}
                    >
                      <Command>
                        <CommandInput placeholder="Search organizations..." />
                        <CommandList>
                          <CommandEmpty>No organization found.</CommandEmpty>
                          <CommandGroup>
                            {organizations?.map((org) => (
                              <CommandItem
                                key={org.id}
                                value={org.name}
                                onSelect={() => {
                                  field.onChange(org.id);
                                  setOrgPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedOrgId === org.id ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {org.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        ) : (
          <>
            <FieldGroup>
              <Controller
                name="organizationName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      id="customer-form-orgName"
                      placeholder="Enter organization name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </>
        )}
      </Box>
    </form>
  );
}
