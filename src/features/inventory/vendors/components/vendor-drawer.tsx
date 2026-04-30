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
import { VendorForm } from '@/features/inventory/vendors/components/vendor-form';
import { VendorDrawerSkeleton } from '@/features/inventory/vendors/components/vendor-drawer-skeleton';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, vendorSearchParamsDefaults } from '@/filters/vendors/vendors-filters';
import {
  useVendor,
  useCreateVendor,
  useUpdateVendor,
} from '@/features/inventory/vendors/hooks/use-vendor-queries';
import type { CreateVendorInput, UpdateVendorInput } from '@/schemas/vendors';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

interface VendorDrawerProps {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}

export function VendorDrawer({ id, open: openProp, onClose }: VendorDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryString = useQueryString(searchParams, vendorSearchParamsDefaults);

  const [isDirty, setIsDirty] = useState(false);

  // Determine if drawer is open (URL-based or prop-based)
  const isOpen = id
    ? (pathname?.includes(`/inventory/vendors/${id}`) ?? false)
    : (openProp ?? false);

  // Mode: create or update
  const mode = id ? 'update' : 'create';

  // Fetch vendor data if editing
  const { data: vendor, isLoading, isError, error } = useVendor(id);

  // Mutations
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();

  // Handle close
  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (id) {
          const basePath = '/inventory/vendors';
          const targetPath = queryString ? `${basePath}?${queryString}` : basePath;
          router.push(targetPath);
        } else {
          onClose?.();
        }
      }
    },
    [id, onClose, router, queryString],
  );

  // Handle create
  const handleCreate = useCallback(
    (data: CreateVendorInput) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsDirty(false);
          handleOpenChange(false);
        },
      });
    },
    [createMutation, handleOpenChange],
  );

  // Handle update
  const handleUpdate = useCallback(
    (data: UpdateVendorInput) => {
      updateMutation.mutate(data, {
        onSuccess: () => {
          setIsDirty(false);
        },
      });
    },
    [updateMutation],
  );

  // Handle dirty state change
  const handleDirtyStateChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  // Use unsaved changes protection
  useUnsavedChanges(isDirty);

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="overflow-x-hidden dark:bg-gray-925 pb-0! w-[90vw]">
        <VisuallyHidden>
          <DrawerDescription>
            {mode === 'create' ? 'Add a new vendor to your system.' : 'Edit an existing vendor.'}
          </DrawerDescription>
        </VisuallyHidden>
        {mode === 'update' && isLoading ? (
          <VendorDrawerSkeleton />
        ) : isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load vendor: {error?.message}</p>
          </Box>
        ) : (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-col flex-1">
                <DrawerTitle>{mode === 'create' ? 'Add Vendor' : 'Edit Vendor'}</DrawerTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  {mode === 'create'
                    ? 'Fill in the information to add a new vendor to your system.'
                    : `Updating vendor: ${vendor?.name ?? id}`}
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
                  <VendorForm
                    vendor={mode === 'update' ? vendor : null}
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
