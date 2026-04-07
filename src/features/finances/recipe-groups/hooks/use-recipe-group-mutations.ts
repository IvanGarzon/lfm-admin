import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createRecipeGroup,
  updateRecipeGroup,
  deleteRecipeGroup,
} from '@/actions/finances/recipe-groups/mutations';
import type { CreateRecipeGroupInput, UpdateRecipeGroupInput } from '@/schemas/recipe-groups';

export function useCreateRecipeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeGroupInput) => createRecipeGroup(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Recipe group created successfully');
        queryClient.invalidateQueries({ queryKey: ['recipe-groups'] });
      } else {
        toast.error(result.error || 'Failed to create recipe group');
      }
    },
    onError: () => {
      toast.error('Failed to create recipe group');
    },
  });
}

export function useUpdateRecipeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipeGroupInput }) =>
      updateRecipeGroup({ id, data }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Recipe group updated successfully');
        queryClient.invalidateQueries({ queryKey: ['recipe-groups'] });
      } else {
        toast.error(result.error || 'Failed to update recipe group');
      }
    },
    onError: () => {
      toast.error('Failed to update recipe group');
    },
  });
}

export function useDeleteRecipeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRecipeGroup(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Recipe group deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['recipe-groups'] });
      } else {
        toast.error(result.error || 'Failed to delete recipe group');
      }
    },
    onError: () => {
      toast.error('Failed to delete recipe group');
    },
  });
}
