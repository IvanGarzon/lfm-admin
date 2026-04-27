import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { CustomersList } from '@/features/crm/customers/components/customers-list';
import { getCustomers, getCustomerById } from '@/actions/crm/customers/queries';
import { getQueryClient } from '@/lib/query-client';
import { CUSTOMER_KEYS } from '@/features/crm/customers/constants/query-keys';

const CustomerDrawer = dynamic(
  () =>
    import('@/features/crm/customers/components/customer-drawer').then((mod) => mod.CustomerDrawer),
  { loading: () => null },
);

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: CUSTOMER_KEYS.list(JSON.stringify(searchParamsResolved)),
      queryFn: async () => {
        const result = await getCustomers(searchParamsResolved);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    }),
    queryClient.prefetchQuery({
      queryKey: CUSTOMER_KEYS.detail(id),
      queryFn: async () => {
        const result = await getCustomerById(id);
        if (!result.success) throw new Error(result.error);
        return result.data;
      },
    }),
  ]);

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CustomersList searchParams={searchParamsResolved} />
        {id ? <CustomerDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
