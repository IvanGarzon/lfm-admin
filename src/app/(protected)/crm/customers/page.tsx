import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { CustomersList } from '@/features/crm/customers/components/customers-list';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getCustomers } from '@/actions/crm/customers/queries';
import { getQueryClient } from '@/lib/query-client';
import { CUSTOMER_KEYS } from '@/features/crm/customers/constants/query-keys';

export const metadata = constructMetadata({
  title: 'Customers – lfm dashboard',
  description: 'Manage your customers and view their details.',
});

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: CUSTOMER_KEYS.list(JSON.stringify(searchParamsResolved)),
    queryFn: async () => {
      const result = await getCustomers(searchParamsResolved);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CustomersList searchParams={searchParamsResolved} />
      </HydrationBoundary>
    </Shell>
  );
}
