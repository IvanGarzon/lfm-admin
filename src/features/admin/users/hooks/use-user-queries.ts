'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateUserRole } from '@/actions/admin/users/mutations';
import type { UserRole } from '@/prisma/client';

export const USER_KEYS = {
  all: ['admin-users'] as const,
  lists: () => [...USER_KEYS.all, 'list'] as const,
};

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; role: UserRole }) => updateUserRole(data),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('User role updated');
      void queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() });
    },
    onError: () => toast.error('Failed to update user role'),
  });
}
