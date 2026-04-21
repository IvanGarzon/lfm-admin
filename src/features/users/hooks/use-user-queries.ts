'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getTenantUserById } from '@/actions/users/queries';
import { updateUser, updateUserRole, softDeleteUser } from '@/actions/users/mutations';
import type { UpdateUserInput, UpdateUserRoleInput, SoftDeleteUserInput } from '@/schemas/users';
import type { UserDetail } from '@/features/users/types';

export const USER_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_KEYS.all, 'list'] as const,
  list: (filters: string) => [...USER_KEYS.lists(), { filters }] as const,
  details: () => [...USER_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...USER_KEYS.details(), id] as const,
};

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: USER_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('User ID is required');
      }
      const result = await getTenantUserById(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error('User not found');
      }

      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserInput) => {
      const result = await updateUser(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });

      const previousUser = queryClient.getQueryData(USER_KEYS.detail(newData.id));

      queryClient.setQueryData(USER_KEYS.detail(newData.id), (old: UserDetail | undefined) => {
        if (!old) {
          return old;
        }

        return {
          ...old,
          firstName: newData.firstName,
          lastName: newData.lastName,
          email: newData.email,
          phone: newData.phone ?? null,
          status: newData.status,
          isTwoFactorEnabled: newData.isTwoFactorEnabled,
        };
      });

      return { previousUser };
    },
    onError: (err: Error, newData, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(USER_KEYS.detail(newData.id), context.previousUser);
      }
      toast.error(err.message || 'Failed to update user');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('User updated successfully');
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserRoleInput) => {
      const result = await updateUserRole(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update role');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
    },
  });
}

export function useSoftDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SoftDeleteUserInput) => {
      const result = await softDeleteUser(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (data: SoftDeleteUserInput) => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.detail(data.id) });
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });

      const previousUser = queryClient.getQueryData(USER_KEYS.detail(data.id));
      const previousLists = queryClient.getQueriesData({ queryKey: USER_KEYS.lists() });

      queryClient.removeQueries({ queryKey: USER_KEYS.detail(data.id) });

      return { previousUser, previousLists };
    },
    onError: (error: Error, data, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(USER_KEYS.detail(data.id), context.previousUser);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      toast.error(error.message || 'Failed to delete user');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('User removed');
    },
  });
}
