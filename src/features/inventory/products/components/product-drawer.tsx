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
import { ProductForm } from '@/features/inventory/products/components/product-form';
import { ProductDrawerSkeleton } from '@/features/inventory/products/components/product-drawer-skeleton';
import { useQueryString } from '@/hooks/use-query-string';
import { searchParams, productSearchParamsDefaults } from '@/filters/products/products-filters';
import {
  useProduct,
  useCreateProduct,
  useUpdateProduct,
} from '@/features/inventory/products/hooks/use-products-queries';
import type { CreateProductInput, UpdateProductInput } from '@/schemas/products';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

interface ProductDrawerProps {
  id?: string;
  open?: boolean;
  onClose?: () => void;
}

export function ProductDrawer({ id, open: openProp, onClose }: ProductDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryString = useQueryString(searchParams, productSearchParamsDefaults);

  const [isDirty, setIsDirty] = useState(false);

  // Determine if drawer is open (URL-based or prop-based)
  const isOpen = id
    ? (pathname?.includes(`/inventory/products/${id}`) ?? false)
    : (openProp ?? false);

  // Mode: create or update
  const mode = id ? 'update' : 'create';

  // Fetch product data if editing
  const { data: product, isLoading, isError, error } = useProduct(id);

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Handle close
  const handleOpenChange = useCallback(
    (openState: boolean) => {
      if (!openState) {
        if (id) {
          const basePath = '/inventory/products';
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
    (data: CreateProductInput) => {
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
    (data: UpdateProductInput) => {
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
            {mode === 'create'
              ? 'Add a new product to your inventory.'
              : 'Edit the selected product.'}
          </DrawerDescription>
        </VisuallyHidden>
        {mode === 'update' && isLoading ? (
          <ProductDrawerSkeleton />
        ) : isError ? (
          <Box className="p-6 text-destructive">
            <DrawerHeader>
              <DrawerTitle>Error</DrawerTitle>
            </DrawerHeader>
            <p className="mt-4">Could not load product: {error?.message}</p>
          </Box>
        ) : (
          <>
            <Box className="-mx-6 flex items-center justify-between gap-x-4 border-b border-gray-200 px-6 pb-4 dark:border-gray-900">
              <Box className="mt-1 flex flex-col flex-1">
                <DrawerTitle>{mode === 'create' ? 'Add Product' : 'Edit Product'}</DrawerTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  {mode === 'create'
                    ? 'Fill in the information to add a new product to your inventory.'
                    : `Updating product: ${product?.name ?? id}`}
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
                  <ProductForm
                    product={mode === 'update' ? product : null}
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
