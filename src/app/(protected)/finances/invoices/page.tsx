import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getInvoices } from '@/actions/finances/invoices/queries';
import { InvoicesView } from '@/features/finances/invoices/components/invoices-view';
import { getQueryClient } from '@/lib/query-client';
import { INVOICE_KEYS } from '@/features/finances/invoices/constants/query-keys';
export const metadata = constructMetadata({
  title: 'Invoices – lfm dashboard',
  description: 'Manage your invoices and track payments.'
});

export default async function InvoicesPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: INVOICE_KEYS.list(searchParamsResolved),
    queryFn: async () => {
      const result = await getInvoices(searchParamsResolved);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    }
  });

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <InvoicesView searchParams={searchParamsResolved} />
      </HydrationBoundary>
    </Shell>
  );
}
