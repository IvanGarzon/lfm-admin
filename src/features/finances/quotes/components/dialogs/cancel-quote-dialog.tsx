'use client';

import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { MarkQuoteAsCancelledSchema, type MarkQuoteAsCancelledInput } from '@/schemas/quotes';
import { VALIDATION_LIMITS } from '@/lib/validation';

interface CancelQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: MarkQuoteAsCancelledInput) => void;
  quoteId: string;
  quoteNumber: string;
  isPending?: boolean;
}

export function CancelQuoteDialog({
  open,
  onOpenChange,
  onConfirm,
  quoteId,
  quoteNumber,
  isPending = false,
}: CancelQuoteDialogProps) {
  const form = useForm<MarkQuoteAsCancelledInput>({
    resolver: zodResolver(MarkQuoteAsCancelledSchema),
    defaultValues: {
      id: quoteId,
      cancelReason: '',
    },
  });

  const handleSubmit = useCallback(
    (data: MarkQuoteAsCancelledInput) => {
      onConfirm(data);
      form.reset();
      onOpenChange(false);
    },
    [onConfirm, form, onOpenChange],
  );

  const handleCancel = useCallback(() => {
    form.reset();
    onOpenChange(false);
  }, [form, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Quote</DialogTitle>
          <DialogDescription>
            {quoteNumber
              ? `Cancel quote ${quoteNumber}. This action cannot be undone.`
              : 'Enter the cancellation details below. This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="cancel-quote-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="cancelReason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="cancel-quote-form-cancelReason">Reason</FieldLabel>
                      <span className="text-xs text-muted-foreground">
                        {field.value?.length || 0} / {VALIDATION_LIMITS.REASON_MAX}
                      </span>
                    </FieldContent>
                    <Textarea
                      {...field}
                      id="cancel-quote-form-cancelReason"
                      placeholder="Enter reason for cancelling this quote..."
                      rows={3}
                      className="resize-none"
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
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? 'Cancelling...' : 'Cancel Quote'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
