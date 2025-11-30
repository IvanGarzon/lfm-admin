import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { getInvoices } from '@/actions/invoices';

import dynamic from 'next/dynamic';
import { InvoiceList } from '@/features/finances/invoices/components/invoice-list';
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
    <Shell className="gap-2" scrollable>
      <InvoiceList data={result.data} searchParams={searchParamsResolved} />
      {id ? <InvoiceDrawer key={id} id={id} open={true} /> : null}
    </Shell>
  );
}
