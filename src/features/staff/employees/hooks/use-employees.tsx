'use client';

import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  DeleteEmployeeInput,
} from '@/schemas/employees';
import { getEmployeeById } from '@/actions/staff/employees/queries';
import {
  updateEmployee,
  createEmployee,
  deleteEmployee,
} from '@/actions/staff/employees/mutations';
import type { EmployeeListItem } from '@/features/staff/employees/types';

export const EMPLOYEE_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...EMPLOYEE_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYEE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_KEYS.details(), id] as const,
};

export function useEmployeeById(id: string | undefined) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Employee ID is required');
      }

      const result = await getEmployeeById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function usePrefetchEmployee() {
  const queryClient = useQueryClient();

  return (employeeId: string) => {
    queryClient.prefetchQuery({
      queryKey: EMPLOYEE_KEYS.detail(employeeId),
      queryFn: async () => {
        const result = await getEmployeeById(employeeId);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
      staleTime: 2 * 60 * 1000,
    });
  };
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeInput) => {
      const result = await createEmployee(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Employee created successfully');
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeInput) => {
      const result = await updateEmployee(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      await queryClient.cancelQueries({ queryKey: EMPLOYEE_KEYS.detail(data.id) });
      const snapshot = queryClient.getQueryData<EmployeeListItem>(EMPLOYEE_KEYS.detail(data.id));
      return { snapshot };
    },
    onError: (error: Error, data, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(EMPLOYEE_KEYS.detail(data.id), context.snapshot);
      }
      toast.error(error.message || 'Failed to update employee');
    },
    onSettled: (_data, _error, data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.detail(data.id) });
    },
    onSuccess: () => {
      toast.success('Employee updated successfully');
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteEmployeeInput) => {
      const result = await deleteEmployee(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Employee deleted successfully');
    },
  });
}
