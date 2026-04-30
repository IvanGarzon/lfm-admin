'use client';

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { PriceListForm } from '@/features/inventory/price-list/components/price-list-form';
import { PriceListDrawerSkeleton } from '@/features/inventory/price-list/components/price-list-drawer-skeleton';
import { useQueryString } from '@/hooks/use-query-string';
import {
  searchParams,
  priceListSearchParamsDefaults,
} from '@/filters/price-list/price-list-filters';
import {
  usePriceListItem,
  useCreatePriceListItem,
  useUpdatePriceListItem,
} from '@/features/inventory/price-list/hooks/use-price-list-queries';
import type { CreatePriceListItemInput, UpdatePriceListItemInput } from '@/schemas/price-list';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

interface PriceListDrawerProps {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}

export function PriceListDrawer({ id, open: openProp, onClose }: PriceListDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryString = useQueryString(searchParams, priceListSearchParamsDefaults);

  const [isDirty, setIsDirty] = useState(false);

  const isOpen = id
    ? (pathname?.includes(`/inventory/price-list/${id}`) ?? false)
    : (openProp ?? false);

  const mode = id ? 'update' : 'create';

  const { data: item, isLoading, isError, error } = usePriceListItem(id);

  const createMutation = useCreatePriceListItem();
  const updateMutation = useUpdatePriceListItem();

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (id) {
          const basePath = '/inventory/price-list';
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
    (data: CreatePriceListItemInput) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsDirty(false);
          handleOpenChange(false);
        },
      });
    },
    [createMutation, handleOpenChange],
  );

  const handleUpdate = useCallback(
    (data: UpdatePriceListItemInput) => {
      updateMutation.mutate(data, {
        onSuccess: () => {
          setIsDirty(false);
        },
      });
    },
    [updateMutation],
  );

  const handleDirtyStateChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  useUnsavedChanges(isDirty);

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0! w-[90vw]">
        <VisuallyHidden>
          <DrawerDescription>
            {mode === 'create'
              ? 'Add a new item to your price list.'
              : 'Edit an existing price list item.'}
          </DrawerDescription>
        </VisuallyHidden>
        {mode === 'update' && isLoading ? (
          <PriceListDrawerSkeleton />
        ) : isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load item: {error?.message}</p>
          </Box>
        ) : (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-col flex-1">
                <DrawerTitle>{mode === 'create' ? 'Add Item' : 'Edit Item'}</DrawerTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  {mode === 'create'
                    ? 'Fill in the information to add a new item to your price list.'
                    : `Updating item: ${item?.name ?? id}`}
                </div>
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
                  <PriceListForm
                    item={mode === 'update' ? item : null}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                    isCreating={createMutation.isPending}
                    isUpdating={updateMutation.isPending}
                    onDirtyStateChange={handleDirtyStateChange}
                    onClose={() => handleOpenChange(false)}
                  />
                </Box>
              </Box>
            </DrawerBody>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
