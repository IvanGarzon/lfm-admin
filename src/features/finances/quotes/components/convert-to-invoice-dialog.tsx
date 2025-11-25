'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Percent, DollarSign } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from '@/components/ui/input-group';

import { ConvertQuoteToInvoiceSchema, type ConvertQuoteToInvoiceInput } from '@/schemas/quotes';

interface ConvertToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ConvertQuoteToInvoiceInput) => void;
  quoteId: string;
  quoteNumber: string;
  quoteGst?: number;
  quoteDiscount?: number;
  isPending?: boolean;
}

export function ConvertToInvoiceDialog({
  open,
  onOpenChange,
  onConfirm,
  quoteId,
  quoteNumber,
  quoteGst = 10,
  quoteDiscount = 0,
  isPending = false,
}: ConvertToInvoiceDialogProps) {
  const form = useForm<ConvertQuoteToInvoiceInput>({
    resolver: zodResolver(ConvertQuoteToInvoiceSchema),
    defaultValues: {
      id: quoteId,
      dueDate: addDays(new Date(), 30), // 30 days from now
      gst: quoteGst,
      discount: quoteDiscount,
    },
  });

  const handleSubmit = (data: ConvertQuoteToInvoiceInput) => {
    onConfirm(data);
    form.reset();
    onOpenChange(false);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convert Quote to Invoice</DialogTitle>
          <DialogDescription>
            Convert quote {quoteNumber} to an invoice. Set the invoice due date and adjust GST or
            discount if needed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="convert-to-invoice-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Due Date Field */}
            <FieldGroup>
              <Controller
                name="dueDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="convert-to-invoice-form-due-date">Due Date</FieldLabel>
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
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* GST Field */}
            <FieldGroup>
              <Controller
                name="gst"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="convert-to-invoice-form-gst">GST (%)</FieldLabel>
                    </FieldContent>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>
                          <Percent className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id="convert-to-invoice-form-gst"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="Enter GST percentage"
                      />
                    </InputGroup>
                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Discount Field */}
            <FieldGroup>
              <Controller
                name="discount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="convert-to-invoice-form-discount">
                        Discount (Optional)
                      </FieldLabel>
                    </FieldContent>
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>
                          <DollarSign className="h-4 w-4" />
                        </InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        id="convert-to-invoice-form-discount"
                        type="number"
                        step="1"
                        min="0"
                        value={isNaN(field.value) ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber;
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        placeholder="Enter discount amount"
                      />
                    </InputGroup>
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
                {isPending ? 'Converting...' : 'Convert to Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
