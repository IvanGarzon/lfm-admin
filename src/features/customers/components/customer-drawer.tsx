'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Save, AlertCircle } from 'lucide-react';
import { Box } from '@/components/ui/box';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  useCustomer,
  useUpdateCustomer,
  useCreateCustomer,
} from '@/features/customers/hooks/use-customer-queries';
import { CustomerForm } from './customer-form';
import { useCustomerQueryString } from '@/features/customers/hooks/use-customer-query-string';
import { searchParams, customerSearchParamsDefaults } from '@/filters/customers/customers-filters';
import type { CreateCustomerInput, UpdateCustomerInput } from '@/schemas/customers';

type DrawerMode = 'edit' | 'create';

export function CustomerDrawer({
  id,
  open,
  onClose,
}: {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const { data: customer, isLoading, error, isError } = useCustomer(id);

  const updateCustomer = useUpdateCustomer();
  const createCustomer = useCreateCustomer();

  const queryString = useCustomerQueryString(searchParams, customerSearchParamsDefaults);

  const mode: DrawerMode = id ? 'edit' : 'create';
  const isOpen = id ? (pathname?.includes(`/customers/${id}`) ?? false) : (open ?? false);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (id) {
          const basePath = '/customers';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        } else {
          onClose?.();
        }
      }
    },
    [id, onClose, router, queryString],
  );

  const handleCreate = useCallback(
    (data: CreateCustomerInput) => {
      createCustomer.mutate(data, {
        onSuccess: () => {
          onClose?.();
          // router.refresh();
        },
      });
    },
    [createCustomer, onClose, router],
  );

  const handleUpdate = useCallback(
    (data: UpdateCustomerInput) => {
      updateCustomer.mutate(data, {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          // router.refresh();
        },
      });
    },
    [updateCustomer, router],
  );

  const getDrawerHeader = () => {
    if (mode === 'create') {
      return {
        title: 'New Customer',
        status: null,
      };
    }

    return {
      title: 'Update Customer',
      status: customer?.status ?? null,
    };
  };

  const { title, status } = getDrawerHeader();

  return (
    <Drawer key={id} open={isOpen} modal={true} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0!">
        {isLoading ? <div>Loading...</div> : null}

        {isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load customer details: {error?.message}</p>
          </Box>
        ) : null}

        {(customer && !isLoading && !isError) || mode === 'create' ? (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-col flex-1">
                <Box className="flex items-center gap-2">
                  <DrawerTitle>{title}</DrawerTitle>
                  {mode === 'edit' && hasUnsavedChanges ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                      <AlertCircle className="h-3 w-3" />
                      Unsaved changes
                    </span>
                  ) : null}
                </Box>
                {status ? (
                  <DrawerDescription>
                    {/* <InvoiceStatusBadge status={status} /> */}
                    {status}
                  </DrawerDescription>
                ) : null}
              </Box>

              <Box className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="aspect-square p-1 text-gray-500 hover:bg-gray-100 hover:dark:bg-gray-400/10"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="size-5" aria-hidden="true" />
                  <span className="sr-only">Close</span>
                </Button>
              </Box>
            </Box>

            <DrawerBody className="py-0! -mx-6 h-full overflow-y-auto">
              <Box className="flex h-full">
                <Box className="h-full w-full">
                  {mode === 'create' ? (
                    <CustomerForm
                      customer={customer}
                      onCreate={handleCreate}
                      isCreating={createCustomer.isPending}
                    />
                  ) : (
                    <CustomerForm
                      customer={customer}
                      onUpdate={handleUpdate}
                      isUpdating={updateCustomer.isPending}
                      onDirtyStateChange={setHasUnsavedChanges}
                    />
                  )}
                </Box>
              </Box>
            </DrawerBody>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
