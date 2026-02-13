'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  useDeleteProduct,
  useUpdateProductStatus,
} from '@/features/inventory/products/hooks/use-products-queries';
import { DeleteProductDialog } from '@/features/inventory/products/components/delete-product-dialog';
import type { ProductStatus } from '@/prisma/client';

// ============================================================================
// TYPES
// ============================================================================

type ModalType = 'DELETE' | 'UPDATE_STATUS';

interface ModalState {
  type: ModalType;
  id: string;
  productName?: string;
  status?: ProductStatus;
  onSuccess?: () => void;
}

interface ProductActionContextType {
  openDelete: (id: string, productName?: string, onSuccess?: () => void) => void;
  openUpdateStatus: (id: string, status: ProductStatus, onSuccess?: () => void) => void;
  close: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ProductActionContext = createContext<ProductActionContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function ProductActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const deleteMutation = useDeleteProduct();
  const updateStatusMutation = useUpdateProductStatus();

  // Open delete dialog
  const openDelete = useCallback((id: string, productName?: string, onSuccess?: () => void) => {
    setState({ type: 'DELETE', id, productName, onSuccess });
  }, []);

  // Open status update (used for quick status changes)
  const openUpdateStatus = useCallback(
    (id: string, status: ProductStatus, onSuccess?: () => void) => {
      setState({ type: 'UPDATE_STATUS', id, status, onSuccess });
    },
    [],
  );

  // Close any open modal
  const close = useCallback(() => {
    setState(null);
  }, []);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(() => {
    if (state?.type === 'DELETE' && state.id) {
      deleteMutation.mutate(state.id, {
        onSuccess: () => {
          close();
          state.onSuccess?.();
        },
      });
    }
  }, [state, deleteMutation, close]);

  // Context value
  const value = useMemo(
    () => ({
      openDelete,
      openUpdateStatus,
      close,
    }),
    [openDelete, openUpdateStatus, close],
  );

  return (
    <ProductActionContext.Provider value={value}>
      {children}

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        open={state?.type === 'DELETE'}
        onOpenChange={(open: boolean) => !open && close()}
        onConfirm={handleConfirmDelete}
        productName={state?.productName}
        isPending={deleteMutation.isPending}
      />
    </ProductActionContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useProductActions() {
  const context = useContext(ProductActionContext);
  if (context === undefined) {
    throw new Error('useProductActions must be used within a ProductActionProvider');
  }
  return context;
}
