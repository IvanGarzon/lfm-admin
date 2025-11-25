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

import { MarkQuoteAsOnHoldSchema, type MarkQuoteAsOnHoldInput } from '@/schemas/quotes';

interface OnHoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: MarkQuoteAsOnHoldInput) => void;
  quoteId: string;
  quoteNumber: string;
  isPending?: boolean;
}

export function OnHoldDialog({
  open,
  onOpenChange,
  onConfirm,
  quoteId,
  quoteNumber,
  isPending = false,
}: OnHoldDialogProps) {
  const form = useForm<MarkQuoteAsOnHoldInput>({
    resolver: zodResolver(MarkQuoteAsOnHoldSchema),
    defaultValues: {
      id: quoteId,
      reason: '',
    },
  });

  const handleSubmit = (data: MarkQuoteAsOnHoldInput) => {
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
          <DialogTitle>Put Quote on Hold</DialogTitle>
          <DialogDescription>
            Put quote {quoteNumber} on hold. Optionally provide a reason.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="on-hold-form"
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
                      <FieldLabel htmlFor="on-hold-form-reason">
                        Reason (Optional)
                      </FieldLabel>
                    </FieldContent>
                    <Textarea
                      {...field}
                      id="on-hold-form-reason"
                      placeholder="Enter reason for putting this quote on hold..."
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
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Putting on Hold...' : 'Put on Hold'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
