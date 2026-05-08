import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getPriceListItems } from '@/actions/inventory/price-list/queries';
import { PriceListView } from '@/features/inventory/price-list/components/price-list-view';
import { getQueryClient } from '@/lib/query-client';
import { PRICE_LIST_KEYS } from '@/features/inventory/price-list/constants/query-keys';
import { searchParamsCache } from '@/filters/price-list/price-list-filters';

export const metadata = constructMetadata({
  title: 'Price List – lfm dashboard',
  description: 'Manage your pricing catalog for florals, sundries, and supplies.'
});

export default async function PriceListPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
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
      </HydrationBoundary>
    </Shell>
  );
}
