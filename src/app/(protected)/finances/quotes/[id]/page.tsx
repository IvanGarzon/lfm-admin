import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { QuoteList } from '@/features/finances/quotes/components/quote-list';
import { QuoteDrawer } from '@/features/finances/quotes/components/quote-drawer';
import { getQuotes } from '@/actions/quotes';

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
    <Shell className="gap-2" scrollable>
      <QuoteList data={result.data} searchParams={searchParamsResolved} />
      {id ? <QuoteDrawer key={id} id={id} open={true} /> : null}
    </Shell>
  );
}
