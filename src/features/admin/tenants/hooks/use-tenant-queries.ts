'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
} from '@/actions/admin/tenants/mutations';
import { switchActiveTenant } from '@/actions/admin/switch-tenant';
import type { CreateTenantInput, UpdateTenantInput } from '@/features/admin/tenants/types';

export const TENANT_KEYS = {
  all: ['admin-tenants'] as const,
  lists: () => [...TENANT_KEYS.all, 'list'] as const,
  detail: (id: string) => [...TENANT_KEYS.all, 'detail', id] as const,
};

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantInput) => createTenant(data),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Tenant created');
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
    },
    onError: () => toast.error('Failed to create tenant'),
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTenantInput) => updateTenant({ id, ...data }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Tenant updated');
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
    },
    onError: () => toast.error('Failed to update tenant'),
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suspendTenant(id),
    onSuccess: (result, id) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Tenant suspended');
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
    },
    onError: () => toast.error('Failed to suspend tenant'),
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateTenant(id),
    onSuccess: (result, id) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Tenant activated');
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
    },
    onError: () => toast.error('Failed to activate tenant'),
  });
}

export function useSwitchActiveTenant() {
  return useMutation({
    mutationFn: (tenantId: string | null) => switchActiveTenant(tenantId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
      }
    },
    onError: () => toast.error('Failed to switch tenant'),
  });
}
