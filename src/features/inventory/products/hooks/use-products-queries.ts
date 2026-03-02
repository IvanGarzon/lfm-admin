'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  skipToken,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getProducts,
  getProductById,
  getProductStatistics,
  getActiveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  bulkUpdateProductStatus,
  bulkDeleteProducts,
} from '@/actions/inventory/products';
import type {
  ProductFilters,
  ProductPagination,
  ProductWithDetails,
  ProductStatistics,
} from '@/features/inventory/products/types';
import type { CreateProductInput, UpdateProductInput } from '@/schemas/products';
import type { ProductStatus } from '@/prisma/client';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters: ProductFilters) => [...PRODUCT_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
  statistics: () => [...PRODUCT_KEYS.all, 'statistics'] as const,
  active: () => [...PRODUCT_KEYS.all, 'active'] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id ?? ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Product ID is required');
      }
      const result = await getProductById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch product statistics
 */
export function useProductStatistics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PRODUCT_KEYS.statistics(),
    queryFn: async () => {
      const result = await getProductStatistics();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
  });
}

/**
 * Hook to fetch active products for dropdowns
 */
export function useActiveProducts(enabled: boolean = true) {
  return useQuery({
    queryKey: PRODUCT_KEYS.active(),
    queryFn: enabled
      ? async () => {
          const result = await getActiveProducts();
          if (!result.success) {
            throw new Error(result.error);
          }
          return result.data;
        }
      : skipToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to prefetch a product on hover
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (productId: string) => {
    queryClient.prefetchQuery({
      queryKey: PRODUCT_KEYS.detail(productId),
      queryFn: async () => {
        const result = await getProductById(productId);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
      staleTime: 30 * 1000,
    });
  };
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const result = await createProduct(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: PRODUCT_KEYS.lists() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.statistics() });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductInput) => {
      const result = await updateProduct(data);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: PRODUCT_KEYS.detail(newData.id) });
      await queryClient.cancelQueries({ queryKey: PRODUCT_KEYS.lists() });

      // Snapshot the previous value
      const previousProduct = queryClient.getQueryData<ProductWithDetails>(
        PRODUCT_KEYS.detail(newData.id),
      );

      // Optimistically update the cache
      if (previousProduct) {
        queryClient.setQueryData(PRODUCT_KEYS.detail(newData.id), {
          ...previousProduct,
          ...newData,
        });
      }

      return { previousProduct };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(PRODUCT_KEYS.detail(newData.id), context.previousProduct);
      }
      toast.error(err.message || 'Failed to update product');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.active() });
    },
    onSuccess: () => {
      toast.success('Product updated successfully');
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteProduct(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.active() });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });
}

/**
 * Hook to update product status
 */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductStatus }) => {
      const result = await updateProductStatus(id, status);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.active() });
      toast.success('Product status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product status');
    },
  });
}

/**
 * Hook to update product stock
 */
export function useUpdateProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const result = await updateProductStock(id, quantity);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.statistics() });
      toast.success('Product stock updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product stock');
    },
  });
}

/**
 * Hook to delete multiple products
 */
export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const result = await bulkDeleteProducts(ids);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.active() });
      toast.success(`${data.count} products deleted successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete products');
    },
  });
}

/**
 * Hook to update status for multiple products
 */
export function useBulkUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ProductStatus }) => {
      const result = await bulkUpdateProductStatus(ids, status);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.active() });
      toast.success(`${data.count} products updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update products');
    },
  });
}
