'use client';

import { useQuery, useMutation, useQueryClient, skipToken } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getRecipes, getRecipeById } from '@/actions/inventory/recipes/queries';
import { createRecipe, updateRecipe, deleteRecipe } from '@/actions/inventory/recipes/mutations';
import type { RecipeFilters, RecipeWithDetails } from '@/features/inventory/recipes/types';
import type { CreateRecipeInput, UpdateRecipeInput } from '@/schemas/recipes';
import { RECIPE_KEYS } from '@/features/inventory/recipes/constants/query-keys';

export function useRecipes(filters: RecipeFilters) {
  return useQuery({
    queryKey: RECIPE_KEYS.list(filters),
    queryFn: async () => {
      const result = await getRecipes(filters);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: RECIPE_KEYS.detail(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getRecipeById(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    staleTime: 30 * 1000
  });
}

export function useAllRecipes(enabled: boolean = true) {
  return useQuery({
    queryKey: [...RECIPE_KEYS.all, 'all'],
    queryFn: enabled
      ? async () => {
          const result = await getRecipes({ perPage: '100' });
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data?.items ?? [];
        }
      : skipToken,
    staleTime: 30 * 1000
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecipeInput) => {
      const result = await createRecipe(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: RECIPE_KEYS.lists() });
      const previousLists = queryClient.getQueriesData({ queryKey: RECIPE_KEYS.lists() });
      return { previousLists };
    },
    onError: (error: Error, _data, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create recipe');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.lists() });
    },
    onSuccess: (data) => {
      toast.success(`Recipe ${data.name} created successfully`);
    }
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateRecipeInput) => {
      const result = await updateRecipe(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: RECIPE_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: RECIPE_KEYS.lists() });

      // Snapshot the previous value
      const previousRecipe = queryClient.getQueryData(RECIPE_KEYS.detail(newData.id));

      // Optimistically update recipe with new data
      queryClient.setQueryData(
        RECIPE_KEYS.detail(newData.id),
        (old: RecipeWithDetails | undefined) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            ...newData
          };
        }
      );

      return { previousRecipe };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRecipe) {
        queryClient.setQueryData(RECIPE_KEYS.detail(newData.id), context.previousRecipe);
      }
      toast.error(err.message || 'Failed to update recipe');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Recipe updated successfully');
    }
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRecipe(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: RECIPE_KEYS.detail(id) });
      await queryClient.cancelQueries({ queryKey: RECIPE_KEYS.lists() });

      // Snapshot the previous values
      const previousRecipe = queryClient.getQueryData(RECIPE_KEYS.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: RECIPE_KEYS.lists() });

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: RECIPE_KEYS.detail(id) });

      // Return context for rollback
      return { previousRecipe, previousLists, id };
    },
    onError: (error: Error, id, context) => {
      // Rollback optimistic update
      if (context?.previousRecipe) {
        queryClient.setQueryData(RECIPE_KEYS.detail(id), context.previousRecipe);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete recipe');
    },
    onSettled: () => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Recipe deleted successfully');
    }
  });
}
