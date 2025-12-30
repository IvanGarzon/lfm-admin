'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';

import { RecordPaymentSchema, type RecordPaymentInput } from '@/schemas/invoices';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: RecordPaymentInput) => void;
  invoiceId: string;
  invoiceNumber: string;
  amountDue: number;
  invoiceTotal: number;
  isPending?: boolean;
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

export function RecordPaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  invoiceId,
  invoiceNumber,
  amountDue,
  invoiceTotal,
  isPending = false,
}: RecordPaymentDialogProps) {
  const form = useForm<RecordPaymentInput>({
    resolver: zodResolver(RecordPaymentSchema),
    defaultValues: {
      id: invoiceId,
      amount: amountDue,
      paidDate: new Date(),
      paymentMethod: 'Bank Transfer',
      notes: '',
    },
  });

  // Sync form with amountDue when it changes (initial fetch completion)
  useEffect(() => {
    if (!form.formState.isDirty && amountDue > 0) {
      form.setValue('amount', amountDue);
    }
  }, [amountDue, form]);

  const handleSubmit = (data: RecordPaymentInput) => {
    onConfirm(data);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const setPercentageAmount = (percentage: number) => {
    const amount = (amountDue * percentage) / 100;
    form.setValue('amount', Number(amount.toFixed(2)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice <strong>{invoiceNumber}</strong>.
            <br />
            <span className="flex items-center gap-4 mt-2">
              <span>
                Total: <strong>{formatCurrency({ number: invoiceTotal })}</strong>
              </span>
              {amountDue !== invoiceTotal ? (
                <span>
                  Balance: <strong>{formatCurrency({ number: amountDue })}</strong>
                </span>
              ) : null}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="record-payment-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <Box className="flex items-center justify-between">
                        <FieldLabel htmlFor="record-payment-form-amount">Amount</FieldLabel>
                        <Box className="flex items-center gap-2">
                          {[25, 50, 75, 100].map((percentage) => (
                            <Button
                              key={percentage}
                              type="button"
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => setPercentageAmount(percentage)}
                            >
                              {percentage}%
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    </FieldContent>
                    <Input
                      id="record-payment-form-amount"
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
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="record-payment-form-paid-date">Payment Date</FieldLabel>
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
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          autoFocus
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
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="record-payment-form-payment-method">
                        Payment Method
                      </FieldLabel>
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
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="record-payment-form-notes">Notes (Optional)</FieldLabel>
                    </FieldContent>
                    <Textarea
                      id="record-payment-form-notes"
                      placeholder="Additional notes about this payment..."
                      className="resize-none"
                      {...field}
                    />
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
