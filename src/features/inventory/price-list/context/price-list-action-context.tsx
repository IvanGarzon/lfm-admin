'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useDeletePriceListItem } from '@/features/inventory/price-list/hooks/use-price-list-queries';
import { DeletePriceListItemDialog } from '@/features/inventory/price-list/components/delete-price-list-item-dialog';
import { PriceListCostHistory } from '@/features/inventory/price-list/components/price-list-cost-history';

// ============================================================================
// TYPES
// ============================================================================

type ModalType = 'DELETE' | 'COST_HISTORY';

interface ModalState {
  type: ModalType;
  id: string;
  itemName?: string;
  onSuccess?: () => void;
}

interface PriceListActionContextType {
  openDelete: (id: string, itemName?: string, onSuccess?: () => void) => void;
  openCostHistory: (id: string, itemName?: string) => void;
  close: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const PriceListActionContext = createContext<PriceListActionContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function PriceListActionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const deleteMutation = useDeletePriceListItem();

  const openDelete = useCallback((id: string, itemName?: string, onSuccess?: () => void) => {
    setState({ type: 'DELETE', id, itemName, onSuccess });
  }, []);

  const openCostHistory = useCallback((id: string, itemName?: string) => {
    setState({ type: 'COST_HISTORY', id, itemName });
  }, []);

  const close = useCallback(() => {
    setState(null);
  }, []);

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

  const value = useMemo(
    () => ({
      openDelete,
      openCostHistory,
      close,
    }),
    [openDelete, openCostHistory, close],
  );

  return (
    <PriceListActionContext.Provider value={value}>
      {children}

      {/* Delete Dialog */}
      <DeletePriceListItemDialog
        open={state?.type === 'DELETE'}
        onOpenChange={(open: boolean) => !open && close()}
        onConfirm={handleConfirmDelete}
        itemName={state?.itemName}
        isPending={deleteMutation.isPending}
      />

      {/* Cost History Dialog */}
      <PriceListCostHistory
        open={state?.type === 'COST_HISTORY'}
        onOpenChange={(open: boolean) => !open && close()}
        itemId={state?.type === 'COST_HISTORY' ? state.id : undefined}
        itemName={state?.itemName}
      />
    </PriceListActionContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function usePriceListActions() {
  const context = useContext(PriceListActionContext);
  if (context === undefined) {
    throw new Error('usePriceListActions must be used within a PriceListActionProvider');
  }
  return context;
}
