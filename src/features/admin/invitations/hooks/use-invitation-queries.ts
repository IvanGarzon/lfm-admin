'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminSendInvitation, adminRevokeInvitation } from '@/actions/invitations/mutations';
import { TENANT_KEYS } from '@/features/admin/tenants/hooks/use-tenant-queries';
import type { UserRole } from '@/prisma/client';

export function useAdminSendInvitation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; role: UserRole }) =>
      adminSendInvitation({ ...data, tenantId }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Invitation sent');
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.detail(tenantId) });
    },
    onError: () => toast.error('Failed to send invitation'),
  });
}

export function useAdminRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminRevokeInvitation(id),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Invitation revoked');
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.all });
    },
    onError: () => toast.error('Failed to revoke invitation'),
  });
}
