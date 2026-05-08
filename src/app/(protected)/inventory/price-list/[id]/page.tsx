import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { getPriceListItems } from '@/actions/inventory/price-list/queries';
import { PriceListView } from '@/features/inventory/price-list/components/price-list-view';
import { getQueryClient } from '@/lib/query-client';
import { PRICE_LIST_KEYS } from '@/features/inventory/price-list/constants/query-keys';
import { searchParamsCache } from '@/filters/price-list/price-list-filters';

const PriceListDrawer = dynamic(
  () =>
    import('@/features/inventory/price-list/components/price-list-drawer').then(
      (mod) => mod.PriceListDrawer
    ),
  {
    loading: () => null
  }
);

export default async function PriceListItemPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: PRICE_LIST_KEYS.list(filters),
    queryFn: async () => {
      const result = await getPriceListItems(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PriceListView />
        {id ? <PriceListDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
