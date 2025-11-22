'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { CreateCustomerSchema, type CreateCustomerInput } from '@/schemas/customers';
import { useCreateCustomer } from '@/features/customers/hooks/useCustomersQueries';
import { CustomerForm } from './customer-form';

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customerId: string) => void;
}

export function CreateCustomerDialog({ open, onOpenChange, onSuccess }: CreateCustomerDialogProps) {
  const { mutate: createCustomer, isPending } = useCreateCustomer();

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: 'MALE',
      organizationId: undefined,
      organizationName: '',
    },
  });

  const onSubmit = useCallback(
    (data: CreateCustomerInput) => {
      createCustomer(data, {
        onSuccess: (customer) => {
          toast.success('Customer created successfully');
          form.reset();
          onOpenChange(false);
          onSuccess?.(customer.id);
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to create customer');
        },
      });
    },
    [createCustomer, form, onOpenChange, onSuccess],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Manually trigger form submission
      form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer. Required fields are marked with (
            <span className="text-destructive">*</span>).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <div onSubmit={handleSubmit}>
            <CustomerForm onSubmit={onSubmit} form={form} />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit(onSubmit)();
                }}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Customer
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
