import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveCustomers, createCustomer, getOrganizations } from '@/actions/customers';
import type { CreateCustomerInput } from '@/schemas/customers';

export const CUSTOMER_KEYS = {
  all: () => ['customers'] as const,
  organizations: () => ['organizations'] as const,
};

export function useCustomers() {
  return useQuery({
    queryKey: CUSTOMER_KEYS.all(),
    queryFn: async () => {
      const result = await getActiveCustomers();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
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
