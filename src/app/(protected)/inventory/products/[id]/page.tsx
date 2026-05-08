import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { getProducts } from '@/actions/inventory/products/queries';
import { ProductsView } from '@/features/inventory/products/components/product-view';
import { getQueryClient } from '@/lib/query-client';
import { PRODUCT_KEYS } from '@/features/inventory/products/constants/query-keys';
import { searchParamsCache } from '@/filters/products/products-filters';

const ProductDrawer = dynamic(
  () =>
    import('@/features/inventory/products/components/product-drawer').then(
      (mod) => mod.ProductDrawer
    ),
  {
    loading: () => null
  }
);

export default async function ProductPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
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
        {id ? <ProductDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
