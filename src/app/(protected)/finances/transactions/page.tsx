import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { constructMetadata } from '@/lib/utils';
import { Shell } from '@/components/shared/shell';
import { TransactionsView } from '@/features/finances/transactions/components/transactions-view';
import { getTransactions } from '@/actions/finances/transactions/queries';
import { getQueryClient } from '@/lib/query-client';
import { TRANSACTION_KEYS } from '@/features/finances/transactions/constants/query-keys';
import { searchParamsCache } from '@/filters/transactions/transactions-filters';

export const metadata = constructMetadata({
  title: 'Transactions – lfm dashboard',
  description: 'Track all your income and expenses.'
});

export default async function TransactionsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
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
      </HydrationBoundary>
    </Shell>
  );
}
