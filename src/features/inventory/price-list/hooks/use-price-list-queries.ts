'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getPriceListItemById,
  getPriceListCostHistory,
  getActivePriceListItems,
} from '@/actions/inventory/price-list/queries';
import {
  createPriceListItem,
  updatePriceListItem,
  deletePriceListItem,
} from '@/actions/inventory/price-list/mutations';
import type {
  PriceListFilters,
  PriceListItemWithDetails,
} from '@/features/inventory/price-list/types';
import type { CreatePriceListItemInput, UpdatePriceListItemInput } from '@/schemas/price-list';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const PRICE_LIST_KEYS = {
  all: ['priceList'] as const,
  lists: () => [...PRICE_LIST_KEYS.all, 'list'] as const,
  list: (filters: PriceListFilters) => [...PRICE_LIST_KEYS.lists(), { filters }] as const,
  active: () => [...PRICE_LIST_KEYS.all, 'active'] as const,
  details: () => [...PRICE_LIST_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRICE_LIST_KEYS.details(), id] as const,
  costHistory: (id: string) => [...PRICE_LIST_KEYS.all, 'costHistory', id] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch a single price list item by ID
 */
export function usePriceListItem(id: string | undefined) {
  return useQuery({
    queryKey: PRICE_LIST_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Price list item ID is required');
      }
      const result = await getPriceListItemById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch cost history for a price list item
 */
export function usePriceListCostHistory(id: string | undefined) {
  return useQuery({
    queryKey: PRICE_LIST_KEYS.costHistory(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Price list item ID is required');
      }
      const result = await getPriceListCostHistory(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to prefetch a price list item on hover
 */
export function usePrefetchPriceListItem() {
  const queryClient = useQueryClient();

  return (itemId: string) => {
    queryClient.prefetchQuery({
      queryKey: PRICE_LIST_KEYS.detail(itemId),
      queryFn: async () => {
        const result = await getPriceListItemById(itemId);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}

/**
 * Hook to fetch all active price list items for selection in recipes
 */
export function useActivePriceListItems() {
  return useQuery({
    queryKey: PRICE_LIST_KEYS.active(),
    queryFn: async () => {
      const result = await getActivePriceListItems();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new price list item
 */
export function useCreatePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePriceListItemInput) => {
      const result = await createPriceListItem(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: PRICE_LIST_KEYS.lists() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_LIST_KEYS.lists() });
      toast.success('Price list item created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create price list item');
    },
  });
}

/**
 * Hook to update a price list item
 */
export function useUpdatePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePriceListItemInput) => {
      const result = await updatePriceListItem(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: PRICE_LIST_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: PRICE_LIST_KEYS.lists() });

      const previousItem = queryClient.getQueryData<PriceListItemWithDetails>(
        PRICE_LIST_KEYS.detail(newData.id),
      );

      if (previousItem) {
        queryClient.setQueryData(PRICE_LIST_KEYS.detail(newData.id), {
          ...previousItem,
          ...newData,
        });
      }

      return { previousItem };
    },
    onError: (err, newData, context) => {
      if (context?.previousItem) {
        queryClient.setQueryData(PRICE_LIST_KEYS.detail(newData.id), context.previousItem);
      }
      toast.error(err.message || 'Failed to update price list item');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: PRICE_LIST_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PRICE_LIST_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRICE_LIST_KEYS.costHistory(variables.id) });
    },
    onSuccess: () => {
      toast.success('Price list item updated successfully');
    },
  });
}

/**
 * Hook to delete a price list item
 */
export function useDeletePriceListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePriceListItem(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICE_LIST_KEYS.lists() });
      toast.success('Price list item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete price list item');
    },
  });
}
