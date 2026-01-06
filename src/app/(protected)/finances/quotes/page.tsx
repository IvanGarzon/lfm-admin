import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getQuotes } from '@/actions/quotes';
import { QuotesView } from '@/features/finances/quotes/components/quotes-view';

export const metadata = constructMetadata({
  title: 'Quotes – lfm dashboard',
  description: 'Manage your quotes and track conversions.',
});

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getQuotes(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <QuotesView initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
