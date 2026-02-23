'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  useDeleteVendor,
  useUpdateVendorStatus,
} from '@/features/inventory/vendors/hooks/use-vendor-queries';
import { DeleteVendorDialog } from '@/features/inventory/vendors/components/delete-vendor-dialog';
import type { VendorStatus } from '@/prisma/client';

// ============================================================================
// TYPES
// ============================================================================

type ModalType = 'DELETE' | 'UPDATE_STATUS';

interface ModalState {
  type: ModalType;
  id: string;
  vendorName?: string;
  vendorCode?: string;
  status?: VendorStatus;
  onSuccess?: () => void;
}

interface VendorActionContextType {
  openDelete: (
    id: string,
    vendorCode?: string,
    vendorName?: string,
    onSuccess?: () => void,
  ) => void;
  openUpdateStatus: (id: string, status: VendorStatus, onSuccess?: () => void) => void;
  close: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const VendorActionContext = createContext<VendorActionContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function VendorActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const deleteMutation = useDeleteVendor();
  const updateStatusMutation = useUpdateVendorStatus();

  // Open delete dialog
  const openDelete = useCallback(
    (id: string, vendorCode?: string, vendorName?: string, onSuccess?: () => void) => {
      setState({ type: 'DELETE', id, vendorCode, vendorName, onSuccess });
    },
    [],
  );

  // Open status update (used for quick status changes)
  const openUpdateStatus = useCallback(
    (id: string, status: VendorStatus, onSuccess?: () => void) => {
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
    <VendorActionContext.Provider value={value}>
      {children}

      {/* Delete Vendor Dialog */}
      <DeleteVendorDialog
        open={state?.type === 'DELETE'}
        onOpenChange={(open: boolean) => !open && close()}
        onConfirm={handleConfirmDelete}
        vendorCode={state?.vendorCode}
        vendorName={state?.vendorName}
        isPending={deleteMutation.isPending}
      />
    </VendorActionContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useVendorActions() {
  const context = useContext(VendorActionContext);
  if (context === undefined) {
    throw new Error('useVendorActions must be used within a VendorActionProvider');
  }
  return context;
}
