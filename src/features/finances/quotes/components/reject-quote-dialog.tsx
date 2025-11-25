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

import { MarkQuoteAsRejectedSchema, type MarkQuoteAsRejectedInput } from '@/schemas/quotes';

interface RejectQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: MarkQuoteAsRejectedInput) => void;
  quoteId: string;
  quoteNumber: string;
  isPending?: boolean;
}

export function RejectQuoteDialog({
  open,
  onOpenChange,
  onConfirm,
  quoteId,
  quoteNumber,
  isPending = false,
}: RejectQuoteDialogProps) {
  const form = useForm<MarkQuoteAsRejectedInput>({
    resolver: zodResolver(MarkQuoteAsRejectedSchema),
    defaultValues: {
      id: quoteId,
      rejectReason: '',
    },
  });

  const handleSubmit = (data: MarkQuoteAsRejectedInput) => {
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
          <DialogTitle>Reject Quote</DialogTitle>
          <DialogDescription>
            Reject quote {quoteNumber}. Please provide a reason for rejection.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="reject-quote-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FieldGroup>
              <Controller
                name="rejectReason"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex flex-col">
                    <FieldContent>
                      <FieldLabel htmlFor="reject-quote-form-reason">
                        Rejection Reason
                      </FieldLabel>
                    </FieldContent>
                    <Textarea
                      {...field}
                      id="reject-quote-form-reason"
                      placeholder="Enter reason for rejecting this quote..."
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
                {isPending ? 'Rejecting...' : 'Reject Quote'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
