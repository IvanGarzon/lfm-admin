import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getQuotes } from '@/actions/finances/quotes/queries';
import { QuotesView } from '@/features/finances/quotes/components/quotes-view';
import { getQueryClient } from '@/lib/query-client';
import { QUOTE_KEYS } from '@/features/finances/quotes/constants/query-keys';
import { searchParamsCache } from '@/filters/quotes/quotes-filters';

export const metadata = constructMetadata({
  title: 'Quotes – lfm dashboard',
  description: 'Manage your quotes and track conversions.'
});

export default async function QuotesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const filters = searchParamsCache.parse(rawParams);
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: QUOTE_KEYS.list(filters),
    queryFn: async () => {
      const result = await getQuotes(filters);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <QuotesView />
      </HydrationBoundary>
    </Shell>
  );
}
