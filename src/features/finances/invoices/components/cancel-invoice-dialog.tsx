'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { CancelInvoiceSchema, type CancelInvoiceInput } from '@/schemas/invoices';

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CancelInvoiceInput) => void;
  invoiceId: string;
  invoiceNumber?: string;
  isPending?: boolean;
}

export function CancelInvoiceDialog({
  open,
  onOpenChange,
  onConfirm,
  invoiceId,
  invoiceNumber,
  isPending = false,
}: CancelInvoiceDialogProps) {
  const form = useForm<CancelInvoiceInput>({
    resolver: zodResolver(CancelInvoiceSchema),
    defaultValues: {
      id: invoiceId,
      cancelledDate: new Date(),
      cancelReason: '',
    },
  });

  const handleSubmit = (data: CancelInvoiceInput) => {
    onConfirm(data);
    form.reset({ id: invoiceId, cancelledDate: new Date(), cancelReason: '' });
    onOpenChange(false);
  };

  const handleError = (errors: unknown) => {
    // Form validation errors are already displayed via form.formState.errors
    // No need to log them separately
  };

  const handleCancel = () => {
    form.reset({ id: invoiceId, cancelledDate: new Date(), cancelReason: '' });
    onOpenChange(false);
  };

  const cancelReason = form.watch('cancelReason');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Invoice</DialogTitle>
          <DialogDescription>
            {invoiceNumber
              ? `Cancel invoice ${invoiceNumber}. This action cannot be undone.`
              : 'Enter the cancellation details below. This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="cancel-invoice-form"
            onSubmit={form.handleSubmit(handleSubmit, handleError)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="cancelledDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="cancel-invoice-form-cancelled-date">
                        Cancellation Date
                      </FieldLabel>
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

            <FieldGroup>
              <Controller
                name="cancelReason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="cancel-invoice-form-cancelled-reason">
                        Cancellation Reason
                      </FieldLabel>
                    </FieldContent>

                    <Textarea
                      placeholder="Please provide a reason for cancelling this invoice"
                      className="resize-none"
                      rows={4}
                      maxLength={500}
                      {...field}
                    />

                    <p className="text-xs text-muted-foreground">
                      {cancelReason?.length || 0}/500 characters
                    </p>

                    {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                  </Field>
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Go Back
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? 'Cancelling...' : 'Cancel Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
