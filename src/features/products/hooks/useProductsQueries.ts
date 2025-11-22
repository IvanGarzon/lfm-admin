import { useQuery } from '@tanstack/react-query';
import { getActiveProducts } from '@/actions/products';

export const PRODUCT_KEYS = {
  all: () => ['products'] as const,
};

export function useProducts() {
  return useQuery({
    queryKey: PRODUCT_KEYS.all(),
    queryFn: async () => {
      const result = await getActiveProducts();
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
