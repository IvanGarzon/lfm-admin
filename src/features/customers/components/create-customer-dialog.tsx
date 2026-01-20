'use client';

import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Box } from '@/components/ui/box';

import type { CreateCustomerInput } from '@/schemas/customers';
import { useCreateCustomer } from '@/features/customers/hooks/use-customer-queries';
import { CustomerForm } from './customer-form';

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (customerId: string) => void;
}) {
  const createCustomer = useCreateCustomer();

  const handleCreate = useCallback(
    (data: CreateCustomerInput) => {
      createCustomer.mutate(data, {
        onSuccess: (result) => {
          onOpenChange(false);
          onCreate?.(result.id);
        },
      });
    },
    [createCustomer, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer. Required fields are marked with (*).
          </DialogDescription>
        </DialogHeader>
        <Box className="max-h-[80vh] overflow-y-auto">
          <CustomerForm onCreate={handleCreate} isCreating={createCustomer.isPending} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
