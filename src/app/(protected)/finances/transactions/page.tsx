import { SearchParams } from 'nuqs/server';
import { getTransactions } from '@/actions/transactions';
import { constructMetadata } from '@/lib/utils';
import { Shell } from '@/components/shared/shell';
import { TransactionList } from '@/features/finances/transactions/components/transaction-list';

export const metadata = constructMetadata({
  title: 'Transactions – lfm dashboard',
  description: 'Track all your income and expenses.',
});

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getTransactions(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <TransactionList data={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
