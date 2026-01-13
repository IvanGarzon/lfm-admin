import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { QuotesView } from '@/features/finances/quotes/components/quotes-view';
import { getQuotes } from '@/actions/quotes';
import dynamic from 'next/dynamic';

// Lazy load QuoteDrawer to reduce initial bundle size
const QuoteDrawer = dynamic(
  () => import('@/features/finances/quotes/components/quote-drawer').then((mod) => mod.QuoteDrawer),
  {
    loading: () => null,
  },
);

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getQuotes(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <QuotesView initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <QuoteDrawer key={id} id={id} open={true} /> : null}
    </Shell>
  );
}
