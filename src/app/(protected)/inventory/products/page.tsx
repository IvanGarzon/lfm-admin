import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getProducts } from '@/actions/inventory/products/queries';
import { ProductsView } from '@/features/inventory/products/components/product-view';
import { getQueryClient } from '@/lib/query-client';
import { PRODUCT_KEYS } from '@/features/inventory/products/constants/query-keys';
import { searchParamsCache } from '@/filters/products/products-filters';

export const metadata = constructMetadata({
  title: 'Products – lfm dashboard',
  description: 'Manage your product catalog and inventory.'
});

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = searchParamsCache.parse(rawParams);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: async () => {
      const result = await getProducts(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductsView />
      </HydrationBoundary>
    </Shell>
  );
}
