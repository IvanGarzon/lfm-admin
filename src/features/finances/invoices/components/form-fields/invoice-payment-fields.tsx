'use client';

import { Control, Controller } from 'react-hook-form';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';

import type { RecordPaymentInput } from '@/schemas/invoices';

interface InvoicePaymentFieldsProps {
  control: Control<RecordPaymentInput>;
  amountDue?: number;
  invoiceTotal?: number;
  showPercentageButtons?: boolean;
  onPercentageClick?: (percentage: number) => void;
}

const PAYMENT_METHODS = [
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Credit Card', label: 'Credit Card' },
  { value: 'Debit Card', label: 'Debit Card' },
  { value: 'Check', label: 'Check' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Other', label: 'Other' },
];

export function InvoicePaymentFields({
  control,
  showPercentageButtons = false,
  onPercentageClick,
}: InvoicePaymentFieldsProps) {
  return (
    <>
      <FieldGroup>
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="flex flex-col">
              <FieldContent>
                <Box className="flex items-center justify-between">
                  <FieldLabel htmlFor="payment-field-amount">Amount</FieldLabel>
                  {showPercentageButtons && onPercentageClick ? (
                    <Box className="flex items-center gap-2">
                      {[25, 50, 75, 100].map((percentage) => (
                        <Button
                          key={percentage}
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => onPercentageClick(percentage)}
                        >
                          {percentage}%
                        </Button>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              </FieldContent>
              <Input
                id="payment-field-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="paidDate"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="flex flex-col">
              <FieldContent>
                <FieldLabel htmlFor="payment-field-paid-date">Payment Date</FieldLabel>
              </FieldContent>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="flex flex-col">
              <FieldContent>
                <FieldLabel htmlFor="payment-field-payment-method">Payment Method</FieldLabel>
              </FieldContent>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
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
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="flex flex-col">
              <FieldContent>
                <FieldLabel htmlFor="payment-field-notes">Notes (Optional)</FieldLabel>
              </FieldContent>
              <Textarea
                id="payment-field-notes"
                placeholder="Additional notes about this payment..."
                className="resize-none"
                {...field}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>
    </>
  );
}
