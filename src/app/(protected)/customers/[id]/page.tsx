import { CustomerDrawer } from '@/features/customers/components/customer-drawer';
import { getCustomers } from '@/actions/customers/queries';
import { Shell } from '@/components/shared/shell';
import { CustomersList } from '@/features/customers/components/customers-list';
import { SearchParams } from 'nuqs/server';

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const searchParamsResolved = await searchParams;
  const result = await getCustomers(searchParamsResolved);

  if (!result.success) {
    throw new Error(result.error);
  }

  return (
    <Shell scrollable>
      <CustomersList initialData={result.data} searchParams={searchParamsResolved} />
      <CustomerDrawer id={id} />
    </Shell>
  );
}
