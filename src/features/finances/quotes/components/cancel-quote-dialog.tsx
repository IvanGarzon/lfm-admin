'use client';

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
      reason: '',
    },
  });

  const handleSubmit = (data: MarkQuoteAsCancelledInput) => {
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
          <DialogTitle>Cancel Quote</DialogTitle>
          <DialogDescription>
            Cancel quote {quoteNumber}. Optionally provide a reason for cancellation.
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
                name="reason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="cancel-quote-form-reason">
                        Reason (Optional)
                      </FieldLabel>
                    </FieldContent>
                    <Textarea
                      {...field}
                      id="cancel-quote-form-reason"
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
