'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { TransactionForm } from './transaction-form';
import {
  useCreateTransaction,
  useUpdateTransaction,
  useTransaction,
} from '../hooks/use-transaction-queries';
import type { CreateTransactionInput, UpdateTransactionInput } from '@/schemas/transactions';
import { Loader2, X } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { useTransactionQueryString } from '../hooks/use-transaction-query-string';
import {
  searchParams,
  transactionSearchParamsDefaults,
} from '@/filters/transactions/transactions-filters';

export function TransactionDrawer({
  id,
  open,
  onClose,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const { data: transaction, isLoading, error, isError } = useTransaction(id);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const router = useRouter();
  const pathname = usePathname();
  const queryString = useTransactionQueryString(searchParams, transactionSearchParamsDefaults);

  const mode = id ? 'edit' : 'create';
  const isOpen = id ? (pathname?.includes(`/transactions/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (id && pathname?.includes(`/transactions/${id}`)) {
          // Navigate back to list preserving filters
          const basePath = '/finances/transactions';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        } else {
          onClose?.();
        }
      }
    },
    [id, pathname, onClose, router, queryString],
  );

  const handleCreate = useCallback(
    (data: CreateTransactionInput) => {
      createTransaction.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [createTransaction, onClose],
  );

  const handleUpdate = useCallback(
    (data: UpdateTransactionInput) => {
      updateTransaction.mutate(data, {
        onSuccess: () => {
          onClose?.();
        },
      });
    },
    [updateTransaction, onClose],
  );

  return (
    <Drawer key={id} open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0! w-[90vw]">
        {/* {isLoading ? <InvoiceDrawerSkeleton /> : null} */}

        {isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load transaction details: {error?.message}</p>
          </Box>
        ) : null}

        {/* <DrawerHeader> */}
        <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
          <Box className="mt-1 flex flex-col flex-1">
            <DrawerTitle>{mode === 'create' ? 'New Transaction' : 'Edit Transaction'}</DrawerTitle>
            <DrawerDescription>
              {mode === 'create'
                ? 'Create a new income or expense transaction.'
                : 'Update the transaction details below.'}
            </DrawerDescription>
          </Box>
          <Button
            variant="ghost"
            className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
            onClick={() => handleOpenChange(false)}
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Button>
        </Box>

        <DrawerBody className="py-0! -mx-6 h-full overflow-y-auto">
          <Box className="flex h-full">
            <Box className="overflow-y-auto w-full">
              {isLoading && mode === 'edit' ? (
                <Box className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading transaction...</span>
                </Box>
              ) : (
                <TransactionForm
                  transaction={transaction ?? null}
                  onCreate={handleCreate}
                  onUpdate={handleUpdate}
                  isCreating={createTransaction.isPending}
                  isUpdating={updateTransaction.isPending}
                  onClose={onClose}
                />
              )}
            </Box>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
