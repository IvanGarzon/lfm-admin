import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { getInvoices } from '@/actions/invoices';
import { InvoicesView } from '@/features/finances/invoices/components/invoices-view';
import dynamic from 'next/dynamic';
const InvoiceDrawer = dynamic(
  () =>
    import('@/features/finances/invoices/components/invoice-drawer').then(
      (mod) => mod.InvoiceDrawer,
    ),
  {
    loading: () => null,
  },
);

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getInvoices(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <InvoicesView initialData={result.data} searchParams={searchParamsResolved} />
      {id ? <InvoiceDrawer key={id} id={id} open={true} /> : null}
    </Shell>
  );
}
