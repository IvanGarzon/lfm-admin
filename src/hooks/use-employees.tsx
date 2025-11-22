import { z } from 'zod';
import { useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { EmployeeCreateInputSchema } from '@/zod/inputTypeSchemas/EmployeeCreateInputSchema';
import { EmployeeUpdateInputSchema } from '@/zod/inputTypeSchemas/EmployeeUpdateInputSchema';
import * as employeeService from '@/actions/employees';
import type { EmployeePagination } from '@/types/employee';
import type { Employee } from '@/prisma/client';

type EmployeeCreateInputType = z.infer<typeof EmployeeCreateInputSchema>;
type EmployeeUpdateInputType = z.infer<typeof EmployeeUpdateInputSchema>;

// Query keys as constants
export const QueryKeys = {
  EMPLOYEE: {
    GET_ALL: 'EMPLOYEE_GET_ALL',
    GET_BY_ID: 'EMPLOYEE_GET_BY_ID',
  },
};

export const MutationKeys = {
  EMPLOYEE: {
    CREATE: 'EMPLOYEE_CREATE',
    UPDATE: 'EMPLOYEE_UPDATE',
    DELETE: 'EMPLOYEE_DELETE',
  },
};

// Get employee by ID hook
export function useEmployeeById(employeeId: string | undefined): UseQueryOptions<Employee, Error> {
  const queryClient = useQueryClient();

  return {
    queryKey: [QueryKeys.EMPLOYEE.GET_BY_ID, employeeId],
    queryFn: async ({ queryKey }) => {
      const [, id] = queryKey;

      if (typeof id !== 'string' || !id) {
        throw new Error('Employee ID is invalid or missing in queryKey.');
      }

      return employeeService.getEmployeeById(id);
    },
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable caching (was 10 minutes)
    gcTime: 5 * 60 * 1000, // 5 minutes - don't keep too long (was 15 minutes)

    // REMOVED: Complex initialData function - often slower than just hitting API
    // The complex cache lookup through all lists was causing performance issues
    // Better to have a simple, fast API call than slow cache searches

    // OLD CODE (commented out for comparison):
    // initialData: () => {
    //   if (!employeeId) return undefined;

    //   // Check if we already have this specific employee cached
    //   const cachedEmployee = queryClient.getQueryData<Employee>([
    //     QueryKeys.EMPLOYEE.GET_BY_ID,
    //     employeeId,
    //   ]);
    //   if (cachedEmployee) {
    //     return cachedEmployee;
    //   }

    //   // Quick search through cached lists (much faster than placeholderData)
    //   const allLists = queryClient.getQueriesData<EmployeePagination>({
    //     queryKey: [QueryKeys.EMPLOYEE.GET_ALL],
    //     exact: false,
    //   });

    //   // Only check first cached list for performance
    //   const [_queryKey, listData] = allLists[0] || [];
    //   if (listData?.items) {
    //     const foundEmployee = listData.items.find((employee) => employee.id === employeeId);
    //     if (foundEmployee) {
    //       return foundEmployee;
    //     }
    //   }

    //   return undefined;
    // },
  };
}

// Update employee hook
export function useUpdateEmployee(): UseMutationOptions<Employee, Error, EmployeeUpdateInputType> {
  const queryClient = useQueryClient();

  return {
    mutationKey: [MutationKeys.EMPLOYEE.UPDATE],
    mutationFn: async (employeeInput: EmployeeUpdateInputType) => {
      return employeeService.updateEmployee(employeeInput);
    },
    onSuccess: (updatedEmployee) => {
      // Update the specific employee in the cache
      queryClient.setQueryData([QueryKeys.EMPLOYEE.GET_BY_ID, updatedEmployee.id], updatedEmployee);

      // Update the employee in all relevant list caches
      queryClient.setQueriesData<EmployeePagination | undefined>(
        { queryKey: [QueryKeys.EMPLOYEE.GET_ALL], exact: false }, // Affect all GET_ALL lists
        (oldData) => {
          if (!oldData || !Array.isArray(oldData.items)) {
            return oldData;
          }

          return {
            ...oldData,
            items: oldData.items.map((employee) =>
              employee.id === updatedEmployee.id ? updatedEmployee : employee,
            ),
          };
        },
      );
    },
    onSettled: (data, error, variables) => {
      // Invalidate all list queries to refetch
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.EMPLOYEE.GET_ALL],
        exact: false, // Affect all GET_ALL lists
      });

      // Invalidate the specific employee's query
      // Use variables.id as it's the input and always available
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.EMPLOYEE.GET_BY_ID, variables.id],
        });
      } else if (data?.id) {
        // Fallback if mutation was successful and variables.id somehow not preferred
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.EMPLOYEE.GET_BY_ID, data.id],
        });
      }
    },
  };
}

