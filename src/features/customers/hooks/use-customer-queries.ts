'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCustomerById, getActiveCustomers } from '@/actions/customers/queries';
import { updateCustomer, deleteCustomer, createCustomer } from '@/actions/customers/mutations';
import type {
  UpdateCustomerInput,
  CreateCustomerInput,
  DeleteCustomerInput,
} from '@/schemas/customers';
import type { CustomerListItem } from '@/features/customers/types';

export const CUSTOMER_KEYS = {
  all: ['customers'] as const,
  lists: () => [...CUSTOMER_KEYS.all, 'list'] as const,
  list: (filters: string) => [...CUSTOMER_KEYS.lists(), { filters }] as const,
  details: () => [...CUSTOMER_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CUSTOMER_KEYS.details(), id] as const,
};

export function useActiveCustomers() {
  return useQuery({
    queryKey: [...CUSTOMER_KEYS.lists(), 'active'],
    queryFn: async () => {
      const result = await getActiveCustomers();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Customer ID is required');
      }
      const result = await getCustomerById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function usePrefetchCustomer() {
  const queryClient = useQueryClient();

  return (customerId: string) => {
    queryClient.prefetchQuery({
      queryKey: CUSTOMER_KEYS.detail(customerId),
      queryFn: async () => {
        const result = await getCustomerById(customerId);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
    });
  };
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
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: CUSTOMER_KEYS.lists() });
    },
    onSuccess: () => {
      // Invalidate lists and statistics
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      toast.success(`Customer created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCustomerInput) => {
      const result = await updateCustomer(data);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CUSTOMER_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: CUSTOMER_KEYS.lists() });

      // Snapshot the previous value
      const previousCustomer = queryClient.getQueryData(CUSTOMER_KEYS.detail(newData.id));

      // Optimistically update quote with new data
      queryClient.setQueryData(
        CUSTOMER_KEYS.detail(newData.id),
        (old: CustomerListItem | undefined) => {
          if (!old) {
            return old;
          }

          return {
            ...old,
            firstName: newData.firstName,
            lastName: newData.lastName,
            email: newData.email,
            phone: newData.phone,
            organizationId: newData.organizationId ?? null,
            organizationName: newData.organizationName ?? null,
            gender: newData.gender,
            status: newData.status,
          };
        },
      );

      return { previousCustomer };
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCustomer) {
        queryClient.setQueryData(CUSTOMER_KEYS.detail(newData.id), context.previousCustomer);
      }
      toast.error(err.message || 'Failed to update customer');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      // queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Customer updated successfully');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteCustomerInput) => {
      const result = await deleteCustomer(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (data: DeleteCustomerInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: CUSTOMER_KEYS.detail(data.id) });
      await queryClient.cancelQueries({ queryKey: CUSTOMER_KEYS.lists() });

      // Snapshot the previous values
      const previousCustomer = queryClient.getQueryData(CUSTOMER_KEYS.detail(data.id));
      const previousLists = queryClient.getQueriesData({ queryKey: CUSTOMER_KEYS.lists() });

      // Optimistically remove from detail cache
      queryClient.removeQueries({ queryKey: CUSTOMER_KEYS.detail(data.id) });

      // Return context for rollback
      return { previousCustomer, previousLists, id: data.id };
    },
    onError: (error: Error, data, context) => {
      // Rollback optimistic update
      if (context?.previousCustomer) {
        queryClient.setQueryData(CUSTOMER_KEYS.detail(data.id), context.previousCustomer);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete customer');
    },
    onSettled: () => {
      // Always refetch to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      // queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.statistics() });
    },
    onSuccess: () => {
      toast.success('Customer deleted');
    },
  });
}
