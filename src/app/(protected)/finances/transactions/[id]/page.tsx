import { SearchParams } from 'nuqs/server';
import { getTransactions } from '@/actions/transactions';
import { Shell } from '@/components/shared/shell';
import { TransactionsView } from '@/features/finances/transactions/components/transactions-view';
import dynamic from 'next/dynamic';

// Lazy load TransactionDrawer to reduce initial bundle size
const TransactionDrawer = dynamic(
  () =>
    import('@/features/finances/transactions/components/transaction-drawer').then(
      (mod) => mod.TransactionDrawer,
    ),
  {
    loading: () => null,
  },
);

export default async function TransactionIdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getTransactions(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <TransactionsView initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <TransactionDrawer key={id} id={id} open={true} /> : null}
    </Shell>
  );
}
