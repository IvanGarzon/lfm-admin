import { SearchParams } from 'nuqs/server';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getInvoices } from '@/actions/invoices';
import { InvoicesView } from '@/features/finances/invoices/components/invoices-view';

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
      <InvoicesView initialData={result.data} searchParams={searchParamsResolved} />
    </Shell>
  );
}
