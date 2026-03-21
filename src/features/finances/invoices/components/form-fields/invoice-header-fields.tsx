'use client';

import { Control, Controller } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CustomerSelect } from '@/components/shared/customer-select';

import type { InvoiceFormInput, InvoiceMetadata } from '@/features/finances/invoices/types';
import type { CustomerSelectItem } from '@/features/crm/customers/types';

interface InvoiceHeaderFieldsProps {
  control: Control<InvoiceFormInput>;
  mode: 'create' | 'update';
  invoice?: InvoiceMetadata | null;
  customers: CustomerSelectItem[];
  isLoadingCustomers: boolean;
  isLocked: boolean;
}

export function InvoiceHeaderFields({
  control,
  mode,
  invoice,
  customers,
  isLoadingCustomers,
  isLocked,
}: InvoiceHeaderFieldsProps) {
  return (
    <>
      {/* Customer Selection */}
      <FieldGroup>
        <Controller
          name="customerId"
          control={control}
          render={({ field, fieldState }) => (
            <Box>
              <CustomerSelect
                customers={customers}
                value={field.value}
                onValueChange={field.onChange}
                isLoading={isLoadingCustomers}
                disabled={isLoadingCustomers || isLocked}
                label="Bill to"
                showAddCustomerLink={true}
                isLocked={isLocked}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Box>
          )}
        />
      </FieldGroup>

      {/* Invoice Number (Read-only when editing) & Currency */}
      <Box className="grid grid-cols-2 gap-4">
        {mode === 'update' && invoice?.invoiceNumber ? (
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-invoice-number">Invoice Number</FieldLabel>
              </FieldContent>
              <Input
                id="form-rhf-invoice-number"
                value={invoice.invoiceNumber}
                disabled
                readOnly
                className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
              />
            </Field>
          </FieldGroup>
        ) : null}

        <FieldGroup className={mode === 'create' ? 'col-span-2' : ''}>
          <Controller
            name="currency"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="form-rhf-currency">Currency</FieldLabel>
                </FieldContent>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLocked}>
                  <SelectTrigger id="form-rhf-select-currency" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>
      </Box>

      {/* Dates */}
      <Box className="grid grid-cols-2 gap-4">
        <FieldGroup>
          <Controller
            name="issuedDate"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="form-rhf-issued-date">Issued Date</FieldLabel>
                </FieldContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      type="button"
                      disabled={isLocked}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="dueDate"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldContent>
                  <FieldLabel htmlFor="form-rhf-due-date">Due Date</FieldLabel>
                </FieldContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      type="button"
                      disabled={isLocked}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FieldGroup>
      </Box>
    </>
  );
}
