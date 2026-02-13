import { SearchParams } from 'nuqs/server';
import { CustomersList } from '@/features/crm/customers/components/customers-list';
import { Shell } from '@/components/shared/shell';
import { constructMetadata } from '@/lib/utils';
import { getCustomers } from '@/actions/crm/customers/queries';

export const metadata = constructMetadata({
  title: 'Customers – lfm dashboard',
  description: 'Manage your customers and view their details.',
});

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParamsResolved = await searchParams;
  const result = await getCustomers(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <CustomersList initialData={result.data} searchParams={searchParamsResolved}></CustomersList>
    </Shell>
  );
}