// Create employee hook
export function useCreateEmployee(): UseMutationOptions<Employee, Error, EmployeeCreateInputType> {
  const queryClient = useQueryClient();

  return {
    mutationKey: [MutationKeys.EMPLOYEE.CREATE],
    mutationFn: async (employeeInput: EmployeeCreateInputType) => {
      return employeeService.createEmployee(employeeInput);
    },
    onSuccess: (createdEmployee) => {
      // Optimistically update relevant lists
      // Consider if this simple prepend is always correct for your UI (sorting/filtering)
      // Invalidation in onSettled is the safer bet for complex UIs.
      queryClient.setQueriesData<EmployeePagination | undefined>( // Added | undefined for type safety
        { queryKey: [QueryKeys.EMPLOYEE.GET_ALL], exact: false }, // Affect all GET_ALL lists
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          return {
            ...oldData,
            items: [createdEmployee, ...oldData.items],
            pagination: {
              ...oldData.pagination,
              totalItems: oldData.pagination.totalItems + 1,
            },
          };
        },
      );
    },
    onSettled: () => {
      // Invalidate all list queries to ensure freshness and correct order/filtering
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.EMPLOYEE.GET_ALL],
        exact: false, // Affect all GET_ALL lists
      });
    },
  };
}

// Delete employee hook
export function useDeleteEmployee(): UseMutationOptions<
  void, // TData: Type returned by mutationFn on success
  Error, // TError: Error type
  string, // TVariables: Type of variables passed to mutationFn (the employee ID)
  { previousListsData?: Array<{ queryKey: readonly unknown[]; data: EmployeePagination }> } // TContext: The context type. Ensure this matches the new structure.
> {
  const queryClient = useQueryClient();

  return {
    mutationKey: [MutationKeys.EMPLOYEE.DELETE],
    mutationFn: async (id: string) => {
      return employeeService.deleteEmployee(id);
    },

    // Optimistic update
    onMutate: async (idToDelete: string) => {
      // Cancel any outgoing refetch (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [QueryKeys.EMPLOYEE.GET_ALL], exact: false });

      // Snapshot the previous value of all employee lists
      const previousListsData: Array<{ queryKey: readonly unknown[]; data: EmployeePagination }> =
        [];
      queryClient
        .getQueriesData<EmployeePagination>({
          queryKey: [QueryKeys.EMPLOYEE.GET_ALL],
          exact: false, // Get all queries starting with GET_ALL
        })
        .forEach(([queryKey, data]) => {
          if (data) {
            previousListsData.push({ queryKey, data });
          }
        });

      // Optimistically update to the new value in all lists
      if (previousListsData.length > 0) {
        queryClient.setQueriesData<EmployeePagination | undefined>(
          { queryKey: [QueryKeys.EMPLOYEE.GET_ALL], exact: false },
          (oldData) => {
            if (!oldData || !Array.isArray(oldData.items)) {
              return oldData;
            }

            const newItems = oldData.items.filter((employee) => employee.id !== idToDelete);
            // Only update if the item was actually in this list
            if (newItems.length < oldData.items.length) {
              return {
                ...oldData,
                items: newItems,
                pagination: {
                  ...oldData.pagination,
                  totalItems:
                    oldData.pagination.totalItems > 0 ? oldData.pagination.totalItems - 1 : 0,
                },
              };
            }

            return oldData;
          },
        );
      }
      return { previousListsData };
    },

    // Rollback on error
    onError: (error, id, context) => {
      // context type here is TContext
      console.error('Deletion failed:', error);
      // Access context.previousListsData
      if (context?.previousListsData) {
        context.previousListsData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      } else {
        // Fallback if context somehow undefined or empty
        queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPLOYEE.GET_ALL], exact: false });
      }
    },
    onSettled: (data, error, id) => {
      // Refetch latest data
      queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPLOYEE.GET_ALL], exact: false });

      // Remove stale GET_BY_ID
      if (id) {
        queryClient.removeQueries({
          queryKey: [QueryKeys.EMPLOYEE.GET_BY_ID, id],
          exact: true,
        });
      }
    },
  };
}
