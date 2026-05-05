import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { CustomersList } from '@/features/crm/customers/components/customers-list';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getCustomers } from '@/actions/crm/customers/queries';
import { getQueryClient } from '@/lib/query-client';
import { CUSTOMER_KEYS } from '@/features/crm/customers/constants/query-keys';
import { searchParamsCache } from '@/filters/customers/customers-filters';

export const metadata = constructMetadata({
  title: 'Customers – lfm dashboard',
  description: 'Manage your customers and view their details.'
});

export default async function CustomersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: CUSTOMER_KEYS.list(filters),
    queryFn: async () => {
      const result = await getCustomers(filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CustomersList />
      </HydrationBoundary>
    </Shell>
  );
}
