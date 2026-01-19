'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getOrganizations } from '@/actions/organizations/queries';
import { createOrganization } from '@/actions/organizations/mutations';
import type { CreateOrganizationInput } from '@/schemas/organizations';

export const ORGANIZATION_KEYS = {
  all: ['organizations'] as const,
  lists: () => [...ORGANIZATION_KEYS.all, 'list'] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: ORGANIZATION_KEYS.lists(),
    queryFn: async () => {
      const result = await getOrganizations();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 60 * 1000, // 60 seconds
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
      return result;
    },
    onSuccess: (response) => {
      // Invalidate organizations list
      queryClient.invalidateQueries({ queryKey: ORGANIZATION_KEYS.lists() });
      // Also invalidate customer queries since they include organization data
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      toast.success(`Organization "${response.data.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });
}
