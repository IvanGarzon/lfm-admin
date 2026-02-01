'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getActiveOrganizations, getOrganizationById } from '@/actions/organizations/queries';
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '@/actions/organizations/mutations';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  DeleteOrganizationInput,
} from '@/schemas/organizations';
import type { OrganizationListItem } from '@/features/organizations/types';

export const ORGANIZATION_KEYS = {
  all: ['organizations'] as const,
  lists: () => [...ORGANIZATION_KEYS.all, 'list'] as const,
  details: () => [...ORGANIZATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ORGANIZATION_KEYS.details(), id] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: ORGANIZATION_KEYS.lists(),
    queryFn: async () => {
      const result = await getActiveOrganizations();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000, // 60 seconds
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ORGANIZATION_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Organization ID is required');
      }
      const result = await getOrganizationById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationInput) => {
      const result = await createOrganization(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ORGANIZATION_KEYS.lists() });
    },
    onSuccess: (response) => {
      // Invalidate organizations list
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
      // Also invalidate customer queries since they include organization data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`Organization "${response.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOrganizationInput) => {
      const result = await updateOrganization(data);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ORGANIZATION_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: ORGANIZATION_KEYS.lists() });

      // Snapshot the previous value
      const previousOrganization = queryClient.getQueryData(ORGANIZATION_KEYS.detail(newData.id));

      // Optimistically update organization with new data
      queryClient.setQueryData(
        ORGANIZATION_KEYS.detail(newData.id),
        (old: OrganizationListItem | undefined) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            name: newData.name,
            address: newData.address,
            city: newData.city,
            state: newData.state,
            postcode: newData.postcode,
            country: newData.country,
          };
        },
      );

      return { previousOrganization };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrganization) {
        queryClient.setQueryData(
          ORGANIZATION_KEYS.detail(newData.id),
          context.previousOrganization,
        );
      }
      toast.error(err.message || 'Failed to update organization');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
      // Also invalidate customer queries since they include organization data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onSuccess: () => {
      toast.success('Organization updated successfully');
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteOrganizationInput) => {
      const result = await deleteOrganization(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (data: DeleteOrganizationInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ORGANIZATION_KEYS.detail(data.id) });
      await queryClient.cancelQueries({ queryKey: ORGANIZATION_KEYS.lists() });

      // Snapshot the previous values
      const previousOrganization = queryClient.getQueryData(ORGANIZATION_KEYS.detail(data.id));
      const previousLists = queryClient.getQueriesData({ queryKey: ORGANIZATION_KEYS.lists() });

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: ORGANIZATION_KEYS.detail(data.id) });

      // Return context for rollback
      return { previousOrganization, previousLists, id: data.id };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousOrganization) {
        queryClient.setQueryData(ORGANIZATION_KEYS.detail(data.id), context.previousOrganization);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete organization');
    },
    onSettled: () => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
      // Also invalidate customer queries since they include organization data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onSuccess: () => {
      toast.success('Organization deleted');
    },
  });
}
