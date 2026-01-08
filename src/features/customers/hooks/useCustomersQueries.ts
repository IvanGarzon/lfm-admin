'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomers,
  createCustomer,
  getOrganizations,
  getActiveCustomers,
} from '@/actions/customers/queries';
import type { CreateCustomerInput } from '@/schemas/customers';

type CustomerFilters = {
  search?: string;
};

export const CUSTOMER_KEYS = {
  all: () => ['customers'] as const,
  lists: () => ['customers', 'list'] as const,
  list: (filters: CustomerFilters) => [...CUSTOMER_KEYS.lists(), { filters }] as const,
  organizations: () => ['organizations'] as const,
};

export function useCustomers(filters: CustomerFilters) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) {
        searchParams.search = filters.search;
      }

      const result = await getCustomers(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useActiveCustomers() {
  return useQuery({
    queryKey: CUSTOMER_KEYS.lists(),
    queryFn: async () => {
      const result = await getActiveCustomers();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerInput) => {
      const result = await createCustomer(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate customers query to refetch the list
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.all() });
    },
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: CUSTOMER_KEYS.organizations(),
    queryFn: async () => {
      const result = await getOrganizations();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
