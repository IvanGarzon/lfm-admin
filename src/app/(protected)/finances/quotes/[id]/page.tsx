import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { QuotesView } from '@/features/finances/quotes/components/quotes-view';
import { getQuotes } from '@/actions/finances/quotes/queries';
import { getQueryClient } from '@/lib/query-client';
import { QUOTE_KEYS } from '@/features/finances/quotes/constants/query-keys';
import { searchParamsCache } from '@/filters/quotes/quotes-filters';

export const metadata = {
  title: 'Quote Detail | Finance'
};

const QuoteDrawer = dynamic(
  () => import('@/features/finances/quotes/components/quote-drawer').then((mod) => mod.QuoteDrawer),
  {
    loading: () => null
  }
);

export default async function QuotePage({
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
        {id ? <QuoteDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
