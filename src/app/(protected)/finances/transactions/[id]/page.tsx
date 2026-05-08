import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { TransactionsView } from '@/features/finances/transactions/components/transactions-view';
import { getTransactions } from '@/actions/finances/transactions/queries';
import { getQueryClient } from '@/lib/query-client';
import { TRANSACTION_KEYS } from '@/features/finances/transactions/constants/query-keys';
import { searchParamsCache } from '@/filters/transactions/transactions-filters';

const TransactionDrawer = dynamic(
  () =>
    import('@/features/finances/transactions/components/transaction-drawer').then(
      (mod) => mod.TransactionDrawer
    ),
  {
    loading: () => null
  }
);

export default async function TransactionIdPage({
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
    queryKey: TRANSACTION_KEYS.list(filters),
    queryFn: async () => {
      const result = await getTransactions(filters);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TransactionsView />
        {id ? <TransactionDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
