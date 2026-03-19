'use client';

import { useQuery, useMutation, useQueryClient, skipToken } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getRecipeGroups,
  getRecipeGroupById,
  getAllRecipeGroups,
} from '@/actions/finances/recipe-groups/queries';
import {
  createRecipeGroup,
  updateRecipeGroup,
  deleteRecipeGroup,
} from '@/actions/finances/recipe-groups/mutations';
import type {
  RecipeGroupFilters,
  RecipeGroupWithDetails,
} from '@/features/finances/recipe-groups/types';
import type { CreateRecipeGroupInput, UpdateRecipeGroupInput } from '@/schemas/recipe-groups';

export const RECIPE_GROUP_KEYS = {
  all: ['recipe-groups'] as const,
  lists: () => [...RECIPE_GROUP_KEYS.all, 'list'] as const,
  list: (filters: RecipeGroupFilters) => [...RECIPE_GROUP_KEYS.lists(), { filters }] as const,
  details: () => [...RECIPE_GROUP_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_GROUP_KEYS.details(), id] as const,
};

export function useRecipeGroups(filters: RecipeGroupFilters) {
  return useQuery({
    queryKey: RECIPE_GROUP_KEYS.list(filters),
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

      const result = await getRecipeGroups(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useRecipeGroup(id: string | undefined) {
  return useQuery({
    queryKey: RECIPE_GROUP_KEYS.detail(id ?? ''), // Keep for type safety
    queryFn: id
      ? async () => {
          const result = await getRecipeGroupById(id);
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    staleTime: 30 * 1000,
  });
}

export function useAllRecipeGroups(enabled: boolean = true) {
  return useQuery({
    queryKey: RECIPE_GROUP_KEYS.lists(),
    queryFn: enabled
      ? async () => {
          const result = await getAllRecipeGroups();
          if (!result.success) {
            throw new Error(result.error);
          }

          return result.data;
        }
      : skipToken,
    staleTime: 60 * 1000,
  });
}

export function useCreateRecipeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecipeGroupInput) => {
      const result = await createRecipeGroup(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_GROUP_KEYS.lists() });
      toast.success(`Recipe group "${data.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create recipe group');
    },
  });
}

export function useUpdateRecipeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecipeGroupInput }) => {
      const result = await updateRecipeGroup(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_GROUP_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: RECIPE_GROUP_KEYS.lists() });
      toast.success(`Recipe group "${data.name}" updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update recipe group');
    },
  });
}

export function useDeleteRecipeGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRecipeGroup(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_GROUP_KEYS.lists() });
      toast.success('Recipe group deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete recipe group');
    },
  });
}
