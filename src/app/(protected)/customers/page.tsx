import { SearchParams } from 'nuqs/server';
import { constructMetadata } from '@/lib/utils';
import { Shell } from '@/components/shared/shell';
import { CustomersList } from '@/features/customers/components/customers-list';
import { getCustomers } from '@/actions/customers/queries';

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
