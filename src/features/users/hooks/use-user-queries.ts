'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { SearchParams } from 'nuqs/server';
import { getTenantUserById, getUserRoleChanges, getTenantUsers } from '@/actions/users/queries';
import {
  updateUser,
  updateUserSecurity,
  updateUserRole,
  softDeleteUser,
  inviteUser,
  changePassword,
  sendPasswordResetEmail,
  uploadUserAvatar,
} from '@/actions/users/mutations';
import { getSessionsByUserId } from '@/actions/sessions/queries';
import type {
  UpdateUserInput,
  UpdateUserSecurityInput,
  UpdateUserRoleInput,
  SoftDeleteUserInput,
  InviteUserInput,
  ChangePasswordInput,
} from '@/schemas/users';
import type { UserDetail, UserPagination } from '@/features/users/types';
import type { SessionWithUser } from '@/features/sessions/types';
import { USER_KEYS } from '@/features/users/constants/query-keys';

export function useUsers(searchParams: SearchParams) {
  const filtersKey = JSON.stringify(searchParams);
  return useQuery({
    queryKey: USER_KEYS.list(filtersKey),
    queryFn: async () => {
      const result = await getTenantUsers(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

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
          isTwoFactorEnabled: newData.isTwoFactorEnabled ?? old.isTwoFactorEnabled,
          username: newData.username ?? null,
          title: newData.title ?? null,
          bio: newData.bio ?? null,
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
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id), exact: true });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('User updated successfully');
    },
  });
}

export function useUpdateUserSecurity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserSecurityInput) => {
      const result = await updateUserSecurity(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.detail(data.id) });
      const previousUser = queryClient.getQueryData(USER_KEYS.detail(data.id));
      queryClient.setQueryData(USER_KEYS.detail(data.id), (old: UserDetail | undefined) => {
        if (!old) return old;
        return {
          ...old,
          ...(data.isTwoFactorEnabled !== undefined && {
            isTwoFactorEnabled: data.isTwoFactorEnabled,
          }),
          ...(data.loginNotificationsEnabled !== undefined && {
            loginNotificationsEnabled: data.loginNotificationsEnabled,
          }),
        };
      });
      return { previousUser };
    },
    onError: (err: Error, data, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(USER_KEYS.detail(data.id), context.previousUser);
      }
      toast.error(err.message || 'Failed to update security settings');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id), exact: true });
    },
    onSuccess: () => {
      toast.success('Security settings updated');
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.detail(data.id) });
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });
      const previousUser = queryClient.getQueryData(USER_KEYS.detail(data.id));
      const previousLists = queryClient.getQueriesData({ queryKey: USER_KEYS.lists() });
      return { previousUser, previousLists };
    },
    onError: (err: Error, data, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(USER_KEYS.detail(data.id), context.previousUser);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      toast.error(err.message || 'Failed to update role');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(variables.id), exact: true });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.accessChanges(variables.id) });
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
    },
  });
}

export function useUserRoleChanges(userId: string) {
  return useQuery({
    queryKey: USER_KEYS.accessChanges(userId),
    queryFn: async () => {
      const result = await getUserRoleChanges(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteUserInput) => {
      const result = await inviteUser(data);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: USER_KEYS.lists() });
      const previousLists = queryClient.getQueriesData({ queryKey: USER_KEYS.lists() });
      return { previousLists };
    },
    onError: (err: Error, _data, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      toast.error(err.message || 'Failed to send invitation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onSuccess: () => {
      toast.success('Invitation sent');
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

export function usePrefetchTenantUser() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: USER_KEYS.detail(userId),
      queryFn: async () => {
        const result = await getTenantUserById(userId);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      },
    });
  };
}

export function useUserSessions(userId: string) {
  return useQuery({
    queryKey: [...USER_KEYS.detail(userId), 'sessions'] as const,
    queryFn: async () => {
      const result = await getSessionsByUserId(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return (result.data ?? []) as SessionWithUser[];
    },
    staleTime: 30 * 1000,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const result = await changePassword(data);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to change password');
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
  });
}

export function useSendPasswordResetEmail() {
  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await sendPasswordResetEmail(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send password reset email');
    },
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
  });
}

export function useUploadUserAvatar(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('file', file);
      const result = await uploadUserAvatar(formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload avatar');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(USER_KEYS.detail(userId), (old: UserDetail | undefined) => {
        if (!old) return old;
        return { ...old, avatarUrl: data.avatarUrl };
      });

      queryClient.setQueriesData(
        { queryKey: USER_KEYS.lists() },
        (old: UserPagination | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === userId ? { ...item, avatarUrl: data.avatarUrl } : item,
            ),
          };
        },
      );

      toast.success('Avatar updated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.detail(userId), exact: true });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
  });
}
