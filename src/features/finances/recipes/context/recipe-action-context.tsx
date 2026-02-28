'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDeleteRecipe } from '@/features/finances/recipes/hooks/use-recipe-queries';
import { DeleteRecipeDialog } from '@/features/finances/recipes/components/delete-recipe-dialog';

type ModalType = 'DELETE';

interface ModalState {
  type: ModalType;
  id: string;
  name?: string;
  onSuccess?: () => void;
}

interface RecipeActionContextType {
  openDelete: (id: string, name?: string, onSuccess?: () => void) => void;
  openEdit: (id: string) => void;
  openView: (id: string) => void;
  close: () => void;
}

const RecipeActionContext = createContext<RecipeActionContextType | undefined>(undefined);

export function RecipeActionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<ModalState | null>(null);

  const deleteRecipe = useDeleteRecipe();

  const openDelete = useCallback((id: string, name?: string, onSuccess?: () => void) => {
    setState({ type: 'DELETE', id, name, onSuccess });
  }, []);

  const openEdit = useCallback(
    (id: string) => {
      router.push(`/finances/recipes/${id}/edit`);
    },
    [router],
  );

  const openView = useCallback(
    (id: string) => {
      router.push(`/finances/recipes/${id}`);
    },
    [router],
  );

  const close = useCallback(() => {
    setState(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!state?.id) {
      return;
    }

    deleteRecipe.mutate(state.id, {
      onSuccess: () => {
        close();
        state?.onSuccess?.();
      },
    });
  }, [state, deleteRecipe, close]);

  const value = useMemo(
    () => ({
      openDelete,
      openEdit,
      openView,
      close,
    }),
    [openDelete, openEdit, openView, close],
  );

  return (
    <RecipeActionContext.Provider value={value}>
      {children}

      {state?.type === 'DELETE' && state.id && (
        <DeleteRecipeDialog
          open={true}
          onOpenChange={(open) => !open && close()}
          onConfirm={handleConfirmDelete}
          name={state.name}
          isPending={deleteRecipe.isPending}
        />
      )}
    </RecipeActionContext.Provider>
  );
}

export function useRecipeActions() {
  const context = useContext(RecipeActionContext);
  if (context === undefined) {
    throw new Error('useRecipeActions must be used within a RecipeActionProvider');
  }
  return context;
}
