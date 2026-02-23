'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { VendorStatus } from '@/prisma/client';
import {
  getVendors,
  getVendorById,
  getVendorStatistics,
  getActiveVendors,
  createVendor,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
} from '@/actions/inventory/vendors';
import type { VendorFilters, VendorWithDetails } from '@/features/inventory/vendors/types';
import type {
  CreateVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
} from '@/schemas/vendors';

export const VENDOR_KEYS = {
  all: ['vendors'] as const,
  lists: () => [...VENDOR_KEYS.all, 'list'] as const,
  list: (filters: VendorFilters) => [...VENDOR_KEYS.lists(), { filters }] as const,
  details: () => [...VENDOR_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VENDOR_KEYS.details(), id] as const,
  statistics: () => [...VENDOR_KEYS.all, 'statistics'] as const,
  active: () => [...VENDOR_KEYS.all, 'active'] as const,
};

export function useVendors(filters: VendorFilters) {
  return useQuery({
    queryKey: VENDOR_KEYS.list(filters),
    queryFn: async () => {
      const searchParams: Record<string, string | string[]> = {};

      if (filters.search) {
        searchParams.search = filters.search;
      }

      if (filters.status && filters.status.length > 0) {
        searchParams.status = filters.status;
      }

      const result = await getVendors(searchParams);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: VENDOR_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Vendor ID is required');
      }
      const result = await getVendorById(id);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useVendorStatistics() {
  return useQuery({
    queryKey: VENDOR_KEYS.statistics(),
    queryFn: async () => {
      const result = await getVendorStatistics();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useActiveVendors() {
  return useQuery({
    queryKey: VENDOR_KEYS.active(),
    queryFn: async () => {
      const result = await getActiveVendors();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVendorInput) => {
      const result = await createVendor(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: VENDOR_KEYS.lists() });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.active() });
      toast.success(`Vendor ${data.vendorCode} created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create vendor');
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVendorInput) => {
      const result = await updateVendor(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: VENDOR_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: VENDOR_KEYS.lists() });

      const previousVendor = queryClient.getQueryData(VENDOR_KEYS.detail(newData.id));

      queryClient.setQueryData(
        VENDOR_KEYS.detail(newData.id),
        (old: VendorWithDetails | undefined) => {
          if (!old) return old;

          return {
            ...old,
            name: newData.name,
            email: newData.email,
            phone: newData.phone ?? null,
            abn: newData.abn ?? null,
            status: newData.status,
            address: newData.address ?? null,
            website: newData.website ?? null,
            paymentTerms: newData.paymentTerms ?? null,
            taxId: newData.taxId ?? null,
            notes: newData.notes ?? null,
          };
        },
      );

      return { previousVendor };
    },
    onError: (err, newData, context) => {
      if (context?.previousVendor) {
        queryClient.setQueryData(VENDOR_KEYS.detail(newData.id), context.previousVendor);
      }
      toast.error(err.message || 'Failed to update vendor');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.active() });
    },
    onSuccess: () => {
      toast.success('Vendor updated successfully');
    },
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVendorStatusInput) => {
      const result = await updateVendorStatus(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.active() });
      toast.success('Vendor status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update vendor status');
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteVendor({ id });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.active() });
      toast.success('Vendor deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete vendor');
    },
  });
}

export function usePrefetchVendor() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: VENDOR_KEYS.detail(id),
      queryFn: async () => {
        const result = await getVendorById(id);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}
