import { Controller, type Control } from 'react-hook-form';

import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerSelect } from '@/components/shared/customer-select';
import type { QuoteFormInput } from '@/features/finances/quotes/types';
import type { CustomerSelectItem } from '@/features/crm/customers/types';

interface QuoteHeaderFieldsProps {
  control: Control<QuoteFormInput>;
  customers: CustomerSelectItem[] | undefined;
  isLoadingCustomers: boolean;
  isLocked: boolean;
  mode: 'create' | 'update';
  quoteNumber?: string;
}

export function QuoteHeaderFields({
  control,
  customers,
  isLoadingCustomers,
  isLocked,
  mode,
  quoteNumber,
}: QuoteHeaderFieldsProps) {
  return (
    <>
      <FieldGroup>
        <Controller
          name="customerId"
          control={control}
          render={({ field, fieldState }) => (
            <Box>
              <CustomerSelect
                customers={customers ?? []}
                value={field.value}
                onValueChange={field.onChange}
                isLoading={isLoadingCustomers}
                disabled={isLoadingCustomers || isLocked}
                label="Quote for"
                showAddCustomerLink={true}
                isLocked={isLocked}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Box>
          )}
        />
      </FieldGroup>

      <Box className="grid grid-cols-2 gap-4">
        {mode === 'update' && quoteNumber ? (
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="form-rhf-quote-number">Quote Number</FieldLabel>
              </FieldContent>
              <Input
                id="form-rhf-quote-number"
                value={quoteNumber}
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
    </>
  );
}
