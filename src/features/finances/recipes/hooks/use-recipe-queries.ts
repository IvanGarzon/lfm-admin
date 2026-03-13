'use client';

import { useQuery, useMutation, useQueryClient, skipToken } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getRecipes, getRecipeById } from '@/actions/finances/recipes/queries';
import { createRecipe, updateRecipe, deleteRecipe } from '@/actions/finances/recipes/mutations';
import type { RecipeFilters, RecipeWithDetails } from '@/features/finances/recipes/types';
import type { CreateRecipeInput, UpdateRecipeInput } from '@/schemas/recipes';

export const RECIPE_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_KEYS.all, 'list'] as const,
  list: (filters: RecipeFilters) => [...RECIPE_KEYS.lists(), { filters }] as const,
  details: () => [...RECIPE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_KEYS.details(), id] as const,
};

export function useRecipes(filters: RecipeFilters) {
  return useQuery({
    queryKey: RECIPE_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) {
        searchParams.search = filters.search;
      }

      if (filters.page) {
        searchParams.page = String(filters.page);
      }

      if (filters.perPage) {
        searchParams.perPage = String(filters.perPage);
      }

      if (filters.sort) {
        searchParams.sort = JSON.stringify(filters.sort);
      }

      const result = await getRecipes(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: RECIPE_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Recipe ID is required');
      }
      const result = await getRecipeById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
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
    staleTime: 30 * 1000,
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
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: RECIPE_KEYS.lists() });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_KEYS.lists() });
      toast.success(`Recipe ${data.name} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create recipe');
    },
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
            ...newData,
          };
        },
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
    },
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
    },
  });
}
