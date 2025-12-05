import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getInvoices } from '@/actions/invoices';
import { InvoiceList } from '@/features/finances/invoices/components/invoice-list';

export const metadata = constructMetadata({
  title: 'Invoices – lfm dashboard',
  description: 'Manage your invoices and track payments.',
});

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getInvoices(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <InvoiceList data={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
