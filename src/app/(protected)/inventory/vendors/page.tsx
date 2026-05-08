import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getVendors } from '@/actions/inventory/vendors/queries';
import { VendorsView } from '@/features/inventory/vendors/components/vendor-view';
import { getQueryClient } from '@/lib/query-client';
import { VENDOR_KEYS } from '@/features/inventory/vendors/constants/query-keys';
import { searchParamsCache } from '@/filters/vendors/vendors-filters';

export const metadata = constructMetadata({
  title: 'Vendors – lfm dashboard',
  description: 'Manage your suppliers and vendors.'
});

export default async function VendorsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = searchParamsCache.parse(rawParams);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: VENDOR_KEYS.list(filters),
    queryFn: async () => {
      const result = await getVendors(filters);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VendorsView />
      </HydrationBoundary>
    </Shell>
  );
}
