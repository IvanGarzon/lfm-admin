'use client';

import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { type CreateEmployeeFormValues, type UpdateEmployeeFormValues } from '@/schemas/employees';
import { getEmployeeById } from '@/actions/staff/employees/queries';
import {
  updateEmployee,
  createEmployee,
  deleteEmployee,
} from '@/actions/staff/employees/mutations';

// Query keys as constants
export const EMPLOYEE_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...EMPLOYEE_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYEE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_KEYS.details(), id] as const,
};

// Get employee by ID hook
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
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

// Create employee hook
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeFormValues) => {
      const result = await createEmployee(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      toast.success('Employee created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });
}

// Update employee hook
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeFormValues) => {
      const result = await updateEmployee(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.detail(data.id) });
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });
}

// Delete employee hook
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteEmployee(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      toast.success('Employee deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee');
    },
  });
}
