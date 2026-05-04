import dynamic from 'next/dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { getInvoices, getInvoiceById } from '@/actions/finances/invoices/queries';
import { getQueryClient } from '@/lib/query-client';
import { InvoicesView } from '@/features/finances/invoices/components/invoices-view';
import { INVOICE_KEYS } from '@/features/finances/invoices/constants/query-keys';
import { searchParamsCache } from '@/filters/invoices/invoices-filters';

export const metadata = {
  title: 'Invoice Detail | Finance'
};

const InvoiceDrawer = dynamic(
  () =>
    import('@/features/finances/invoices/components/invoice-drawer').then(
      (mod) => mod.InvoiceDrawer
    ),
  {
    loading: () => null
  }
);

export default async function InvoicePage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const filters = searchParamsCache.parse(searchParamsResolved);
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: INVOICE_KEYS.list(filters),
      queryFn: async () => {
        const result = await getInvoices(filters);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      }
    }),
    queryClient.prefetchQuery({
      queryKey: INVOICE_KEYS.detail(id),
      queryFn: async () => {
        const result = await getInvoiceById(id);
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.data;
      }
    })
  ]);

  return (
    <Shell scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <InvoicesView searchParams={searchParamsResolved} />
        {id ? <InvoiceDrawer id={id} open={true} /> : null}
      </HydrationBoundary>
    </Shell>
  );
}
