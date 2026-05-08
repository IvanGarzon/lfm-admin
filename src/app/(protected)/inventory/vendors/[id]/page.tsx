import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { getVendors } from '@/actions/inventory/vendors/queries';
import { VendorsView } from '@/features/inventory/vendors/components/vendor-view';
import { getQueryClient } from '@/lib/query-client';
import { VENDOR_KEYS } from '@/features/inventory/vendors/constants/query-keys';
import { searchParamsCache } from '@/filters/vendors/vendors-filters';

const VendorDrawer = dynamic(
  () =>
    import('@/features/inventory/vendors/components/vendor-drawer').then((mod) => mod.VendorDrawer),
  {
    loading: () => null
  }
);

export default async function VendorPage({
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
        {id ? <VendorDrawer id={id} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
